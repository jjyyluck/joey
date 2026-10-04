import type { Check } from "@/lib/adaptation-rules";

export function AdaptChecks({ checks }: { checks: Check[] }) {
  return (
    <div className="sec" style={{ gap: 8 }}>
      {checks.map((c) => (
        <div key={c.key} className="chkrow">
          <span>{c.pass ? "✓ " : ""}{c.label}</span>
          <span className="bar" aria-hidden="true">
            <i className={c.pass ? "ok" : ""} style={{ width: `${Math.round(c.progress * 100)}%` }} />
          </span>
          <span className={c.pass ? "ok" : "small"}>
            {c.value} / {c.target}
          </span>
        </div>
      ))}
    </div>
  );
}
