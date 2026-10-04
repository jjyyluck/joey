import "server-only";
import { db } from "./db";
import { addDays, easternDay } from "./time";

export type Rec = { id: string; title: string; questionTitle: string; category: string; authorName: string; reason: string };

const pick = { id: true, title: true, authorName: true, question: { select: { title: true, category: true } } } as const;

/**
 * Related stories for the end of the reader, in priority order:
 * other answers to the same question → same author → read by the same people → popular in the same category → popular overall.
 * Stories the signed-in reader already finished are skipped.
 */
export async function related(story: { id: string; questionId: string; authorId: string | null; category: string }, userId: string | null, limit = 6): Promise<Rec[]> {
  const seen = new Set<string>([story.id]);
  if (userId) {
    const done = await db.readEvent.findMany({ where: { userId, finished: true }, select: { storyId: true }, take: 500 });
    done.forEach((d) => seen.add(d.storyId));
  }
  const out: Rec[] = [];
  const add = (rows: { id: string; title: string; authorName: string; question: { title: string; category: string } }[], reason: string, max: number) => {
    let n = 0;
    for (const r of rows) {
      if (out.length >= limit || n >= max) break;
      if (seen.has(r.id)) continue;
      seen.add(r.id);
      out.push({ id: r.id, title: r.title, authorName: r.authorName, questionTitle: r.question.title, category: r.question.category, reason });
      n++;
    }
  };
  const live = { status: "PUBLISHED" as const };

  add(await db.story.findMany({ where: { ...live, questionId: story.questionId }, select: pick, orderBy: { reads: { _count: "desc" } }, take: 6 }), "同一个问题的其他回答", 2);

  if (story.authorId)
    add(await db.story.findMany({ where: { ...live, authorId: story.authorId }, select: pick, orderBy: { publishedAt: "desc" }, take: 6 }), "同一位作者", 2);

  const since = addDays(easternDay(), -30);
  const co = await db.$queryRaw<{ storyId: string; c: bigint }[]>`
    SELECT r2."storyId", COUNT(*) AS c
    FROM "ReadEvent" r1 JOIN "ReadEvent" r2 ON r2."visitorId" = r1."visitorId" AND r2."storyId" <> r1."storyId"
    WHERE r1."storyId" = ${story.id} AND r1.day >= ${since} AND r2.day >= ${since}
    GROUP BY r2."storyId" ORDER BY c DESC LIMIT 12`;
  if (co.length) {
    const rows = await db.story.findMany({ where: { ...live, id: { in: co.map((c) => c.storyId) } }, select: pick });
    const order = new Map(co.map((c, i) => [c.storyId, i]));
    add(rows.sort((a, b) => order.get(a.id)! - order.get(b.id)!), "读过这篇的人还在读", 3);
  }

  if (out.length < limit)
    add(
      await db.story.findMany({
        where: { ...live, question: { category: story.category } },
        select: pick,
        orderBy: { reads: { _count: "desc" } },
        take: 30,
      }),
      `${story.category} 热门`,
      limit,
    );
  if (out.length < limit)
    add(await db.story.findMany({ where: live, select: pick, orderBy: { reads: { _count: "desc" } }, take: 30 }), "大家都在读", limit);
  return out;
}
