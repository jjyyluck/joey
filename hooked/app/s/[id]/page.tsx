import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { Reader } from "@/components/Reader";
import { fmtN, readMinutes } from "@/lib/format";

async function load(id: string) {
  return db.story.findFirst({
    where: { id, status: "PUBLISHED" },
    include: { question: { select: { id: true, title: true, category: true } } },
  });
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const s = await load((await params).id);
  if (!s) return {};
  const desc = s.paragraphs.slice(0, 2).join("").slice(0, 110);
  return { title: s.question.title, description: desc, openGraph: { title: s.question.title, description: desc, type: "article" } };
}

export default async function StoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await load(id);
  if (!s) notFound();
  const user = await getUser();
  // Paid paragraphs never leave the server for signed-out readers.
  const unlocked = !!user;
  const visible = unlocked ? s.paragraphs : s.paragraphs.slice(0, s.paywallAfter);
  const [counts, reads, rating, mine, bookmarked, others] = await Promise.all([
    db.comment.groupBy({ by: ["paragraph"], where: { storyId: id, hidden: false }, _count: { _all: true } }),
    db.readEvent.count({ where: { storyId: id } }),
    db.rating.aggregate({ where: { storyId: id }, _avg: { score: true }, _count: { _all: true } }),
    user ? db.rating.findUnique({ where: { userId_storyId: { userId: user.id, storyId: id } } }) : null,
    user ? db.bookmark.findUnique({ where: { userId_storyId: { userId: user.id, storyId: id } } }) : null,
    db.story.findMany({
      where: { questionId: s.questionId, status: "PUBLISHED", NOT: { id } },
      select: { id: true, title: true, authorName: true },
      take: 5,
    }),
  ]);
  const commentCounts: Record<number, number> = {};
  counts.forEach((c) => (commentCounts[c.paragraph] = c._count._all));
  return (
    <>
      <div className="pad" style={{ paddingBottom: 4 }}>
        <Link href={`/q/${s.question.id}`} className="small">
          ‹ {s.question.category} · 查看这个问题的全部回答
        </Link>
        <h1 className="serif" style={{ fontSize: 22, lineHeight: 1.45 }}>
          {s.question.title}
        </h1>
        <div className="meta">
          <span>{s.authorName}</span>
          <span>{fmtN(reads)} 次阅读</span>
          <span>约 {readMinutes(s.charCount)} 分钟</span>
          {rating._count._all > 0 && (
            <span>
              {rating._avg.score!.toFixed(1)} 分 · {rating._count._all} 人评分
            </span>
          )}
        </div>
        <h2 className="serif" style={{ fontSize: 17 }}>
          {s.title}
        </h2>
      </div>
      <Reader
        storyId={s.id}
        paragraphs={visible}
        total={s.paragraphs.length}
        paywallAfter={s.paywallAfter}
        unlocked={unlocked}
        signedIn={!!user}
        commentCounts={commentCounts}
        myRating={mine?.score ?? null}
        bookmarked={!!bookmarked}
      />
      {others.length > 0 && (
        <div className="pad">
          <h3>这个问题的其他回答</h3>
          {others.map((o) => (
            <Link key={o.id} href={`/s/${o.id}`} className="card soft">
              <b>{o.title}</b>
              <span className="small">{o.authorName}</span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
