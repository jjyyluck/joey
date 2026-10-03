export type Cond = { minAffinity?: number; maxAffinity?: number; tag?: string; notTag?: string };

export type Option = {
  label: string;
  /** Player chat bubble; omit for actions (rendered as narration via `act`). */
  say?: string;
  act?: string;
  affinity: number;
  tag: string;
  summary: string; // what the AI will remember about this choice
  cost?: number; // diamonds
  reply?: StoryNode[];
};

export type StoryNode =
  | { t: "msg"; from: "rafe" | "player" | "npc"; name?: string; text: string; if?: Cond }
  | { t: "narr"; text: string; if?: Cond }
  | { t: "scene"; text: string }
  | { t: "cg"; id: string; title: string; desc: string; if?: Cond }
  | { t: "choice"; prompt?: string; options: Option[] }
  | { t: "branch"; if: Cond; then: StoryNode[]; else?: StoryNode[]; /** tag added when `then` runs */ flag?: string };

export type Chapter = { n: number; title: string; nodes: StoryNode[] };
