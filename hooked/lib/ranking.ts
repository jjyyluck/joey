import "server-only";
import { db } from "./db";
import { addDays, easternDay, easternWeekStart } from "./time";
import { bayesian, praiseScore, weekHeat } from "./ranking-math";

export type RankTab = "day" | "week" | "editor" | "praise";
export const RANK_TABS: [RankTab, string][] = [
  ["day", "日榜"],
  ["week", "周榜"],
  ["editor", "编辑推荐"],
  ["praise", "口碑榜"],
];

export const PRAISE_MIN_VOTES = Number(process.env.RANK_PRAISE_MIN_VOTES ?? 30);
export const PRAISE_MIN_COMPLETION = Number(process.env.RANK_PRAISE_MIN_COMPLETION ?? 0.4);
const PRAISE_PRIOR = Number(process.env.RANK_PRAISE_PRIOR ?? 30);

export const RANK_RULES: Record<RankTab, string> = {
  day: "按今天（美东时间）的阅读人数排序，同一个人一天只算一次。",
  week: "按近 7 天热度排序：阅读 ×1、读完 ×3、评论 ×2、收藏 ×2、赞同 ×2。",
  editor: "由编辑每周挑选，不看数据，只看故事好不好。",
  praise: `按读者评分和读完率排序。至少 ${PRAISE_MIN_VOTES} 人评分、读完率 ${Math.round(
    PRAISE_MIN_COMPLETION * 100,
  )}% 以上才能上榜；评分人数少的故事会向全站平均分靠拢。`,
};

const storySelect = {
  id: true,
  title: true,
  authorName: true,
  question: { select: { id: true, title: true, category: true } },
} as const;

type StoryLite = { id: string; title: string; authorName: string; question: { id: string; title: string; category: string } };
export type RankRow = { story: StoryLite; value: number; extra?: { votes?: number; completion?: number; score?: number; blurb?: string; editor?: string } };

async function hydrate(ids: string[]): Promise<Map<string, StoryLite>> {
  const rows = await db.story.findMany({ where: { id: { in: ids }, status: "PUBLISHED" }, select: storySelect });
  return new Map(rows.map((r) => [r.id, r]));
}

export async function dayBoard(limit = 20): Promise<RankRow[]> {
  const day = easternDay();
  const g = await db.readEvent.groupBy({
    by: ["storyId"],
    where: { day },
    _count: { _all: true },
    orderBy: { _count: { storyId: "desc" } },
    take: limit * 2,
  });
  const m = await hydrate(g.map((x) => x.storyId));
  return g.filter((x) => m.has(x.storyId)).slice(0, limit).map((x) => ({ story: m.get(x.storyId)!, value: x._count._all }));
}

export async function weekBoard(limit = 20): Promise<RankRow[]> {
  const since = addDays(easternDay(), -6);
  const sinceTs = addDays(new Date(), -7);
  const [reads, finishes, comments, bookmarks, likes] = await Promise.all([
    db.readEvent.groupBy({ by: ["storyId"], where: { day: { gte: since } }, _count: { _all: true } }),
    db.readEvent.groupBy({ by: ["storyId"], where: { day: { gte: since }, finished: true }, _count: { _all: true } }),
    db.comment.groupBy({ by: ["storyId"], where: { createdAt: { gte: sinceTs }, hidden: false }, _count: { _all: true } }),
    db.bookmark.groupBy({ by: ["storyId"], where: { createdAt: { gte: sinceTs } }, _count: { _all: true } }),
    db.storyLike.groupBy({ by: ["storyId"], where: { createdAt: { gte: sinceTs } }, _count: { _all: true } }),
  ]);
  const acc = new Map<string, { reads: number; finishes: number; comments: number; bookmarks: number; likes: number }>();
  const bump = (id: string, k: "reads" | "finishes" | "comments" | "bookmarks" | "likes", n: number) => {
    const v = acc.get(id) ?? { reads: 0, finishes: 0, comments: 0, bookmarks: 0, likes: 0 };
    v[k] += n;
    acc.set(id, v);
  };
  reads.forEach((r) => bump(r.storyId, "reads", r._count._all));
  finishes.forEach((r) => bump(r.storyId, "finishes", r._count._all));
  comments.forEach((r) => bump(r.storyId, "comments", r._count._all));
  bookmarks.forEach((r) => bump(r.storyId, "bookmarks", r._count._all));
  likes.forEach((r) => bump(r.storyId, "likes", r._count._all));
  const scored = [...acc.entries()].map(([id, v]) => ({ id, h: weekHeat(v) })).sort((a, b) => b.h - a.h).slice(0, limit * 2);
  const m = await hydrate(scored.map((s) => s.id));
  return scored.filter((s) => m.has(s.id)).slice(0, limit).map((s) => ({ story: m.get(s.id)!, value: s.h }));
}

export async function editorBoard(): Promise<RankRow[]> {
  const week = easternWeekStart();
  let picks = await db.editorPick.findMany({
    where: { week },
    include: { story: { select: { ...storySelect, status: true } }, editor: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  });
  if (!picks.length) {
    // Before this week's picks are in, keep showing the most recent week.
    const last = await db.editorPick.findFirst({ orderBy: { week: "desc" }, select: { week: true } });
    if (last)
      picks = await db.editorPick.findMany({
        where: { week: last.week },
        include: { story: { select: { ...storySelect, status: true } }, editor: { select: { name: true } } },
        orderBy: { createdAt: "asc" },
      });
  }
  return picks
    .filter((p) => p.story.status === "PUBLISHED")
    .map((p) => ({ story: p.story, value: 0, extra: { blurb: p.blurb, editor: p.editor.name } }));
}

export async function praiseBoard(limit = 20): Promise<RankRow[]> {
  const [agg, global, reads, finishes] = await Promise.all([
    db.rating.groupBy({ by: ["storyId"], _count: { _all: true }, _avg: { score: true } }),
    db.rating.aggregate({ _avg: { score: true } }),
    db.readEvent.groupBy({ by: ["storyId"], _count: { _all: true } }),
    db.readEvent.groupBy({ by: ["storyId"], where: { finished: true }, _count: { _all: true } }),
  ]);
  const C = global._avg.score ?? 7;
  const r = new Map(reads.map((x) => [x.storyId, x._count._all]));
  const f = new Map(finishes.map((x) => [x.storyId, x._count._all]));
  const rows = agg
    .map((a) => {
      const v = a._count._all;
      const completion = (f.get(a.storyId) ?? 0) / Math.max(1, r.get(a.storyId) ?? 0);
      const b = bayesian(v, a._avg.score ?? 0, C, PRAISE_PRIOR);
      return { id: a.storyId, v, completion, b, s: praiseScore(b, completion) };
    })
    .filter((x) => x.v >= PRAISE_MIN_VOTES && x.completion >= PRAISE_MIN_COMPLETION)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit * 2);
  const m = await hydrate(rows.map((x) => x.id));
  return rows
    .filter((x) => m.has(x.id))
    .slice(0, limit)
    .map((x) => ({ story: m.get(x.id)!, value: x.s, extra: { votes: x.v, completion: x.completion, score: x.b } }));
}

export async function board(tab: RankTab): Promise<RankRow[]> {
  if (tab === "day") return dayBoard();
  if (tab === "week") return weekBoard();
  if (tab === "editor") return editorBoard();
  return praiseBoard();
}
