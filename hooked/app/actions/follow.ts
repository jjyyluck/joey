"use server";
import { refresh } from "next/cache";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { allow } from "@/lib/ratelimit";

export async function toggleFollow(userId: string): Promise<{ error?: string; on?: boolean }> {
  const me = await getUser();
  if (!me) return { error: "登录后才能关注" };
  if (me.id === userId) return { error: "不能关注自己" };
  if (!(await db.user.findUnique({ where: { id: userId }, select: { id: true } }))) return { error: "找不到这个作者" };
  const key = { followerId_followeeId: { followerId: me.id, followeeId: userId } };
  const has = await db.follow.findUnique({ where: key });
  if (has) await db.follow.delete({ where: key });
  else {
    if (!(await allow(`follow:${me.id}`, 60, 3600))) return { error: "操作太频繁，稍后再试" };
    await db.follow.create({ data: { followerId: me.id, followeeId: userId } });
  }
  refresh();
  return { on: !has };
}
