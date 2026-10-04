import Link from "next/link";
import type { Metadata } from "next";
import { requireEditor } from "@/lib/auth";
import { db } from "@/lib/db";
import { EditorTabs } from "@/components/EditorTabs";
import { timeAgo } from "@/lib/format";
import { charCount } from "@/lib/upload";

export const metadata: Metadata = { title: "编辑后台" };

export default async function EditorHome({ searchParams }: { searchParams: Promise<{ done?: string }> }) {
  await requireEditor();
  const { done } = await searchParams;
  const queue = await db.submission.findMany({
    where: { status: "REVIEWING" },
    orderBy: { updatedAt: "asc" },
    include: { author: { select: { name: true } }, question: { select: { title: true } } },
  });
  return (
    <>
      <EditorTabs active="/editor" />
      <div className="pad">
        {done && (
          <div className="notice good">
            已上线。<Link href={`/s/${done}`}>查看故事</Link>
          </div>
        )}
        <h2>待审核 · {queue.length}</h2>
        {queue.length === 0 && <p className="small">队列是空的。</p>}
        {queue.map((s) => (
          <Link key={s.id} href={`/editor/submissions/${s.id}`} className="card">
            <b>{s.title}</b>
            <span className="small">
              {s.author.name} · {charCount(s.paragraphs).toLocaleString()} 字 · {timeAgo(s.updatedAt)}提交
            </span>
            <span className="small">问题：{s.question?.title ?? `（新问题）${s.newQuestion}`}</span>
            {s.dupScore > 0.2 && <span className="badge bad">查重相似度 {Math.round(s.dupScore * 100)}%</span>}
          </Link>
        ))}
      </div>
    </>
  );
}
