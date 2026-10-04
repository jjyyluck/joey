import { SITE } from "@/lib/site";
export const metadata = { title: "版权投诉" };
export default function Dmca() {
  return (
    <article className="legal">
      <h1>版权投诉（DMCA）</h1>
      <p>如果你认为平台上的内容侵犯了你的版权，请发送书面通知到 <b>{SITE.dmcaEmail}</b>，内容包括：</p>
      <ol>
        <li>你的签名（电子签名即可）和联系方式；</li>
        <li>被侵权作品的说明；</li>
        <li>侵权内容在本站的链接；</li>
        <li>你善意相信该使用未经授权的声明；</li>
        <li>在伪证处罚下，通知内容准确、你是权利人或经其授权的声明。</li>
      </ol>
      <p>我们收到完整通知后会尽快下架相关内容，并通知上传者。上传者可以提交反通知。</p>
    </article>
  );
}
