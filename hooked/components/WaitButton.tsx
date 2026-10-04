"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toggleWait } from "@/app/actions/questions";

export function WaitButton({ questionId, on, count, signedIn }: { questionId: string; on: boolean; count: number; signedIn: boolean }) {
  const router = useRouter();
  const [state, setState] = useState({ on, count });
  const [pending, start] = useTransition();
  return (
    <button
      className={`btn ${state.on ? "ghost" : ""}`}
      disabled={pending}
      aria-pressed={state.on}
      onClick={() => {
        if (!signedIn) return router.push(`/login?next=/q/${questionId}`);
        start(async () => {
          const r = await toggleWait(questionId);
          if (!r.error) setState((s) => ({ on: !!r.on, count: s.count + (r.on ? 1 : -1) }));
        });
      }}
    >
      {state.on ? "✓ 坐等中" : "＋ 坐等"} · {state.count}
    </button>
  );
}
