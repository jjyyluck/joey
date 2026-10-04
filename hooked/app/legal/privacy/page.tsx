import { SITE } from "@/lib/site";
export const metadata = { title: "隐私政策" };
export default function Privacy() {
  return (
    <article className="legal">
      <h1>隐私政策</h1>
      <p className="small">草稿，上线前需要法务审核（CCPA/CPRA、COPPA）。</p>
      <h2>我们收集什么</h2>
      <p>注册信息（邮箱、昵称、加密后的密码）；你发布的内容（提问、作品、段评、评分）；阅读记录（读了哪些故事、读到第几段），用于榜单和推荐；匿名访客标识（Cookie），用于统计阅读人数。</p>
      <h2>我们怎么用</h2>
      <p>提供和改进服务、计算榜单、发送与你相关的通知、防止滥用。你上传的作品会发送给 AI 服务商（Anthropic）进行分析，仅用于生成标题、付费点等建议。</p>
      <h2>我们不做什么</h2>
      <p>我们不出售你的个人信息。不面向 13 岁以下儿童提供服务，如发现会删除相关账号。</p>
      <h2>你的权利</h2>
      <p>你可以要求查看、导出或删除你的个人数据，发送邮件到 {SITE.contactEmail}，我们会在 45 天内处理。</p>
    </article>
  );
}
