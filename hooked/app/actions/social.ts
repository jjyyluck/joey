"use server";
import { refresh } from "next/cache";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { allow } from "@/lib/ratelimit";
import { checkText } from "@/lib/moderation";

export async function toggleStoryLike(storyId: string): Promise<{ error?: string; on?: boolean; count?: number }> {
  const user = await getUser();
  if (!user) return { error: "登录后才能点赞" };
  const key = { userId_storyId: { userId: user.id, storyId } };
  const has = await db.storyLike.findUnique({ where: key });
  if (has) await db.storyLike.delete({ where: key });
  else {
    if (!(await db.story.findUnique({ where: { id: storyId }, select: { id: true } }))) return { error: "找不到这个故事" };
    await db.storyLike.create({ data: { userId: user.id, storyId } });
  }
  return { on: !has, count: await db.storyLike.count({ where: { storyId } }) };
}

export type ThreadComment = {
  id: string;
  body: string;
  name: string;
  userId: string;
  at: string;
  likes: number;
  liked: boolean;
  mine: boolean;
  replies: ThreadComment[];
  replyCount: number;
};

const PAGE = 20;

export async function listStoryComments(storyId: string, sort: "hot" | "new", page = 0): Promise<{ items: ThreadComment[]; hasMore: boolean; total: number }> {
  const user = await getUser();
  const where = { storyId, paragraph: null, parentId: null, hidden: false };
  const include = {
    user: { select: { name: true } },
    _count: { select: { likes: true, replies: { where: { hidden: false } } } },
    likes: user ? { where: { userId: user.id }, select: { userId: true } } : false,
    replies: {
      where: { hidden: false },
      orderBy: { createdAt: "asc" as const },
      take: 3,
      include: {
        user: { select: { name: true } },
        _count: { select: { likes: true } },
        likes: user ? { where: { userId: user.id }, select: { userId: true } } : false,
      },
    },
  };
  const [rows, total] = await Promise.all([
    db.comment.findMany({
      where,
      include,
      orderBy: sort === "hot" ? [{ likes: { _count: "desc" } }, { createdAt: "desc" }] : { createdAt: "desc" },
      skip: page * PAGE,
      take: PAGE + 1,
    }),
    db.comment.count({ where: { storyId, paragraph: null, hidden: false } }),
  ]);
  type Row = { id: string; body: string; userId: string; createdAt: Date; user: { name: string }; _count: { likes: number }; likes?: { userId: string }[] | false };
  const view = (c: Row, replies: ThreadComment[] = [], replyCount = 0): ThreadComment => ({
    id: c.id,
    body: c.body,
    name: c.user.name,
    userId: c.userId,
    at: c.createdAt.toISOString(),
    likes: c._count.likes,
    liked: Array.isArray(c.likes) && c.likes.length > 0,
    mine: c.userId === user?.id,
    replies,
    replyCount,
  });
  return {
    items: rows.slice(0, PAGE).map((c) => view(c as unknown as Row, (c.replies as unknown as Row[]).map((r) => view(r)), c._count.replies)),
    hasMore: rows.length > PAGE,
    total,
  };
}

export async function listReplies(parentId: string): Promise<ThreadComment[]> {
  const user = await getUser();
  const rows = await db.comment.findMany({
    where: { parentId, hidden: false },
    orderBy: { createdAt: "asc" },
    take: 200,
    include: { user: { select: { name: true } }, _count: { select: { likes: true } }, likes: user ? { where: { userId: user.id }, select: { userId: true } } : false },
  });
  return rows.map((c) => ({
    id: c.id,
    body: c.body,
    name: c.user.name,
    userId: c.userId,
    at: c.createdAt.toISOString(),
    likes: c._count.likes,
    liked: Array.isArray(c.likes) && c.likes.length > 0,
    mine: c.userId === user?.id,
    replies: [],
    replyCount: 0,
  }));
}

export async function addStoryComment(storyId: string, body: string, parentId: string | null): Promise<{ error?: string }> {
  const user = await getUser();
  if (!user) return { error: "登录后才能评论" };
  const bad = checkText(body, { max: 500 });
  if (bad) return { error: bad };
  if (!(await allow(`cm:${user.id}`, 20, 600))) return { error: "发得太快了，休息几分钟再来" };
  const story = await db.story.findUnique({ where: { id: storyId }, select: { id: true, title: true, authorId: true } });
  if (!story) return { error: "找不到这个故事" };
  let parent: { id: string; userId: string; storyId: string; parentId: string | null } | null = null;
  if (parentId) {
    parent = await db.comment.findUnique({ where: { id: parentId }, select: { id: true, userId: true, storyId: true, parentId: true } });
    if (!parent || parent.storyId !== storyId) return { error: "要回复的评论不存在" };
    // Keep threads one level deep: replying to a reply attaches to its top-level comment.
    if (parent.parentId) parentId = parent.parentId;
  }
  await db.comment.create({ data: { storyId, paragraph: null, parentId, userId: user.id, body: body.trim() } });
  const href = `/s/${storyId}#comments`;
  if (parent && parent.userId !== user.id)
    await db.notification.create({ data: { userId: parent.userId, body: `${user.name} 回复了你的评论：${body.trim().slice(0, 40)}`, href } });
  else if (!parent && story.authorId && story.authorId !== user.id)
    await db.notification.create({ data: { userId: story.authorId, body: `${user.name} 评论了你的故事《${story.title}》：${body.trim().slice(0, 40)}`, href } });
  refresh();
  return {};
}

export async function toggleCommentLike(commentId: string): Promise<{ error?: string; on?: boolean; count?: number }> {
  const user = await getUser();
  if (!user) return { error: "登录后才能点赞" };
  const key = { userId_commentId: { userId: user.id, commentId } };
  const has = await db.commentLike.findUnique({ where: key });
  if (has) await db.commentLike.delete({ where: key });
  else {
    if (!(await db.comment.findUnique({ where: { id: commentId }, select: { id: true } }))) return { error: "评论不存在" };
    await db.commentLike.create({ data: { userId: user.id, commentId } });
  }
  return { on: !has, count: await db.commentLike.count({ where: { commentId } }) };
}

export async function deleteMyComment(commentId: string): Promise<{ error?: string }> {
  const user = await getUser();
  if (!user) return { error: "请先登录" };
  const c = await db.comment.findUnique({ where: { id: commentId }, select: { userId: true } });
  if (!c || c.userId !== user.id) return { error: "只能删除自己的评论" };
  await db.comment.update({ where: { id: commentId }, data: { hidden: true } });
  return {};
}
