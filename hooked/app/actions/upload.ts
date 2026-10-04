"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { allow } from "@/lib/ratelimit";
import { checkText } from "@/lib/moderation";
import { CATEGORIES, isCategory } from "@/lib/categories";
import { similarStory } from "@/lib/queries";
import { aiEnabled, askJSON } from "@/lib/ai";
import { MAX_CHARS, MIN_CHARS, charCount, clampPaywall, heuristicTitles, preview, splitParagraphs, suggestPaywall, type UploadAnalysis } from "@/lib/upload";

const MAX_FILE = 4 * 1024 * 1024;

export async function parseUpload(form: FormData): Promise<{ error?: string; paragraphs?: string[]; name?: string }> {
  const user = await getUser();
  if (!user) return { error: "请先登录" };
  const file = form.get("file");
  let raw = String(form.get("text") ?? "");
  let name = "";
  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_FILE) return { error: "文件不能超过 4 MB" };
    name = file.name;
    const lower = file.name.toLowerCase();
    const buf = Buffer.from(await file.arrayBuffer());
    if (lower.endsWith(".docx")) {
      try {
        const mammoth = await import("mammoth");
        raw = (await mammoth.extractRawText({ buffer: buf })).value;
      } catch {
        return { error: "这个 Word 文件读不出来，可以另存为 .docx 再试，或直接粘贴正文" };
      }
    } else if (lower.endsWith(".txt") || lower.endsWith(".md")) {
      raw = buf.toString("utf8").replace(/^﻿/, "");
      if (lower.endsWith(".md")) raw = raw.replace(/^#+\s*/gm, "").replace(/[*_`>]/g, "");
    } else return { error: "只支持 .txt、.md 和 .docx 文件" };
  }
  const paragraphs = splitParagraphs(raw);
  const n = charCount(paragraphs);
  if (n < MIN_CHARS) return { error: `正文至少 ${MIN_CHARS} 字，现在只有 ${n} 字` };
  if (n > MAX_CHARS) return { error: `正文不能超过 ${MAX_CHARS.toLocaleString()} 字，现在有 ${n.toLocaleString()} 字` };
  return { paragraphs, name };
}

export type AnalyzeResult = { error?: string; analysis?: UploadAnalysis; dup?: { id: string; title: string; sim: number } | null; questions?: { id: string; title: string; category: string }[] };

export async function analyzeUpload(paragraphs: string[], preferredQuestionId: string | null): Promise<AnalyzeResult> {
  const user = await getUser();
  if (!user) return { error: "请先登录" };
  if (!Array.isArray(paragraphs) || paragraphs.length < 2) return { error: "正文太短" };
  const ps = paragraphs.map(String).slice(0, 2000);
  const questions = await db.question.findMany({
    where: { hidden: false },
    orderBy: [{ waits: { _count: "desc" } }, { createdAt: "desc" }],
    take: 60,
    select: { id: true, title: true, category: true },
  });
  if (preferredQuestionId && !questions.some((q) => q.id === preferredQuestionId)) {
    const pq = await db.question.findUnique({ where: { id: preferredQuestionId }, select: { id: true, title: true, category: true } });
    if (pq) questions.unshift(pq);
  }
  const dup = await similarStory(preview(ps));
  const fallback = (): UploadAnalysis => {
    const pq = questions.find((q) => q.id === preferredQuestionId);
    return {
      titles: heuristicTitles(ps),
      line: ps[0].slice(0, 40),
      category: pq?.category ?? "离奇故事",
      questionId: pq?.id ?? null,
      newQuestion: "",
      paywallAfter: suggestPaywall(ps),
      hookOk: ps.slice(0, 3).join("").length > 40,
      notes: ["AI 未开启，以上是按规则给出的建议，请自己检查标题和付费点。"],
      source: "rules",
    };
  };
  if (!aiEnabled() || !(await allow(`ai:up:${user.id}`, 10, 3600))) return { analysis: fallback(), dup, questions };
  const numbered = ps.map((p, i) => `[${i + 1}] ${p.slice(0, 220)}`).join("\n").slice(0, 24000);
  const qlist = questions.map((q) => `${q.id} | ${q.category} | ${q.title}`).join("\n");
  try {
    const r = await askJSON<{
      titles?: string[]; line?: string; category?: string; qid?: string | null; newQuestion?: string; cut?: number; hookOk?: boolean; notes?: string[];
    }>({
      maxTokens: 1200,
      system: `你是短篇故事平台的资深编辑。作者上传了一篇写好的故事，你要帮他准备上线。平台上每个故事都挂在一个读者问题下面，问题是钩子。
输出 JSON：{"titles":[3 个标题，每个不超过 25 字，有第一人称或具体身份、有钩子、不夸大],"line":"一句话故事，不超过 40 字","category":"从这些题材中选一个：${CATEGORIES.join("、")}","qid":"最匹配的已有问题 id，没有合适的填 null","newQuestion":"qid 为 null 时，写一个能引出这个故事的新问题，不超过 30 字，用“你”提问","cut":付费点放在第几段之后（整数，通常在全文 20%–35% 处，放在悬念最强、读者最想知道后面发生什么的那一段之后）,"hookOk":前三段有没有钩子（布尔）,"notes":[最多 3 条具体修改建议]}`,
      prompt: `已有问题（id | 题材 | 问题）：\n${qlist}\n${preferredQuestionId ? `作者希望挂在问题 ${preferredQuestionId} 下，除非明显不合适。\n` : ""}\n正文（共 ${ps.length} 段，已编号）：\n${numbered}`,
    });
    const qid = r.qid && questions.some((q) => q.id === r.qid) ? r.qid : null;
    const titles = (r.titles ?? []).map(String).map((t) => t.trim()).filter(Boolean).slice(0, 3);
    return {
      analysis: {
        titles: titles.length ? titles : heuristicTitles(ps),
        line: String(r.line ?? "").slice(0, 60),
        category: r.category && isCategory(r.category) ? r.category : (questions.find((q) => q.id === qid)?.category ?? "离奇故事"),
        questionId: qid,
        newQuestion: qid ? "" : String(r.newQuestion ?? "").slice(0, 60),
        paywallAfter: clampPaywall(Number(r.cut) || suggestPaywall(ps), ps.length),
        hookOk: !!r.hookOk,
        notes: (r.notes ?? []).map(String).slice(0, 3),
        source: "ai",
      },
      dup,
      questions,
    };
  } catch {
    const fb = fallback();
    fb.notes = ["AI 分析暂时失败，以上是按规则给出的建议。可以稍后重新分析。"];
    return { analysis: fb, dup, questions };
  }
}

