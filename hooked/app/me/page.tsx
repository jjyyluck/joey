import Link from "next/link";
import type { Metadata } from "next";
import { requireUser, isEditor } from "@/lib/auth";
import { db } from "@/lib/db";
import { logout } from "@/app/actions/auth";
import { MeTabs } from "@/components/MeTabs";
import { Footer } from "@/components/Footer";
import { Avatar } from "@/components/Avatar";

export const metadata: Metadata = { title: "我的" };

export default async function MePage() {
  const u = await requireUser("/me");
  const [q, w, b, s] = await Promise.all([
    db.question.count({ where: { askerId: u.id } }),
    db.wait.count({ where: { userId: u.id } }),
    db.bookmark.count({ where: { userId: u.id } }),
    db.submission.count({ where: { authorId: u.id } }),
  ]);
  return (
    <>
      <div className="pad">
        <Link href={`/u/${u.id}`} className="card soft">
          <span className="author">
            <Avatar name={u.name} size={48} />
            <span className="who">
              <b>{u.name}</b>
              <span>{u.email} · 查看我的主页 ›</span>
            </span>
          </span>
          <span className="small">
            提问 {q} · 坐等 {w} · 书架 {b} · 投稿 {s}
          </span>
        </Link>
        <Link className="btn ghost" href="/me/profile">
          编辑资料
        </Link>
        {isEditor(u) && (
          <Link className="btn" href="/editor">
            进入编辑后台
          </Link>
        )}
      </div>
      <MeTabs active="" />
      <div className="pad">
        <form action={logout}>
          <button className="btn ghost">退出登录</button>
        </form>
        <p className="small">需要删除账号或导出数据，请发邮件到隐私政策里写的联系邮箱。</p>
      </div>
      <Footer />
    </>
  );
}
