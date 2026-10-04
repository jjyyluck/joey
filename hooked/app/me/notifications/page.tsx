import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { MeTabs } from "@/components/MeTabs";
import { timeAgo } from "@/lib/format";
import { markAllRead } from "@/app/actions/notifications";

export default async function Notifications() {
  const u = await requireUser("/me/notifications");
  const items = await db.notification.findMany({ where: { userId: u.id }, orderBy: { createdAt: "desc" }, take: 100 });
  return (
    <>
      <MeTabs active="/me/notifications" />
      <div className="pad">
        {items.some((n) => !n.read) && (
          <form action={markAllRead}>
            <button className="btn small ghost">全部标为已读</button>
          </form>
        )}
        {items.length === 0 && <p className="small">还没有通知。你坐等的问题有故事上线、投稿有审核结果时，会出现在这里。</p>}
        {items.map((n) => (
          <Link key={n.id} href={n.href} className="card" style={n.read ? undefined : { borderColor: "var(--accent)" }}>
            <span>{n.body}</span>
            <span className="small">{timeAgo(n.createdAt)}</span>
          </Link>
        ))}
      </div>
    </>
  );
}
