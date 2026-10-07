import type { TwinAction } from "../../shared/types";

/** The transparency rule made visible: every piece of content says who produced it. */
export function Badge({ kind }: { kind: "me" | "twin" | "friend-twin" }) {
  if (kind === "me") return <span className="badge badge-me">本人</span>;
  if (kind === "twin") return <span className="badge badge-twin">分身</span>;
  return <span className="badge badge-twin">对方的分身</span>;
}

export const ACTION_LABEL: Record<TwinAction, string> = {
  answer: "已代答",
  draft: "等你确认",
  defer: "范围外，未透露",
  escalate: "交给真人",
};

export function ActionTag({ action, guarded }: { action: TwinAction; guarded?: boolean }) {
  return (
    <span className={`tag tag-${action}`}>
      {ACTION_LABEL[action]}
      {guarded ? " · 安全层降级" : ""}
    </span>
  );
}
