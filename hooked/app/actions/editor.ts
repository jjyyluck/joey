"use server";
import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { db } from "@/lib/db";
import { requireEditor } from "@/lib/auth";
import { charCount, clampPaywall, preview } from "@/lib/upload";
import { easternWeekStart } from "@/lib/time";
import { checkText } from "@/lib/moderation";

export async function approveSubmission(id: string, form: FormData) {
  const editor = await requireEditor();
  const sub = await db.submission.findUnique({ where: { id }, include: { author: { select: { name: true } } } });
  if (!sub || sub.status !== "REVIEWING") redirect("/editor");
  const title = String(form.get("title") ?? sub.title).trim() || sub.title;
  const paywallAfter = clampPaywall(Number(form.get("paywallAfter") ?? sub.paywallAfter), sub.paragraphs.length);
  const storyId = await db.$transaction(async (tx) => {
    let questionId = sub.questionId;
    if (!questionId) {
      const q = await tx.question.create({ data: { title: sub.newQuestion ?? title, category: sub.category, askerId: sub.authorId, source: "user" } });
      questionId = q.id;
    }
    const story = await tx.story.create({
      data: {
        questionId,
        authorId: sub.authorId,
        authorName: sub.author.name,
        title,
        paragraphs: sub.paragraphs,
        paywallAfter,
        charCount: charCount(sub.paragraphs),
        preview: preview(sub.paragraphs),
        aiUsage: sub.aiUsage,
      },
    });
    await tx.submission.update({ where: { id }, data: { status: "APPROVED", reviewerId: editor.id, storyId: story.id, questionId, reviewNote: null } });
    await tx.notification.create({ data: { userId: sub.authorId, body: `你的作品《${title}》已通过审核并上线。`, href: `/s/${story.id}` } });
    const q = await tx.question.findUnique({ where: { id: questionId }, select: { title: true, waits: { select: { userId: true } } } });
    const notify = (q?.waits ?? []).map((w) => w.userId).filter((u) => u !== sub.authorId);
    if (notify.length)
      await tx.notification.createMany({
        data: notify.map((userId) => ({ userId, body: `你坐等的问题“${q!.title}”有新故事了：《${title}》`, href: `/s/${story.id}` })),
      });
    const fans = await tx.follow.findMany({ where: { followeeId: sub.authorId }, select: { followerId: true } });
    const fanIds = fans.map((f) => f.followerId).filter((u) => !notify.includes(u));
    if (fanIds.length)
      await tx.notification.createMany({
        data: fanIds.map((userId) => ({ userId, body: `你关注的 ${sub.author.name} 发布了新故事：《${title}》`, href: `/s/${story.id}` })),
      });
    return story.id;
  });
  redirect(`/editor?done=${storyId}`);
}

export async function returnSubmission(id: string, form: FormData) {
  const editor = await requireEditor();
  const decision = String(form.get("decision"));
  const note = String(form.get("note") ?? "").trim();
  if (!note) redirect(`/editor/submissions/${id}?err=note`);
  const sub = await db.submission.findUnique({ where: { id } });
  if (!sub || sub.status !== "REVIEWING") redirect("/editor");
  const status = decision === "reject" ? "REJECTED" : "CHANGES_REQUESTED";
  await db.submission.update({ where: { id }, data: { status, reviewNote: note.slice(0, 500), reviewerId: editor.id } });
  await db.notification.create({
    data: {
      userId: sub.authorId,
      body: status === "REJECTED" ? `你的作品《${sub.title}》未通过审核：${note.slice(0, 80)}` : `你的作品《${sub.title}》需要修改：${note.slice(0, 80)}`,
      href: "/me/submissions",
    },
  });
  redirect("/editor");
}

export async function addPick(form: FormData) {
  const editor = await requireEditor();
  const storyId = String(form.get("storyId") ?? "").trim().split("/").pop() ?? "";
  const blurb = String(form.get("blurb") ?? "").trim();
  const bad = checkText(blurb, { min: 6, max: 60 });
  if (bad) redirect(`/editor/picks?err=${encodeURIComponent("推荐语" + bad)}`);
  const story = await db.story.findFirst({ where: { id: storyId, status: "PUBLISHED" } });
  if (!story) redirect(`/editor/picks?err=${encodeURIComponent("找不到这个故事，请粘贴故事链接或 ID")}`);
  const week = easternWeekStart();
  await db.editorPick.upsert({ where: { storyId_week: { storyId, week } }, create: { storyId, week, blurb, editorId: editor.id }, update: { blurb, editorId: editor.id } });
  redirect("/editor/picks");
}

export async function removePick(id: string) {
  await requireEditor();
  await db.editorPick.delete({ where: { id } });
  refresh();
}

export async function resolveReport(commentId: string, hide: boolean) {
  await requireEditor();
  await db.$transaction([
    db.comment.update({ where: { id: commentId }, data: { hidden: hide } }),
    db.report.updateMany({ where: { commentId }, data: { resolved: true } }),
  ]);
  refresh();
}

export async function setStoryStatus(storyId: string, hidden: boolean) {
  await requireEditor();
  await db.story.update({ where: { id: storyId }, data: { status: hidden ? "HIDDEN" : "PUBLISHED" } });
  refresh();
}
