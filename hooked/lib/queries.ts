import "server-only";
import { db } from "./db";

export const FEED_PAGE = 20;

/** Discover feed: one card per question, showing its best story's opening. */
export async function feed(category: string | null, page: number, followerId: string | null = null) {
  const where = {
    status: "PUBLISHED" as const,
    ...(category ? { question: { category } } : {}),
    ...(followerId ? { author: { followers: { some: { followerId } } } } : {}),
  };
  const stories = await db.story.findMany({
    where,
    orderBy: [{ publishedAt: "desc" }],
    skip: page * FEED_PAGE,
    take: FEED_PAGE + 1,
    select: {
      id: true,
      title: true,
      paragraphs: true,
      authorName: true,
      charCount: true,
      question: { select: { id: true, title: true, category: true, _count: { select: { waits: true } } } },
      _count: { select: { reads: true } },
    },
  });
  return {
    items: stories.slice(0, FEED_PAGE).map((s) => ({
      ...s,
      paragraphs: undefined,
      opening: s.paragraphs.slice(0, 3).join("").slice(0, 120),
    })),
    hasMore: stories.length > FEED_PAGE,
  };
}

export async function questionDetail(id: string) {
  return db.question.findFirst({
    where: { id, hidden: false },
    include: {
      _count: { select: { waits: true } },
      asker: { select: { name: true } },
      stories: {
        where: { status: "PUBLISHED" },
        orderBy: { publishedAt: "desc" },
        select: {
          id: true,
          title: true,
          authorName: true,
          charCount: true,
          paragraphs: true,
          _count: { select: { reads: true, ratings: true } },
        },
      },
    },
  });
}

/** Questions without stories, most-awaited first: the writer's topic list. */
export async function openQuestions(limit = 30) {
  const qs = await db.question.findMany({
    where: { hidden: false, stories: { none: { status: "PUBLISHED" } } },
    include: { _count: { select: { waits: true } } },
    orderBy: [{ waits: { _count: "desc" } }, { createdAt: "desc" }],
    take: limit,
  });
  return qs;
}

export async function similarQuestions(title: string, limit = 3) {
  return db.$queryRaw<{ id: string; title: string; sim: number }[]>`
    SELECT id, title, similarity(title, ${title})::float AS sim
    FROM "Question" WHERE hidden = false AND similarity(title, ${title}) > 0.3
    ORDER BY sim DESC LIMIT ${limit}`;
}

export async function similarStory(text: string) {
  const rows = await db.$queryRaw<{ id: string; title: string; sim: number }[]>`
    SELECT id, title, similarity(preview, ${text})::float AS sim
    FROM "Story" WHERE similarity(preview, ${text}) > 0.2
    ORDER BY sim DESC LIMIT 1`;
  return rows[0] ?? null;
}

export async function unreadCount(userId: string) {
  return db.notification.count({ where: { userId, read: false } });
}
