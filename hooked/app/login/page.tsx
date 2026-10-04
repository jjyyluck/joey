import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { LoginForm } from "@/components/AuthForms";

export const metadata: Metadata = { title: "登录" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = "/" } = await searchParams;
  const safe = next.startsWith("/") && !next.startsWith("//") ? next : "/";
  if (await getUser()) redirect(safe);
  return (
    <div className="pad">
      <h1 style={{ fontSize: 20 }}>登录</h1>
      <LoginForm next={safe} />
    </div>
  );
}
