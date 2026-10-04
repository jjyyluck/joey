"use server";
import { refresh } from "next/cache";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { visitorId } from "@/lib/visitor";
import { easternDay } from "@/lib/time";
import { allow } from "@/lib/ratelimit";
import { checkText } from "@/lib/moderation";

export async function recordRead(storyId: string, maxPara: number, finished: boolean) {
  const user = await getUser();
  const vid = user?.id ?? (await visitorId());
  if (!vid) return;
  const story = await db.story.findUnique({ where: { id: storyId }, select: { paragraphs: true } });
  if (!story) return;
  const mp = Math.max(0, Math.min(Math.floor(maxPara), story.paragraphs.length));
  const day = easternDay();
  await db.$executeRaw`
    INSERT INTO "ReadEvent" ("id","storyId","userId","visitorId","day","maxPara","finished","createdAt")
    VALUES (${crypto.randomUUID()}, ${storyId}, ${user?.id ?? null}, ${vid}, ${day}, ${mp}, ${finished}, now())
    ON CONFLICT ("storyId","visitorId","day") DO UPDATE SET
      "maxPara" = GREATEST("ReadEvent"."maxPara", EXCLUDED."maxPara"),
      "finished" = "ReadEvent"."finished" OR EXCLUDED."finished"`;
}

export type CommentView = { id: string; body: string; name: string; mine: boolean; at: string };

export async function listComments(storyId: string, paragraph: number): Promise<CommentView[]> {
  const user = await getUser();
  const rows = await db.comment.findMany({
    where: { storyId, paragraph, hidden: false },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { user: { select: { name: true } } },
  });
  return rows.map((c) => ({ id: c.id, body: c.body, name: c.user.name, mine: c.userId === user?.id, at: c.createdAt.toISOString() }));
}

export async function addComment(storyId: string, paragraph: number, body: string): Promise<{ error?: string }> {
  const user = await getUser();
  if (!user) return { error: "登录后才能发段评" };
  const bad = checkText(body, { max: 300 });
  if (bad) return { error: bad };
  if (!(await allow(`cm:${user.id}`, 20, 600))) return { error: "发得太快了，休息几分钟再来" };
  const story = await db.story.findUnique({ where: { id: storyId }, select: { paragraphs: true, paywallAfter: true } });
  if (!story || paragraph < 0 || paragraph >= story.paragraphs.length) return { error: "找不到这一段" };
  await db.comment.create({ data: { storyId, paragraph, userId: user.id, body: body.trim() } });
  refresh();
  return {};
}

export async function reportComment(commentId: string, reason: string): Promise<{ error?: string }> {
  const user = await getUser();
  if (!user) return { error: "登录后才能举报" };
  await db.report.upsert({
    where: { commentId_userId: { commentId, userId: user.id } },
    create: { commentId, userId: user.id, reason: reason.slice(0, 200) || "未说明" },
    update: {},
  });
  return {};
}

export async function rateStory(storyId: string, score: number): Promise<{ error?: string }> {
  const user = await getUser();
  if (!user) return { error: "登录后才能打分" };
  if (!Number.isInteger(score) || score < 1 || score > 10) return { error: "分数要在 1 到 10 之间" };
  const story = await db.story.findUnique({ where: { id: storyId }, select: { paywallAfter: true } });
  if (!story) return { error: "找不到这个故事" };
  const read = await db.readEvent.findFirst({ where: { storyId, visitorId: user.id, maxPara: { gte: story.paywallAfter } } });
  if (!read) return { error: "读过付费点之后才能打分" };
  await db.rating.upsert({
    where: { userId_storyId: { userId: user.id, storyId } },
    create: { userId: user.id, storyId, score },
    update: { score },
  });
  refresh();
  return {};
}

export async function toggleBookmark(storyId: string): Promise<{ error?: string; on?: boolean }> {
  const user = await getUser();
  if (!user) return { error: "登录后才能加入书架" };
  const key = { userId_storyId: { userId: user.id, storyId } };
  const has = await db.bookmark.findUnique({ where: key });
  if (has) await db.bookmark.delete({ where: key });
  else await db.bookmark.create({ data: { userId: user.id, storyId } });
  refresh();
  return { on: !has };
}
