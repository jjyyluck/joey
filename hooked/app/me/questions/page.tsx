import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { MeTabs } from "@/components/MeTabs";
import { fmtN } from "@/lib/format";

export default async function MyQuestions() {
  const u = await requireUser("/me/questions");
  const [mine, waits] = await Promise.all([
    db.question.findMany({
      where: { askerId: u.id },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { waits: true, stories: { where: { status: "PUBLISHED" } } } } },
    }),
    db.wait.findMany({
      where: { userId: u.id, question: { NOT: { askerId: u.id } } },
      orderBy: { createdAt: "desc" },
      include: { question: { include: { _count: { select: { waits: true, stories: { where: { status: "PUBLISHED" } } } } } } },
    }),
  ]);
  const row = (q: { id: string; title: string; _count: { waits: number; stories: number } }) => (
    <Link key={q.id} href={`/q/${q.id}`} className="card">
      <b className="serif">{q.title}</b>
      <span className={q._count.stories ? "ok" : "small"}>
        {q._count.stories ? `有 ${q._count.stories} 个故事回答了 · 去读` : "还没有故事"} · {fmtN(q._count.waits)} 人坐等
      </span>
    </Link>
  );
  return (
    <>
      <MeTabs active="/me/questions" />
      <div className="pad">
        <div className="btnrow">
          <Link className="btn" href="/ask">
            ＋ 提一个问题
          </Link>
        </div>
        <h3>我的提问</h3>
        {mine.length ? mine.map(row) : <p className="small">还没有提过问题。</p>}
        <h3>我在坐等</h3>
        {waits.length ? waits.map((w) => row(w.question)) : <p className="small">在问题页点“＋ 坐等”，故事上线时会通知你。</p>}
      </div>
    </>
  );
}
