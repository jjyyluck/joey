"use server";
import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { allow } from "@/lib/ratelimit";
import { checkText } from "@/lib/moderation";
import { isCategory } from "@/lib/categories";
import { similarQuestions } from "@/lib/queries";
import { aiEnabled, askJSON } from "@/lib/ai";

export async function toggleWait(questionId: string): Promise<{ error?: string; on?: boolean }> {
  const user = await getUser();
  if (!user) return { error: "登录后才能坐等" };
  const key = { userId_questionId: { userId: user.id, questionId } };
  const has = await db.wait.findUnique({ where: key });
  if (has) await db.wait.delete({ where: key });
  else await db.wait.create({ data: { userId: user.id, questionId } });
  refresh();
  return { on: !has };
}

export async function rewriteQuestion(text: string): Promise<{ error?: string; options?: string[]; ai?: boolean }> {
  const user = await getUser();
  if (!user) return { error: "登录后才能使用 AI 改写" };
  const bad = checkText(text, { min: 4, max: 120 });
  if (bad) return { error: bad };
  const base = text.trim().replace(/[？?。.！!]+$/, "");
  if (!aiEnabled() || !(await allow(`ai:q:${user.id}`, 20, 3600))) {
    return { options: [`你什么时候发现，${base}？`, `关于“${base.slice(0, 14)}”，你经历过最离谱的一次是什么？`, `${base}，后来怎么样了？`], ai: false };
  }
  try {
    const arr = await askJSON<string[]>({
      tier: "quick",
      maxTokens: 400,
      system:
        "你是故事问答平台的选题编辑。读者提出一个问题，希望引出别人讲述自己的经历。把用户的话改写成 3 个更容易引出好故事的问题。每个不超过 30 个汉字，用“你”提问，有具体情境和冲突，不夸大，不涉及真实人名。输出 JSON 字符串数组。",
      prompt: text.trim(),
    });
    const options = (Array.isArray(arr) ? arr : []).map(String).map((s) => s.trim()).filter(Boolean).slice(0, 3);
    if (!options.length) throw new Error("empty");
    return { options, ai: true };
  } catch {
    return { error: "AI 暂时不可用，可以直接发布你的原话" };
  }
}

export type AskState = { error?: string; similar?: { id: string; title: string }[]; title?: string; category?: string };

export async function askQuestion(_: AskState, form: FormData): Promise<AskState> {
  const user = await getUser();
  if (!user) redirect("/login?next=/ask");
  const title = String(form.get("title") ?? "").trim();
  const category = String(form.get("category") ?? "");
  const force = form.get("force") === "1";
  const bad = checkText(title, { min: 6, max: 60 });
  if (bad) return { error: bad, title, category };
  if (!isCategory(category)) return { error: "请选择一个题材", title, category };
  if (!force) {
    const similar = await similarQuestions(title);
    if (similar.length) return { similar: similar.map(({ id, title }) => ({ id, title })), title, category };
  }
  if (!(await allow(`ask:${user.id}`, 10, 86400))) return { error: "今天提的问题有点多了，明天再来", title, category };
  const q = await db.question.create({ data: { title, category, askerId: user.id } });
  await db.wait.create({ data: { userId: user.id, questionId: q.id } });
  redirect(`/q/${q.id}?asked=1`);
}
