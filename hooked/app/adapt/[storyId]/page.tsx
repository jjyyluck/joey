import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { storyMetrics } from "@/lib/adaptation";
import { evaluate, AUTHOR_SHARE, ADAPT_STATUS } from "@/lib/adaptation-rules";
import { applyAdaptation } from "@/app/actions/adaptation";
import { AdaptChecks } from "@/components/AdaptChecks";

export const metadata = { title: "申请 AI 漫剧改编" };

export default async function ApplyPage({ params, searchParams }: { params: Promise<{ storyId: string }>; searchParams: Promise<{ err?: string }> }) {
  const { storyId } = await params;
  const { err } = await searchParams;
  const user = await requireUser(`/adapt/${storyId}`);
  const story = await db.story.findUnique({ where: { id: storyId }, include: { adaptation: true } });
  if (!story || story.status !== "PUBLISHED") notFound();
  if (story.authorId !== user.id) redirect(`/s/${storyId}`);
  const metrics = (await storyMetrics(storyId))!;
  const ev = evaluate(metrics, undefined, story.adaptInvited);
  const existing = story.adaptation && story.adaptation.status !== "DECLINED" ? story.adaptation : null;
  const share = Math.round(AUTHOR_SHARE * 100);
  return (
    <div className="pad">
      <Link href="/me/adaptations" className="small">‹ 我的漫剧</Link>
      <h1 style={{ fontSize: 20 }}>申请 AI 漫剧改编</h1>
      <div className="card soft">
        <b>《{story.title}》</b>
        <span className="small">表现优秀的短篇可以由平台改编成 AI 漫剧（竖屏解说漫），在平台旗下渠道发行。你保留原作版权，按漫剧净收入获得分成。</span>
      </div>
      <h3>申请标准{story.adaptInvited ? "（你已收到编辑邀请，可以直接申请）" : ""}</h3>
      <AdaptChecks checks={ev.checks} />
      {existing ? (
        <div className="notice good">已提交申请，当前状态：{ADAPT_STATUS[existing.status][0]}。</div>
      ) : (
        <>
          <div className="card">
            <b>分成方式</b>
            <span>作者获得漫剧<b>净收入的 {share}%</b>，按月结算。净收入 = 漫剧在各渠道的收入扣除渠道分成和投放成本。分成比例在提交申请时锁定。</span>
            <span className="small">制作费用由平台承担，作者不需要出钱。详见<Link href="/legal/adaptation" style={{ color: "var(--accent)" }}>改编与分成条款</Link>。</span>
          </div>
          {story.adaptation?.status === "DECLINED" && (
            <div className="notice warn">上次申请未通过：{story.adaptation.editorNote}。可以修改作品或等数据更好后再次申请。</div>
          )}
          {ev.eligible ? (
            <form action={applyAdaptation.bind(null, storyId)} className="sec">
              <div className="field">
                <label htmlFor="notes">补充说明（可选）：人物设定、你希望的画风、最想看到的画面</label>
                <textarea id="notes" name="notes" maxLength={500} style={{ minHeight: 90 }} />
              </div>
              <label className="chk">
                <input type="checkbox" name="rights" id="rights" /> 我拥有这篇作品的改编权，并授权平台将其改编为 AI 漫剧
              </label>
              <label className="chk">
                <input type="checkbox" name="terms" id="terms" /> 我已阅读并同意改编与分成条款（作者分成 {share}%）
              </label>
              {err && <span className="err">{err}</span>}
              <button className="btn">提交申请</button>
              <span className="small">提交后 AI 会先做一次改编潜力评估，编辑通常在 5 个工作日内回复。</span>
            </form>
          ) : (
            <p className="small">还没有达到标准。继续积累阅读和评分，或者等编辑邀请。达到后这里会出现申请按钮。</p>
          )}
        </>
      )}
    </div>
  );
}
