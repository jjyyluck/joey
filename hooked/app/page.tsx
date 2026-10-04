import Link from "next/link";
import { CATEGORIES, isCategory } from "@/lib/categories";
import { feed } from "@/lib/queries";
import { fmtN, readMinutes } from "@/lib/format";
import { Footer } from "@/components/Footer";
import { getUser } from "@/lib/auth";
import { ReaderIntro } from "@/components/ReaderIntro";

export default async function Discover({ searchParams }: { searchParams: Promise<{ c?: string; p?: string }> }) {
  const sp = await searchParams;
  const user = await getUser();
  const follow = sp.c === "关注" && !!user;
  const cat = sp.c && isCategory(sp.c) ? sp.c : null;
  const page = Math.max(0, Number(sp.p) || 0);
  const { items, hasMore } = await feed(cat, page, follow ? user!.id : null);
  const cur = follow ? "关注" : cat;
  const href = (c: string | null, p = 0) => {
    const q = new URLSearchParams();
    if (c) q.set("c", c);
    if (p) q.set("p", String(p));
    const s = q.toString();
    return s ? `/?${s}` : "/";
  };
  return (
    <>
      <nav className="tabs" aria-label="题材">
        <Link href={href(null)} aria-current={!cat && !follow ? "page" : undefined}>
          推荐
        </Link>
        {user && (
          <Link href={href("关注")} aria-current={follow ? "page" : undefined}>
            关注
          </Link>
        )}
        {CATEGORIES.map((c) => (
          <Link key={c} href={href(c)} aria-current={cat === c ? "page" : undefined}>
            {c}
          </Link>
        ))}
      </nav>
      {!user && page === 0 && !cat && <ReaderIntro />}
      {items.length === 0 ? (
        <div className="empty">
          <p>{follow ? "你关注的作者还没有发布故事。在阅读页点作者头像旁的“关注”，TA 的新故事会出现在这里。" : "这个题材还没有故事。"}</p>
          <Link className="btn ghost" href="/ask">
            提一个问题，等人来讲
          </Link>
        </div>
      ) : (
        items.map((s) => (
          <Link key={s.id} href={`/s/${s.id}`} className="qcard">
            <span className="hook">
              {s.question.category}
              {s.picks.length > 0 && <span className="tag">编辑推荐</span>}
              {s.adaptation?.status === "RELEASED" && <span className="tag">已改编漫剧</span>}
            </span>
            <span className="qtitle">{s.question.title}</span>
            <span className="excerpt">{s.opening}</span>
            <span className="meta">
              <span>{s.authorName}</span>
              <span>{fmtN(s._count.reads)} 次阅读</span>
              <span>{readMinutes(s.charCount)} 分钟读完</span>
              {s.question._count.waits > 0 && <span>{fmtN(s.question._count.waits)} 人坐等</span>}
            </span>
          </Link>
        ))
      )}
      <div className="btnrow" style={{ padding: 16, justifyContent: "center" }}>
        {page > 0 && (
          <Link className="btn ghost" href={href(cur, page - 1)}>
            上一页
          </Link>
        )}
        {hasMore && (
          <Link className="btn ghost" href={href(cur, page + 1)}>
            下一页
          </Link>
        )}
      </div>
      <Footer />
    </>
  );
}
