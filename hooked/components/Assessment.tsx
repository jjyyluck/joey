import type { Assessment as A } from "@/lib/adaptation";

const COMPLIANCE: Record<string, [string, string]> = { none: ["无合规问题", "good"], spot: ["点状问题，可改", "warn"], structural: ["结构性问题", "bad"] };

export function Assessment({ a }: { a: A | null }) {
  if (!a) return <p className="small">没有 AI 评估（AI 未开启或评估失败），需要编辑人工判断。</p>;
  const [cl, tone] = COMPLIANCE[a.compliance];
  return (
    <div className="sec" style={{ gap: 8 }}>
      <div className="score4">
        <div><b>{a.scores.conflict}</b>冲突可见</div>
        <div><b>{a.scores.public}</b>当众性</div>
        <div><b>{a.scores.reversal}</b>反转落差</div>
        <div><b>{a.scores.infoGap}</b>信息差</div>
      </div>
      <span>
        四要素合计 <b>{a.total}</b> / 20 · <span className={`badge ${tone}`}>{cl}</span> <span className="small">{a.complianceNotes}</span>
      </span>
      <span>{a.summary}</span>
      {a.scenes.length > 0 && (
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          {a.scenes.map((s, i) => (
            <li key={i} className="small">{s}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