const submitSchema = z.object({
  paragraphs: z.array(z.string().min(1).max(5000)).min(2).max(2000),
  title: z.string().trim().min(4, "标题至少 4 个字").max(40, "标题不能超过 40 个字"),
  questionId: z.string().nullable(),
  newQuestion: z.string().trim().max(60),
  category: z.string(),
  line: z.string().max(80),
  paywallAfter: z.number().int(),
  aiUsage: z.enum(["none", "polish", "draft"]),
  rights: z.literal(true, { message: "需要确认作品是原创或已获授权" }),
  label: z.literal(true, { message: "需要同意把作品标注为故事" }),
  analysis: z.unknown().optional(),
  dupScore: z.number().min(0).max(1).default(0),
  dupStoryId: z.string().nullable().default(null),
  editId: z.string().nullable().default(null),
});

export async function submitUpload(input: z.input<typeof submitSchema>): Promise<{ error?: string }> {
  const user = await getUser();
  if (!user) return { error: "请先登录" };
  const p = submitSchema.safeParse(input);
  if (!p.success) return { error: p.error.issues[0].message };
  const d = p.data;
  if (charCount(d.paragraphs) < MIN_CHARS) return { error: `正文至少 ${MIN_CHARS} 字` };
  if (!isCategory(d.category)) return { error: "请选择题材" };
  const tBad = checkText(d.title, { min: 4, max: 40 });
  if (tBad) return { error: `标题：${tBad}` };
  if (!d.questionId) {
    const qBad = checkText(d.newQuestion, { min: 6, max: 60 });
    if (qBad) return { error: `新问题：${qBad}` };
  } else if (!(await db.question.findUnique({ where: { id: d.questionId } }))) return { error: "选择的问题不存在" };
  if (!(await allow(`submit:${user.id}`, 10, 86400))) return { error: "今天提交的作品有点多了，明天再来" };
  const data = {
    title: d.title,
    paragraphs: d.paragraphs,
    paywallAfter: clampPaywall(d.paywallAfter, d.paragraphs.length),
    questionId: d.questionId,
    newQuestion: d.questionId ? null : d.newQuestion,
    category: d.category,
    line: d.line,
    aiUsage: d.aiUsage,
    aiAnalysis: (d.analysis ?? undefined) as object | undefined,
    dupScore: d.dupScore,
    dupStoryId: d.dupStoryId,
    status: "REVIEWING" as const,
    reviewNote: null,
  };
  if (d.editId) {
    const own = await db.submission.findFirst({ where: { id: d.editId, authorId: user.id, status: "CHANGES_REQUESTED" } });
    if (!own) return { error: "这份投稿现在不能修改" };
    await db.submission.update({ where: { id: own.id }, data });
  } else {
    await db.submission.create({ data: { ...data, authorId: user.id } });
  }
  redirect("/me/submissions?sent=1");
}
