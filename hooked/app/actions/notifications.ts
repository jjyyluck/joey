"use server";
import { refresh } from "next/cache";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";

export async function markAllRead() {
  const u = await getUser();
  if (!u) return;
  await db.notification.updateMany({ where: { userId: u.id, read: false }, data: { read: true } });
  refresh();
}
