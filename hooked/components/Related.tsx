import Link from "next/link";
import type { Rec } from "@/lib/recommend";

export function Related({ items }: { items: Rec[] }) {
  if (!items.length) return null;
  return (
    <section className="pad" aria-label="相关推荐">
      <h2>相关推荐</h2>
      {items.map((r) => (
        <Link key={r.id} href={`/s/${r.id}`} className="card">
          <span className="hook">{r.reason}</span>
          <b className="serif">{r.questionTitle}</b>
          <span className="small">
            {r.title} · {r.authorName}
          </span>
        </Link>
      ))}
    </section>
  );
}
