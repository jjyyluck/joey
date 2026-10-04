"use server";
import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { db } from "@/lib/db";
import { requireEditor, requireUser } from "@/lib/auth";
import { allow } from "@/lib/ratelimit";
import { assess, storyMetrics } from "@/lib/adaptation";
import { AUTHOR_SHARE, authorCut, evaluate } from "@/lib/adaptation-rules";
import { checkText } from "@/lib/moderation";

export async function applyAdaptation(storyId: string, form: FormData) {
  const user = await requireUser(`/adapt/${storyId}`);
  const back = (e: string) => redirect(`/adapt/${storyId}?err=${encodeURIComponent(e)}`);
  const story = await db.story.findUnique({ where: { id: storyId }, include: { adaptation: true } });
  if (!story || story.authorId !== user.id || story.status !== "PUBLISHED") redirect("/me/adaptations");
  if (story.adaptation && story.adaptation.status !== "DECLINED") redirect("/me/adaptations");
  if (form.get("rights") !== "on" || form.get("terms") !== "on") back("请确认改编授权并同意分成条款");
  const notes = String(form.get("notes") ?? "").trim();
  if (notes) {
    const bad = checkText(notes, { max: 500 });
    if (bad) back(`补充说明：${bad}`);
  }
  const metrics = await storyMetrics(storyId);
  const ev = evaluate(metrics!, undefined, story.adaptInvited);
  if (!ev.eligible) back("这篇作品还没有达到申请标准");
  if (!(await allow(`adapt:${user.id}`, 5, 86400))) back("今天提交的申请有点多了，明天再来");
  const aiAssessment = await assess(story.paragraphs, story.title);
  const data = {
    authorId: user.id,
    status: "APPLIED" as const,
    sharePct: AUTHOR_SHARE,
    notes,
    metrics: { ...metrics!, invited: story.adaptInvited },
    aiAssessment: aiAssessment ?? undefined,
    editorNote: null,
  };
  if (story.adaptation) await db.adaptation.update({ where: { id: story.adaptation.id }, data });
  else await db.adaptation.create({ data: { ...data, storyId } });
  redirect("/me/adaptations?sent=1");
}

async function notifyAuthor(adaptationId: string, body: (title: string) => string) {
  const a = await db.adaptation.findUnique({ where: { id: adaptationId }, include: { story: { select: { title: true } } } });
  if (a) await db.notification.create({ data: { userId: a.authorId, body: body(a.story.title), href: "/me/adaptations" } });
}

export async function decideAdaptation(id: string, form: FormData) {
  const editor = await requireEditor();
  const decision = String(form.get("decision"));
  const note = String(form.get("note") ?? "").trim().slice(0, 500);
  const a = await db.adaptation.findUnique({ where: { id } });
  if (!a || a.status !== "APPLIED") redirect("/editor/adaptations");
  if (decision === "decline" && !note) redirect(`/editor/adaptations/${id}?err=note`);
  const status = decision === "accept" ? "ACCEPTED" : "DECLINED";
  await db.adaptation.update({ where: { id }, data: { status, editorNote: note || null, reviewerId: editor.id } });
  await notifyAuthor(id, (t) =>
    status === "ACCEPTED" ? `《${t}》的 AI 漫剧改编申请已通过，作者分成 ${Math.round(a.sharePct * 100)}%。` : `《${t}》的 AI 漫剧改编申请未通过：${note.slice(0, 60)}`,
  );
  redirect(`/editor/adaptations/${id}`);
}

export async function advanceAdaptation(id: string, form: FormData) {
  await requireEditor();
  const a = await db.adaptation.findUnique({ where: { id } });
  if (!a) redirect("/editor/adaptations");
  if (a.status === "ACCEPTED") {
    await db.adaptation.update({ where: { id }, data: { status: "IN_PRODUCTION" } });
    await notifyAuthor(id, (t) => `《${t}》的 AI 漫剧已开始制作。`);
  } else if (a.status === "IN_PRODUCTION") {
    const url = String(form.get("releaseUrl") ?? "").trim();
    if (!/^https:\/\/\S+$/.test(url)) redirect(`/editor/adaptations/${id}?err=url`);
    await db.adaptation.update({ where: { id }, data: { status: "RELEASED", releaseUrl: url } });
    await notifyAuthor(id, (t) => `《${t}》的 AI 漫剧已上线，之后每月的分成会显示在“漫剧”页。`);
  }
  redirect(`/editor/adaptations/${id}`);
}

export async function addRevenue(id: string, form: FormData) {
  await requireEditor();
  const a = await db.adaptation.findUnique({ where: { id } });
  if (!a || a.status !== "RELEASED") redirect("/editor/adaptations");
  const month = String(form.get("month") ?? "");
  const net = Number(String(form.get("net") ?? "").replace(/[$,\s]/g, ""));
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month) || !Number.isFinite(net)) redirect(`/editor/adaptations/${id}?err=revenue`);
  const netCents = Math.round(net * 100);
  const authorCents = authorCut(netCents, a.sharePct);
  const m = new Date(`${month}-01T00:00:00Z`);
  await db.adaptationRevenue.upsert({
    where: { adaptationId_month: { adaptationId: id, month: m } },
    create: { adaptationId: id, month: m, netCents, authorCents, note: String(form.get("note") ?? "").slice(0, 200) },
    update: { netCents, authorCents, note: String(form.get("note") ?? "").slice(0, 200) },
  });
  await notifyAuthor(id, (t) => `《${t}》漫剧 ${month} 的分成已入账：$${(authorCents / 100).toFixed(2)}。`);
  redirect(`/editor/adaptations/${id}`);
}

export async function inviteAdaptation(storyId: string) {
  await requireEditor();
  const s = await db.story.findUnique({ where: { id: storyId }, select: { authorId: true, title: true } });
  if (!s?.authorId) return;
  await db.story.update({ where: { id: storyId }, data: { adaptInvited: true } });
  await db.notification.create({
    data: { userId: s.authorId, body: `编辑邀请你为《${s.title}》申请 AI 漫剧改编。`, href: `/adapt/${storyId}` },
  });
  refresh();
}
