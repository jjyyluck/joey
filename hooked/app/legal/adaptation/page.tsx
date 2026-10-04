import { SITE } from "@/lib/site";
import { AUTHOR_SHARE } from "@/lib/adaptation-rules";
export const metadata = { title: "改编与分成条款" };
export default function AdaptationTerms() {
  const share = Math.round(AUTHOR_SHARE * 100);
  return (
    <article className="legal">
      <h1>AI 漫剧改编与分成条款</h1>
      <p className="small">草稿，上线前需要法务审核。通过审核后，平台会和作者另行签署正式改编协议，以正式协议为准。</p>
      <h2>1. 授权</h2>
      <p>作者提交申请即确认拥有作品的改编权。申请通过并签署协议后，作者授予 {SITE.company} 将作品改编为 AI 漫剧（含竖屏解说漫、动态漫）并在平台旗下渠道全球发行的独家改编权，期限以正式协议为准。原作版权仍归作者。</p>
      <h2>2. 制作</h2>
      <p>改编、配音、画面生成和发行费用由平台承担。平台可以为适应漫剧形式调整情节、人物和台词，并会在片头或简介中署名原作者。</p>
      <h2>3. 分成</h2>
      <p>作者获得漫剧净收入的 {share}%，比例在提交申请时锁定。净收入 = 漫剧在各渠道产生的收入，扣除渠道（应用商店、平台）分成和投放成本。按自然月结算，亏损月份分成为 0，不向作者追偿。分成明细在“我的 → 漫剧”中可查。</p>
      <h2>4. 不通过与终止</h2>
      <p>申请不通过不影响作品在本站的发布，作者可以在作品数据提升后再次申请。漫剧上线后如因侵权投诉下架，平台有权暂停分成直至争议解决。</p>
      <h2>5. 联系</h2>
      <p>{SITE.contactEmail}</p>
    </article>
  );
}
