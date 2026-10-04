import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { questionDetail } from "@/lib/queries";
import { fmtN, readMinutes } from "@/lib/format";
import { WaitButton } from "@/components/WaitButton";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const q = await db.question.findUnique({ where: { id: (await params).id }, select: { title: true } });
  return q ? { title: q.title } : {};
}

export default async function QuestionPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ asked?: string }> }) {
  const { id } = await params;
  const { asked } = await searchParams;
  const q = await questionDetail(id);
  if (!q) notFound();
  const user = await getUser();
  const waiting = user ? !!(await db.wait.findUnique({ where: { userId_questionId: { userId: user.id, questionId: id } } })) : false;
  return (
    <div className="pad">
      <span className="hook">{q.category}</span>
      <h1 className="serif" style={{ fontSize: 22, lineHeight: 1.45 }}>
        {q.title}
      </h1>
      <span className="small">{q.source === "editor" ? "编辑精选" : `${q.asker?.name ?? "读者"} 提问`}</span>
      {asked && <div className="notice good">问题已发布。你已自动坐等，有故事回答时会通知你。</div>}
      <div className="btnrow">
        <WaitButton questionId={q.id} on={waiting} count={q._count.waits} signedIn={!!user} />
        <Link className="btn ghost" href={`/create/upload?q=${q.id}`}>
          我来写
        </Link>
      </div>
      <h3>{q.stories.length ? `${q.stories.length} 个故事回答了这个问题` : "还没有故事回答这个问题"}</h3>
      {q.stories.length === 0 && <p className="small">点“坐等”，等的人越多，越先被作者写出来。故事上线时会通知你。</p>}
      {q.stories.map((s) => (
        <Link key={s.id} href={`/s/${s.id}`} className="card">
          <b>{s.title}</b>
          <span className="excerpt">{s.paragraphs.slice(0, 2).join("").slice(0, 90)}</span>
          <span className="meta">
            <span>{s.authorName}</span>
            <span>{fmtN(s._count.reads)} 次阅读</span>
            <span>约 {readMinutes(s.charCount)} 分钟</span>
          </span>
        </Link>
      ))}
    </div>
  );
}
