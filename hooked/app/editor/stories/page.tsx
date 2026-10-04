import Link from "next/link";
import { requireEditor } from "@/lib/auth";
import { db } from "@/lib/db";
import { EditorTabs } from "@/components/EditorTabs";
import { setStoryStatus } from "@/app/actions/editor";

export default async function Stories({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireEditor();
  const { q = "" } = await searchParams;
  const rows = await db.story.findMany({
    where: q ? { OR: [{ title: { contains: q } }, { authorName: { contains: q } }, { id: q }] } : {},
    orderBy: { publishedAt: "desc" },
    take: 50,
    select: { id: true, title: true, authorName: true, status: true, licensed: true, _count: { select: { reads: true } } },
  });
  return (
    <>
      <EditorTabs active="/editor/stories" />
      <div className="pad">
        <form className="btnrow">
          <input name="q" type="text" defaultValue={q} placeholder="按标题、作者或 ID 搜索" style={{ flex: 1 }} />
          <button className="btn">搜索</button>
        </form>
        <p className="small" style={{ margin: 0 }}>
          收到版权投诉（DMCA）或违规举报时，在这里下架故事。下架后读者无法访问，可以随时恢复。
        </p>
        {rows.map((s) => (
          <div key={s.id} className="card">
            <Link href={`/s/${s.id}`}>
              <b>{s.title}</b>
            </Link>
            <span className="small">
              {s.authorName} · {s._count.reads} 次阅读 · {s.licensed ? "授权库" : "用户投稿"} · ID {s.id}
            </span>
            <form action={setStoryStatus.bind(null, s.id, s.status === "PUBLISHED")}>
              <button className={`btn small ${s.status === "PUBLISHED" ? "danger" : ""}`}>{s.status === "PUBLISHED" ? "下架" : "恢复上线"}</button>
            </form>
          </div>
        ))}
      </div>
    </>
  );
}
