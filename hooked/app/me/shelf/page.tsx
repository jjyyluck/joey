import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { MeTabs } from "@/components/MeTabs";

export default async function Shelf() {
  const u = await requireUser("/me/shelf");
  const items = await db.bookmark.findMany({
    where: { userId: u.id, story: { status: "PUBLISHED" } },
    orderBy: { createdAt: "desc" },
    include: { story: { select: { id: true, title: true, authorName: true, question: { select: { title: true } } } } },
  });
  return (
    <>
      <MeTabs active="/me/shelf" />
      <div className="pad">
        {items.length === 0 && <p className="small">还没有收藏。读完一个故事，点“加入书架”，它就会出现在这里。</p>}
        {items.map(({ story: s }) => (
          <Link key={s.id} href={`/s/${s.id}`} className="card">
            <b className="serif">{s.question.title}</b>
            <span className="small">
              {s.title} · {s.authorName}
            </span>
          </Link>
        ))}
      </div>
    </>
  );
}
