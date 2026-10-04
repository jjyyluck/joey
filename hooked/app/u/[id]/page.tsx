import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { Avatar } from "@/components/Avatar";
import { FollowButton } from "@/components/FollowButton";
import { fmtN, readMinutes } from "@/lib/format";

async function load(id: string) {
  return db.user.findUnique({
    where: { id },
    select: { id: true, name: true, bio: true, createdAt: true, _count: { select: { followers: true, following: true } } },
  });
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const u = await load((await params).id);
  return u ? { title: u.name, description: u.bio || `${u.name}的故事` } : {};
}

export default async function UserPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string; sort?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const tab = sp.tab === "questions" ? "questions" : "stories";
  const sort = sp.sort === "new" ? "new" : "hot";
  const u = await load(id);
  if (!u) notFound();
  const me = await getUser();
  const [stories, questions, following, reads] = await Promise.all([
    db.story.findMany({
      where: { authorId: id, status: "PUBLISHED" },
      orderBy: sort === "new" ? { publishedAt: "desc" } : { reads: { _count: "desc" } },
      select: {
        id: true,
        title: true,
        charCount: true,
        paragraphs: true,
        question: { select: { title: true, category: true } },
        _count: { select: { reads: true } },
      },
    }),
    db.question.findMany({
      where: { askerId: id, hidden: false },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { waits: true, stories: { where: { status: "PUBLISHED" } } } } },
    }),
    me && me.id !== id ? db.follow.findUnique({ where: { followerId_followeeId: { followerId: me.id, followeeId: id } } }) : null,
    db.readEvent.count({ where: { story: { authorId: id, status: "PUBLISHED" } } }),
  ]);
  const isMe = me?.id === id;
  const tabHref = (t: string, s = sort) => `/u/${id}?tab=${t}${t === "stories" ? `&sort=${s}` : ""}`;
  return (
    <>
      <div className="uhead">
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Avatar name={u.name} size={72} />
          <div className="ustats">
            <div>
              <b>{fmtN(reads)}</b>
              <span>阅读</span>
            </div>
            <div>
              <b>{fmtN(u._count.followers)}</b>
              <span>被关注</span>
            </div>
            <div>
              <b>{fmtN(u._count.following)}</b>
              <span>关注</span>
            </div>
          </div>
        </div>
        <h1 style={{ fontSize: 22 }}>{u.name}</h1>
        <span className="small">{u.bio || "这个作者还没有写签名"}</span>
        <div className="btnrow">
          {isMe ? (
            <Link className="btn ghost" href="/me/profile" style={{ flex: 1 }}>
              编辑资料
            </Link>
          ) : (
            <FollowButton userId={u.id} on={!!following} signedIn={!!me} big />
          )}
        </div>
      </div>
      <nav className="tabs" aria-label="作者内容">
        <Link href={tabHref("stories")} aria-current={tab === "stories" ? "page" : undefined}>
          故事 {stories.length}
        </Link>
        <Link href={tabHref("questions")} aria-current={tab === "questions" ? "page" : undefined}>
          提问 {questions.length}
        </Link>
      </nav>
      {tab === "stories" ? (
        <>
          <div style={{ display: "flex", alignItems: "center", padding: "0 16px" }}>
            <b>{stories.length} 个故事</b>
            <span className="sp" />
            <div className="tabs" style={{ padding: 0 }}>
              <Link href={tabHref("stories", "hot")} aria-current={sort === "hot" ? "page" : undefined}>
                热度
              </Link>
              <Link href={tabHref("stories", "new")} aria-current={sort === "new" ? "page" : undefined}>
                最新
              </Link>
            </div>
          </div>
          {stories.length === 0 && <div className="empty">还没有上线的故事。</div>}
          {stories.map((s) => (
            <Link key={s.id} href={`/s/${s.id}`} className="qcard">
              <span className="hook">{s.question.category}</span>
              <span className="qtitle">{s.title}</span>
              <span className="excerpt">{s.paragraphs.slice(0, 2).join("").slice(0, 90)}</span>
              <span className="meta">
                <span>回答：{s.question.title}</span>
                <span>{fmtN(s._count.reads)} 次阅读</span>
                <span>约 {readMinutes(s.charCount)} 分钟</span>
              </span>
            </Link>
          ))}
        </>
      ) : (
        <div className="pad">
          {questions.length === 0 && <p className="small">还没有提过问题。</p>}
          {questions.map((q) => (
            <Link key={q.id} href={`/q/${q.id}`} className="card">
              <b className="serif">{q.title}</b>
              <span className="small">
                {q._count.stories} 个故事 · {fmtN(q._count.waits)} 人坐等
              </span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
