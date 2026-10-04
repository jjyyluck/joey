import Link from "next/link";
import { notFound } from "next/navigation";
import { requireEditor } from "@/lib/auth";
import { db } from "@/lib/db";
import { EditorTabs } from "@/components/EditorTabs";
import { Assessment } from "@/components/Assessment";
import { AdaptChecks } from "@/components/AdaptChecks";
import { addRevenue, advanceAdaptation, decideAdaptation } from "@/app/actions/adaptation";
import { ADAPT_STATUS, evaluate, fmtUSD, type AdaptMetrics } from "@/lib/adaptation-rules";
import type { Assessment as A } from "@/lib/adaptation";

const ERR: Record<string, string> = { note: "不通过时请写明原因，作者会看到。", url: "请填写以 https:// 开头的漫剧链接。", revenue: "月份格式为 2026-10，金额填数字（美元）。" };

export default async function AdaptationDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ err?: string }> }) {
  await requireEditor();
  const { id } = await params;
  const { err } = await searchParams;
  const a = await db.adaptation.findUnique({
    where: { id },
    include: {
      story: { select: { id: true, title: true, charCount: true } },
      author: { select: { name: true, email: true } },
      reviewer: { select: { name: true } },
      revenues: { orderBy: { month: "desc" } },
    },
  });
  if (!a) notFound();
  const m = a.metrics as AdaptMetrics & { invited?: boolean };
  const ev = evaluate(m, undefined, !!m.invited);
  const [label, tone] = ADAPT_STATUS[a.status];
  const total = a.revenues.reduce((x, r) => ({ net: x.net + r.netCents, author: x.author + r.authorCents }), { net: 0, author: 0 });
  return (
    <>
      <EditorTabs active="/editor/adaptations" />
      <div className="pad">
        <Link href={`/editor/adaptations?s=${a.status}`} className="small">‹ 返回列表</Link>
        <h1 style={{ fontSize: 20 }}>
          <Link href={`/s/${a.story.id}`}>{a.story.title}</Link>
        </h1>
        <span>
          <span className={`badge ${tone}`}>{label}</span>{" "}
          <span className="small">
            {a.author.name}（{a.author.email}）· {a.story.charCount.toLocaleString()} 字 · 作者分成 {Math.round(a.sharePct * 100)}%{a.reviewer ? ` · 审核：${a.reviewer.name}` : ""}
          </span>
        </span>
        {err && <div className="notice bad">{ERR[err] ?? err}</div>}
        <h3>申请时的数据{m.invited ? "（编辑邀请）" : ""}</h3>
        <AdaptChecks checks={ev.checks} />
        <h3>AI 改编潜力评估</h3>
        <Assessment a={a.aiAssessment as A | null} />
        {a.notes && (
          <div className="card soft">
            <b>作者补充</b>
            <span>{a.notes}</span>
          </div>
        )}
        {a.editorNote && <span className="small">编辑意见：{a.editorNote}</span>}

        {a.status === "APPLIED" && (
          <form action={decideAdaptation.bind(null, a.id)} className="card">
            <b>审核</b>
            <div className="field">
              <label htmlFor="note">给作者的意见（不通过时必填）</label>
              <textarea id="note" name="note" maxLength={500} style={{ minHeight: 70 }} />
            </div>
            <div className="btnrow">
              <button className="btn" name="decision" value="accept">通过</button>
              <button className="btn danger" name="decision" value="decline">不通过</button>
            </div>
          </form>
        )}
        {a.status === "ACCEPTED" && (
          <form action={advanceAdaptation.bind(null, a.id)} className="card">
            <b>开始制作</b>
            <span className="small">确认已和作者签好改编协议后再开始。</span>
            <button className="btn">标记为制作中</button>
          </form>
        )}
        {a.status === "IN_PRODUCTION" && (
          <form action={advanceAdaptation.bind(null, a.id)} className="card">
            <b>上线</b>
            <div className="field">
              <label htmlFor="releaseUrl">漫剧链接</label>
              <input id="releaseUrl" name="releaseUrl" type="text" placeholder="https://" />
            </div>
            <button className="btn">标记为已上线</button>
          </form>
        )}
        {a.status === "RELEASED" && (
          <>
            {a.releaseUrl && (
              <a href={a.releaseUrl} target="_blank" rel="noopener noreferrer" className="small" style={{ color: "var(--accent)" }}>
                {a.releaseUrl}
              </a>
            )}
            <form action={addRevenue.bind(null, a.id)} className="card">
              <b>录入月度净收入</b>
              <span className="small">净收入 = 渠道收入 − 渠道分成 − 投放成本。同一月份重复录入会覆盖。作者分成自动按 {Math.round(a.sharePct * 100)}% 计算，亏损月份分成为 0。</span>
              <div className="btnrow">
                <input id="month" name="month" type="text" placeholder="2026-10" style={{ flex: 1 }} />
                <input id="net" name="net" type="text" inputMode="decimal" placeholder="净收入（美元）" style={{ flex: 2 }} />
              </div>
              <input id="rnote" name="note" type="text" placeholder="备注（可选）" />
              <button className="btn">保存</button>
            </form>
            <table className="t">
              <thead>
                <tr><th>月份</th><th>净收入</th><th>作者分成</th><th>备注</th></tr>
              </thead>
              <tbody>
                {a.revenues.map((r) => (
                  <tr key={r.id}>
                    <td>{r.month.toISOString().slice(0, 7)}</td>
                    <td>{fmtUSD(r.netCents)}</td>
                    <td>{fmtUSD(r.authorCents)}</td>
                    <td className="small">{r.note}</td>
                  </tr>
                ))}
                <tr><td>合计</td><td><b>{fmtUSD(total.net)}</b></td><td><b>{fmtUSD(total.author)}</b></td><td /></tr>
              </tbody>
            </table>
          </>
        )}
      </div>
    </>
  );
}
