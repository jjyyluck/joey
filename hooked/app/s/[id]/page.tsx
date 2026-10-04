import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { Reader } from "@/components/Reader";
import { AuthorBar } from "@/components/AuthorBar";
import { ActionBar } from "@/components/ActionBar";
import { Comments } from "@/components/Comments";
import { Related } from "@/components/Related";
import { related } from "@/lib/recommend";
import { fmtN, readMinutes } from "@/lib/format";

async function load(id: string) {
  return db.story.findFirst({
    where: { id, status: "PUBLISHED" },
    include: {
      question: { select: { id: true, title: true, category: true } },
      author: { select: { id: true, name: true, bio: true } },
    },
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
  const [counts, reads, rating, mine, bookmarked, recs, follows, likes, liked, commentTotal] = await Promise.all([
    db.comment.groupBy({ by: ["paragraph"], where: { storyId: id, hidden: false, paragraph: { not: null } }, _count: { _all: true } }),
    db.readEvent.count({ where: { storyId: id } }),
    db.rating.aggregate({ where: { storyId: id }, _avg: { score: true }, _count: { _all: true } }),
    user ? db.rating.findUnique({ where: { userId_storyId: { userId: user.id, storyId: id } } }) : null,
    user ? db.bookmark.findUnique({ where: { userId_storyId: { userId: user.id, storyId: id } } }) : null,
    related({ id: s.id, questionId: s.questionId, authorId: s.authorId, category: s.question.category }, user?.id ?? null),
    user && s.authorId
      ? db.follow.findUnique({ where: { followerId_followeeId: { followerId: user.id, followeeId: s.authorId } } })
      : null,
    db.storyLike.count({ where: { storyId: id } }),
    user ? db.storyLike.findUnique({ where: { userId_storyId: { userId: user.id, storyId: id } } }) : null,
    db.comment.count({ where: { storyId: id, paragraph: null, hidden: false } }),
  ]);
  const bar = (size?: number) => (
    <AuthorBar author={s.author} fallbackName={s.authorName} following={!!follows} signedIn={!!user} isMe={user?.id === s.authorId} size={size} />
  );
  const commentCounts: Record<number, number> = {};
  counts.forEach((c) => c.paragraph !== null && (commentCounts[c.paragraph] = c._count._all));
  return (
    <>
      <div className="pad" style={{ paddingBottom: 4 }}>
        <Link href={`/q/${s.question.id}`} className="small">
          ‹ {s.question.category} · 查看这个问题的全部回答
        </Link>
        <h1 className="serif" style={{ fontSize: 22, lineHeight: 1.45 }}>
          {s.question.title}
        </h1>
        {bar()}
        <div className="meta">
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
      />
      {s.author && user?.id !== s.authorId && (
        <div className="pad" style={{ paddingTop: 0 }}>
          <div className="card soft">
            {bar(48)}
            <span className="small">关注作者，TA 发布新故事时会通知你。</span>
          </div>
        </div>
      )}
      <Related items={recs} />
      <Comments storyId={s.id} signedIn={!!user} initialTotal={commentTotal} />
      <ActionBar storyId={s.id} likes={likes} liked={!!liked} comments={commentTotal} bookmarked={!!bookmarked} signedIn={!!user} title={s.question.title} />
    </>
  );
}
