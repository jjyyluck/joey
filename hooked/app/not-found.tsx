import Link from "next/link";
export default function NotFound() {
  return (
    <div className="empty">
      <p>找不到这个页面，可能已经下架了。</p>
      <Link className="btn ghost" href="/">
        回到发现
      </Link>
    </div>
  );
}
