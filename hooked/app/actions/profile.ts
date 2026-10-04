"use server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { checkText } from "@/lib/moderation";

export type ProfileState = { error?: string };

export async function updateProfile(_: ProfileState, form: FormData): Promise<ProfileState> {
  const u = await requireUser("/me/profile");
  const name = String(form.get("name") ?? "").trim();
  const bio = String(form.get("bio") ?? "").trim();
  const nb = checkText(name, { min: 2, max: 16 });
  if (nb) return { error: `昵称：${nb}` };
  if (bio) {
    const bb = checkText(bio, { min: 1, max: 40 });
    if (bb) return { error: `签名：${bb}` };
  }
  await db.user.update({ where: { id: u.id }, data: { name, bio } });
  // Keep the byline on already-published stories in sync with the new name.
  await db.story.updateMany({ where: { authorId: u.id }, data: { authorName: name } });
  redirect(`/u/${u.id}`);
}
