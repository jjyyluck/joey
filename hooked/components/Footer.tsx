import Link from "next/link";

export function Footer() {
  return (
    <footer className="foot">
      <Link href="/legal/terms">用户协议</Link>
      <Link href="/legal/privacy">隐私政策</Link>
      <Link href="/legal/dmca">版权投诉</Link>
      <span>所有内容均为故事创作，不代表真实事件。</span>
    </footer>
  );
}
