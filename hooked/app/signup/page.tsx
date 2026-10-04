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
      <p className="small" style={{ margin: 0 }}>注册后可以读完所有故事、提问、坐等，也可以投稿。写得好的故事有机会改编成 AI 漫剧并拿分成。</p>
      <SignupForm next={safe} />
    </div>
  );
}
