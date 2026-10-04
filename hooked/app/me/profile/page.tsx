import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ProfileForm } from "@/components/ProfileForm";

export const metadata = { title: "编辑资料" };

export default async function ProfilePage() {
  const me = await requireUser("/me/profile");
  const u = await db.user.findUniqueOrThrow({ where: { id: me.id }, select: { name: true, bio: true } });
  return (
    <div className="pad">
      <h1 style={{ fontSize: 20 }}>编辑资料</h1>
      <ProfileForm name={u.name} bio={u.bio} />
    </div>
  );
}
