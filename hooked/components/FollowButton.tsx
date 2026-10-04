"use client";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toggleFollow } from "@/app/actions/follow";

export function FollowButton({ userId, on, signedIn, big = false }: { userId: string; on: boolean; signedIn: boolean; big?: boolean }) {
  const router = useRouter();
  const path = usePathname();
  const [state, setState] = useState(on);
  const [pending, start] = useTransition();
  return (
    <button
      className={`followb ${big ? "big" : ""}`}
      aria-pressed={state}
      disabled={pending}
      onClick={(e) => {
        e.preventDefault();
        if (!signedIn) return router.push(`/login?next=${encodeURIComponent(path)}`);
        start(async () => {
          const r = await toggleFollow(userId);
          if (!r.error) setState(!!r.on);
        });
      }}
    >
      {state ? "已关注" : "＋ 关注"}
    </button>
  );
}
