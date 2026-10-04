import Link from "next/link";
import { requireEditor } from "@/lib/auth";
import { db } from "@/lib/db";
import { EditorTabs } from "@/components/EditorTabs";
import { ADAPT_STATUS, fmtUSD } from "@/lib/adaptation-rules";
import type { Assessment } from "@/lib/adaptation";

const ORDER = ["APPLIED", "ACCEPTED", "IN_PRODUCTION", "RELEASED", "DECLINED"] as const;

export default async function Adaptations({ searchParams }: { searchParams: Promise<{ s?: string }> }) {
  await requireEditor();
  const { s } = await searchParams;
  const status = (ORDER as readonly string[]).includes(s ?? "") ? (s as (typeof ORDER)[number]) : "APPLIED";
  const [rows, counts] = await Promise.all([
    db.adaptation.findMany({
      where: { status },
      orderBy: { updatedAt: status === "APPLIED" ? "asc" : "desc" },
      include: { story: { select: { title: true } }, author: { select: { name: true } }, revenues: { select: { netCents: true, authorCents: true } } },
    }),
    db.adaptation.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  const n = Object.fromEntries(counts.map((c) => [c.status, c._count._all]));
  return (
    <>
      <EditorTabs active="/editor/adaptations" />
      <nav className="tabs" aria-label="状态">
        {ORDER.map((k) => (
          <Link key={k} href={`/editor/adaptations?s=${k}`} aria-current={k === status ? "page" : undefined}>
            {ADAPT_STATUS[k][0]} {n[k] ?? 0}
          </Link>
        ))}
      </nav>
      <div className="pad">
        {rows.length === 0 && <p className="small">没有记录。</p>}
        {rows.map((a) => {
          const m = a.metrics as { reads: number; completion: number; rating: number; votes: number; invited?: boolean };
          const ai = a.aiAssessment as Assessment | null;
          const net = a.revenues.reduce((x, r) => x + r.netCents, 0);
          return (
            <Link key={a.id} href={`/editor/adaptations/${a.id}`} className="card">
              <b>{a.story.title}</b>
              <span className="small">
                {a.author.name} · {m.reads.toLocaleString()} 阅读 · 读完率 {Math.round(m.completion * 100)}% · {m.votes ? m.rating.toFixed(1) : "—"} 分（{m.votes} 人）{m.invited ? " · 编辑邀请" : ""}
              </span>
              <span className="small">
                {ai ? `四要素 ${ai.total}/20${ai.compliance !== "none" ? " · 有合规问题" : ""}` : "无 AI 评估"}
                {a.status === "RELEASED" ? ` · 累计净收入 ${fmtUSD(net)}` : ""}
              </span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
