import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { MeTabs } from "@/components/MeTabs";
import { storyMetrics } from "@/lib/adaptation";
import { ADAPT_STATUS, evaluate, fmtUSD } from "@/lib/adaptation-rules";

export const metadata = { title: "我的漫剧" };

export default async function MyAdaptations({ searchParams }: { searchParams: Promise<{ sent?: string }> }) {
  const u = await requireUser("/me/adaptations");
  const { sent } = await searchParams;
  const [apps, stories] = await Promise.all([
    db.adaptation.findMany({
      where: { authorId: u.id },
      orderBy: { updatedAt: "desc" },
      include: { story: { select: { id: true, title: true } }, revenues: { orderBy: { month: "desc" } } },
    }),
    db.story.findMany({ where: { authorId: u.id, status: "PUBLISHED" }, select: { id: true, title: true, adaptInvited: true }, orderBy: { publishedAt: "desc" } }),
  ]);
  const applied = new Set(apps.filter((a) => a.status !== "DECLINED").map((a) => a.storyId));
  const candidates = await Promise.all(
    stories.filter((s) => !applied.has(s.id)).map(async (s) => ({ s, ev: evaluate((await storyMetrics(s.id))!, undefined, s.adaptInvited) })),
  );
  const total = apps.reduce((n, a) => n + a.revenues.reduce((m, r) => m + r.authorCents, 0), 0);
  return (
    <>
      <MeTabs active="/me/adaptations" />
      <div className="pad">
        {sent && <div className="notice good">申请已提交，审核结果会发到“通知”。</div>}
        <div className="card gold">
          <b>AI 漫剧改编</b>
          <span className="small">表现优秀的短篇可以申请由平台改编成 AI 漫剧，作者按净收入分成。累计分成：<b>{fmtUSD(total)}</b></span>
        </div>
        <h3>我的申请</h3>
        {apps.length === 0 && <p className="small">还没有申请。</p>}
        {apps.map((a) => {
          const [label, tone] = ADAPT_STATUS[a.status];
          const sum = a.revenues.reduce((m, r) => m + r.authorCents, 0);
          return (
            <div key={a.id} className="card">
              <Link href={`/s/${a.story.id}`}>
                <b>{a.story.title}</b>
              </Link>
              <span>
                <span className={`badge ${tone}`}>{label}</span> <span className="small">作者分成 {Math.round(a.sharePct * 100)}%</span>
              </span>
              {a.editorNote && <span className="small">编辑意见：{a.editorNote}</span>}
              {a.releaseUrl && (
                <a href={a.releaseUrl} target="_blank" rel="noopener noreferrer" className="small" style={{ color: "var(--accent)" }}>
                  观看漫剧 ›
                </a>
              )}
              {a.revenues.length > 0 && (
                <table className="t">
                  <thead>
                    <tr><th>月份</th><th>净收入</th><th>我的分成</th></tr>
                  </thead>
                  <tbody>
                    {a.revenues.map((r) => (
                      <tr key={r.id}>
                        <td>{r.month.toISOString().slice(0, 7)}</td>
                        <td>{fmtUSD(r.netCents)}</td>
                        <td><b>{fmtUSD(r.authorCents)}</b></td>
                      </tr>
                    ))}
                    <tr><td>合计</td><td /><td><b>{fmtUSD(sum)}</b></td></tr>
                  </tbody>
                </table>
              )}
              {a.status === "DECLINED" && (
                <Link className="btn small ghost" href={`/adapt/${a.story.id}`}>再次申请</Link>
              )}
            </div>
          );
        })}
        <h3>我的作品</h3>
        {candidates.length === 0 && <p className="small">没有可以申请的作品。</p>}
        {candidates.map(({ s, ev }) => (
          <Link key={s.id} href={`/adapt/${s.id}`} className="card">
            <b>{s.title}</b>
            <span className={ev.eligible ? "ok" : "small"}>
              {ev.eligible ? (ev.invited && !ev.metAll ? "编辑邀请你申请 ›" : "已达到申请标准，去申请 ›") : `已达成 ${ev.checks.filter((c) => c.pass).length} / ${ev.checks.length} 项标准 ›`}
            </span>
          </Link>
        ))}
      </div>
    </>
  );
}
