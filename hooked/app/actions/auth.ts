"use server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession, destroySession, hashPassword, verifyPassword } from "@/lib/auth";
import { allow } from "@/lib/ratelimit";
import { checkText } from "@/lib/moderation";

export type AuthState = { error?: string; email?: string; name?: string };

const safeNext = (n: FormDataEntryValue | null) => {
  const s = typeof n === "string" ? n : "/";
  return s.startsWith("/") && !s.startsWith("//") ? s : "/";
};

async function ip() {
  const h = await headers();
  return (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || "local";
}

const signupSchema = z.object({
  email: z.string().trim().toLowerCase().email("邮箱格式不对"),
  name: z.string().trim().min(2, "昵称至少 2 个字").max(16, "昵称不能超过 16 个字"),
  password: z.string().min(8, "密码至少 8 位").max(100),
});

export async function signup(_: AuthState, form: FormData): Promise<AuthState> {
  const raw = { email: String(form.get("email") ?? ""), name: String(form.get("name") ?? ""), password: String(form.get("password") ?? "") };
  const keep = { email: raw.email, name: raw.name };
  if (form.get("age") !== "on") return { ...keep, error: "需要确认你已年满 13 岁" };
  if (form.get("terms") !== "on") return { ...keep, error: "需要同意用户协议和隐私政策" };
  const p = signupSchema.safeParse(raw);
  if (!p.success) return { ...keep, error: p.error.issues[0].message };
  const nameBad = checkText(p.data.name, { min: 2, max: 16 });
  if (nameBad) return { ...keep, error: nameBad };
  if (!(await allow(`signup:${await ip()}`, 10, 3600))) return { ...keep, error: "注册太频繁，请稍后再试" };
  const exists = await db.user.findUnique({ where: { email: p.data.email } });
  if (exists) return { ...keep, error: "这个邮箱已经注册过了，直接登录吧" };
  const user = await db.user.create({ data: { email: p.data.email, name: p.data.name, passwordHash: await hashPassword(p.data.password) } });
  await createSession(user.id);
  redirect(safeNext(form.get("next")));
}

export async function login(_: AuthState, form: FormData): Promise<AuthState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  if (!(await allow(`login:${await ip()}`, 20, 900)) || !(await allow(`login:${email}`, 8, 900)))
    return { email, error: "尝试次数太多，请 15 分钟后再试" };
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) return { email, error: "邮箱或密码不对" };
  await createSession(user.id);
  redirect(safeNext(form.get("next")));
}

export async function logout() {
  await destroySession();
  redirect("/");
}
