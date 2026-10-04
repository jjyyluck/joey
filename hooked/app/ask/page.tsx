import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { AskForm } from "@/components/AskForm";

export const metadata: Metadata = { title: "提问" };

export default async function AskPage() {
  await requireUser("/ask");
  return (
    <div className="pad">
      <h1 style={{ fontSize: 20 }}>你想听什么故事？</h1>
      <p className="small">用一个问题描述你想读的经历，比如“发现另一半背叛你的那一刻，你做了什么？”。好问题有具体的情境和冲突。</p>
      <AskForm />
    </div>
  );
}
