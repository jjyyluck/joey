import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { SignupForm } from "@/components/AuthForms";

export const metadata: Metadata = { title: "注册" };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = "/" } = await searchParams;
  const safe = next.startsWith("/") && !next.startsWith("//") ? next : "/";
  if (await getUser()) redirect(safe);
  return (
    <div className="pad">
      <h1 style={{ fontSize: 20 }}>注册</h1>
      <SignupForm next={safe} />
    </div>
  );
}
