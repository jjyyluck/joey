import Link from "next/link";
import { requireEditor } from "@/lib/auth";
import { db } from "@/lib/db";
import { EditorTabs } from "@/components/EditorTabs";
import { resolveReport } from "@/app/actions/editor";

export default async function Reports() {
  await requireEditor();
  const rows = await db.comment.findMany({
    where: { reports: { some: { resolved: false } } },
    include: {
      user: { select: { name: true, email: true } },
      story: { select: { id: true, title: true } },
      _count: { select: { reports: true } },
      reports: { where: { resolved: false }, select: { reason: true }, take: 3 },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return (
    <>
      <EditorTabs active="/editor/reports" />
      <div className="pad">
        <h2>被举报的段评 · {rows.length}</h2>
        {rows.length === 0 && <p className="small">没有待处理的举报。</p>}
        {rows.map((c) => (
          <div key={c.id} className="card">
            <span>{c.body}</span>
            <span className="small">
              {c.user.name}（{c.user.email}）· <Link href={`/s/${c.story.id}`}>{c.story.title}</Link> 第 {c.paragraph + 1} 段 · {c._count.reports} 次举报
            </span>
            <div className="btnrow">
              <form action={resolveReport.bind(null, c.id, true)}>
                <button className="btn small danger">隐藏这条段评</button>
              </form>
              <form action={resolveReport.bind(null, c.id, false)}>
                <button className="btn small ghost">保留</button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
