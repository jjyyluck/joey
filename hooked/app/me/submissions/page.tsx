import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { MeTabs, SUB_STATUS } from "@/components/MeTabs";
import { timeAgo } from "@/lib/format";

export default async function Submissions({ searchParams }: { searchParams: Promise<{ sent?: string }> }) {
  const u = await requireUser("/me/submissions");
  const { sent } = await searchParams;
  const items = await db.submission.findMany({ where: { authorId: u.id }, orderBy: { updatedAt: "desc" } });
  return (
    <>
      <MeTabs active="/me/submissions" />
      <div className="pad">
        {sent && <div className="notice good">已提交，编辑通常会在 3 个工作日内审核，结果会发到“通知”。</div>}
        <div className="btnrow">
          <Link className="btn" href="/create/upload">
            上传作品
          </Link>
        </div>
        {items.length === 0 && <p className="small">还没有投稿。</p>}
        {items.map((s) => {
          const [label, tone] = SUB_STATUS[s.status];
          return (
            <div key={s.id} className="card">
              <b>{s.title}</b>
              <span>
                <span className={`badge ${tone}`}>{label}</span> <span className="small">{timeAgo(s.updatedAt)}更新</span>
              </span>
              {s.reviewNote && <span className="small">编辑意见：{s.reviewNote}</span>}
              <div className="btnrow">
                {s.status === "CHANGES_REQUESTED" && (
                  <Link className="btn small" href={`/create/upload?edit=${s.id}`}>
                    修改后重新提交
                  </Link>
                )}
                {s.storyId && (
                  <Link className="btn small ghost" href={`/s/${s.storyId}`}>
                    查看上线的故事
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
