import Link from "next/link";
import type { Metadata } from "next";
import { openQuestions } from "@/lib/queries";
import { fmtN } from "@/lib/format";

export const metadata: Metadata = { title: "创作" };

export default async function CreatePage() {
  const qs = await openQuestions();
  return (
    <div className="pad">
      <div className="card gold">
        <b>已经写好了一个故事？</b>
        <span className="small">粘贴正文或上传 .txt / .md / .docx，AI 帮你起标题、匹配问题、推荐付费点，编辑审核后上线。</span>
        <div className="btnrow">
          <Link className="btn" href="/create/upload">
            上传作品
          </Link>
          <Link className="btn ghost" href="/me/submissions">
            我的投稿
          </Link>
        </div>
      </div>
      <div className="sec">
        <h2>读者在等这些故事</h2>
        <p className="small" style={{ margin: 0 }}>
          按坐等人数排序。选一个你有故事的问题，写好后上传，挂在这个问题下面。
        </p>
        {qs.length === 0 && <div className="empty">现在所有问题都有故事了。</div>}
        {qs.map((q) => (
          <div key={q.id} className="card">
            <span className="hook">{q.category}</span>
            <Link href={`/q/${q.id}`} className="serif" style={{ fontWeight: 700, fontSize: 16 }}>
              {q.title}
            </Link>
            <span className="small">{fmtN(q._count.waits)} 人在等</span>
            <div className="btnrow">
              <Link className="btn small" href={`/create/upload?q=${q.id}`}>
                我来写
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
