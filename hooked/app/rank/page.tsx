import Link from "next/link";
import type { Metadata } from "next";
import { board, RANK_RULES, RANK_TABS, type RankTab } from "@/lib/ranking";
import { fmtN } from "@/lib/format";

export const metadata: Metadata = { title: "排行" };

const TITLE: Record<RankTab, string> = { day: "今日热读", week: "本周最热", editor: "本周编辑推荐", praise: "口碑榜" };
const EMPTY: Record<RankTab, string> = {
  day: "今天还没有阅读数据，读一篇故事，它就会出现在这里。",
  week: "最近 7 天还没有阅读数据。",
  editor: "编辑本周还没有挑选故事。",
  praise: "还没有故事达到上榜门槛。",
};

export default async function RankPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const sp = await searchParams;
  const tab = (RANK_TABS.map((t) => t[0]) as string[]).includes(sp.tab ?? "") ? (sp.tab as RankTab) : "day";
  const rows = await board(tab);
  return (
    <>
      <nav className="tabs" aria-label="榜单">
        {RANK_TABS.map(([k, l]) => (
          <Link key={k} href={`/rank?tab=${k}`} aria-current={k === tab ? "page" : undefined}>
            {l}
          </Link>
        ))}
      </nav>
      <div className="pad" style={{ paddingBottom: 0 }}>
        <h2>{TITLE[tab]}</h2>
        <p className="small" style={{ margin: 0 }}>
          怎么排的：{RANK_RULES[tab]}
        </p>
      </div>
      {rows.length === 0 && <div className="empty">{EMPTY[tab]}</div>}
      {rows.map((r, i) => (
        <Link key={r.story.id} href={`/s/${r.story.id}`} className="rrow">
          <span className={`rk ${tab === "editor" || i < 3 ? "top" : ""}`}>{tab === "editor" ? "荐" : i + 1}</span>
          <span className="rbody">
            <span className="stitle">{r.story.question.title}</span>
            <span className="small">
              {r.story.title} · {r.story.authorName}
            </span>
            {tab === "day" && <span className="small">今日 {fmtN(r.value)} 人在读</span>}
            {tab === "week" && <span className="small">本周热度 {fmtN(r.value)}</span>}
            {tab === "editor" && (
              <span className="edq">
                “{r.extra?.blurb}”<span className="small"> —— {r.extra?.editor}</span>
              </span>
            )}
            {tab === "praise" && (
              <span className="small">
                {fmtN(r.extra!.votes!)} 人评分 · 读完率 {Math.round(r.extra!.completion! * 100)}%
              </span>
            )}
          </span>
          {tab === "praise" && (
            <span className="pscore">
              <b>{r.extra!.score!.toFixed(1)}</b>
              <span className="small">分</span>
            </span>
          )}
        </Link>
      ))}
    </>
  );
}
