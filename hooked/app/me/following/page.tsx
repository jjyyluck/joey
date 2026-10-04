import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { MeTabs } from "@/components/MeTabs";
import { Avatar } from "@/components/Avatar";
import { FollowButton } from "@/components/FollowButton";

export const metadata = { title: "我的关注" };

export default async function Following() {
  const me = await requireUser("/me/following");
  const rows = await db.follow.findMany({
    where: { followerId: me.id },
    orderBy: { createdAt: "desc" },
    include: { followee: { select: { id: true, name: true, bio: true, _count: { select: { stories: { where: { status: "PUBLISHED" } } } } } } },
  });
  return (
    <>
      <MeTabs active="/me/following" />
      <div className="pad">
        {rows.length === 0 && <p className="small">还没有关注任何作者。读故事时点作者旁边的“关注”，TA 的新故事会通知你。</p>}
        {rows.map(({ followee: u }) => (
          <div key={u.id} className="author">
            <Link href={`/u/${u.id}`}>
              <Avatar name={u.name} />
            </Link>
            <Link href={`/u/${u.id}`} className="who">
              <b>{u.name}</b>
              <span>
                {u._count.stories} 个故事 · {u.bio || "还没有签名"}
              </span>
            </Link>
            <FollowButton userId={u.id} on signedIn />
          </div>
        ))}
      </div>
    </>
  );
}
