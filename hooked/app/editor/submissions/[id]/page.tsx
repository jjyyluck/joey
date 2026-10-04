import Link from "next/link";
import { notFound } from "next/navigation";
import { requireEditor } from "@/lib/auth";
import { db } from "@/lib/db";
import { EditorTabs } from "@/components/EditorTabs";
import { approveSubmission, returnSubmission } from "@/app/actions/editor";
import { charCount, type UploadAnalysis } from "@/lib/upload";

const AI_USAGE: Record<string, string> = { none: "没有使用 AI", polish: "AI 辅助润色", draft: "AI 生成初稿，作者修改" };

export default async function Review({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ err?: string }> }) {
  await requireEditor();
  const { id } = await params;
  const { err } = await searchParams;
  const s = await db.submission.findUnique({
    where: { id },
    include: { author: { select: { name: true, email: true } }, question: { select: { id: true, title: true } } },
  });
  if (!s) notFound();
  const dup = s.dupStoryId ? await db.story.findUnique({ where: { id: s.dupStoryId }, select: { id: true, title: true } }) : null;
  const a = s.aiAnalysis as UploadAnalysis | null;
  const approve = approveSubmission.bind(null, s.id);
  const ret = returnSubmission.bind(null, s.id);
  const open = s.status === "REVIEWING";
  return (
    <>
      <EditorTabs active="/editor" />
      <div className="pad">
        <Link href="/editor" className="small">
          ‹ 返回队列
        </Link>
        <h1 style={{ fontSize: 20 }}>{s.title}</h1>
        <table className="t">
          <tbody>
            <tr><th>作者</th><td>{s.author.name}（{s.author.email}）</td></tr>
            <tr><th>问题</th><td>{s.question ? <Link href={`/q/${s.question.id}`}>{s.question.title}</Link> : `新问题：${s.newQuestion}`}</td></tr>
            <tr><th>题材</th><td>{s.category}</td></tr>
            <tr><th>一句话</th><td>{s.line || "—"}</td></tr>
            <tr><th>篇幅</th><td>{s.paragraphs.length} 段 · {charCount(s.paragraphs).toLocaleString()} 字</td></tr>
            <tr><th>付费点</th><td>第 {s.paywallAfter} 段之后</td></tr>
            <tr><th>AI 使用</th><td>{AI_USAGE[s.aiUsage] ?? s.aiUsage}</td></tr>
            <tr><th>查重</th><td>{dup ? <span className="err">与《<Link href={`/s/${dup.id}`}>{dup.title}</Link>》相似 {Math.round(s.dupScore * 100)}%</span> : "未发现相似"}</td></tr>
            {a && <tr><th>AI 建议</th><td>{a.notes?.join("；") || "—"}（{a.source === "ai" ? "AI" : "规则"}）</td></tr>}
          </tbody>
        </table>
        <div className="card soft" style={{ maxHeight: 420, overflowY: "auto" }}>
          {s.paragraphs.map((p, i) => (
            <div key={i}>
              {i === s.paywallAfter && <div className="cutline">付费点</div>}
              <p className="serif" style={{ margin: "0 0 .6em" }}>
                <span className="small">{i + 1}　</span>
                {p}
              </p>
            </div>
          ))}
        </div>
        {open ? (
          <>
            <form action={approve} className="card">
              <b>通过并上线</b>
              <div className="field">
                <label htmlFor="title">标题（可改）</label>
                <input id="title" name="title" type="text" defaultValue={s.title} maxLength={40} />
              </div>
              <div className="field">
                <label htmlFor="paywallAfter">付费点（第几段之后）</label>
                <input id="paywallAfter" name="paywallAfter" type="text" inputMode="numeric" defaultValue={s.paywallAfter} />
              </div>
              <button className="btn">通过并上线</button>
            </form>
            <form action={ret} className="card">
              <b>退回</b>
              {err === "note" && <span className="err">请写明原因，作者会看到。</span>}
              <div className="field">
                <label htmlFor="note">给作者的意见</label>
                <textarea id="note" name="note" maxLength={500} style={{ minHeight: 80 }} />
              </div>
              <div className="btnrow">
                <button className="btn ghost" name="decision" value="changes">
                  需要修改
                </button>
                <button className="btn danger" name="decision" value="reject">
                  不通过
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="notice warn">这份投稿已处理（{s.status}）。</div>
        )}
      </div>
    </>
  );
}
