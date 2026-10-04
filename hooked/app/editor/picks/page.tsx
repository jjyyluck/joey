import Link from "next/link";
import { requireEditor } from "@/lib/auth";
import { db } from "@/lib/db";
import { EditorTabs } from "@/components/EditorTabs";
import { addPick, removePick } from "@/app/actions/editor";
import { easternWeekStart } from "@/lib/time";

export default async function Picks({ searchParams }: { searchParams: Promise<{ err?: string }> }) {
  await requireEditor();
  const { err } = await searchParams;
  const week = easternWeekStart();
  const picks = await db.editorPick.findMany({
    where: { week },
    orderBy: { createdAt: "asc" },
    include: { story: { select: { id: true, title: true } }, editor: { select: { name: true } } },
  });
  return (
    <>
      <EditorTabs active="/editor/picks" />
      <div className="pad">
        <h2>本周编辑推荐（{week.toISOString().slice(0, 10)} 这一周）</h2>
        <p className="small" style={{ margin: 0 }}>
          本周还没有推荐时，排行页会继续显示上一周的推荐。每条推荐语 6–60 字，会公开显示并署你的名字。
        </p>
        <form action={addPick} className="card">
          <div className="field">
            <label htmlFor="storyId">故事链接或 ID</label>
            <input id="storyId" name="storyId" type="text" placeholder="https://…/s/xxxx 或 xxxx" required />
          </div>
          <div className="field">
            <label htmlFor="blurb">推荐语</label>
            <input id="blurb" name="blurb" type="text" maxLength={60} required />
          </div>
          {err && <span className="err">{err}</span>}
          <button className="btn">加入本周推荐</button>
        </form>
        {picks.map((p) => (
          <div key={p.id} className="card">
            <Link href={`/s/${p.story.id}`}>
              <b>{p.story.title}</b>
            </Link>
            <span>“{p.blurb}” —— {p.editor.name}</span>
            <form action={removePick.bind(null, p.id)}>
              <button className="btn small danger">移除</button>
            </form>
          </div>
        ))}
      </div>
    </>
  );
}
