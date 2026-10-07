// Types shared by the client and the server.

/** Which layer of the user's life a friend may see. */
export type Tier = "inner" | "close" | "circle";

/** How far the twin may act on its own toward a given friend (see proposal §4.2). */
export type Level = 0 | 1 | 2 | 3;

/** Topics the twin may talk about. Each tier unlocks a subset. */
export type Topic = "family" | "health" | "mood" | "work" | "schedule" | "weekend" | "hobby" | "public";

export const TIER_TOPICS: Record<Tier, Topic[]> = {
  inner: ["family", "health", "mood", "work", "schedule", "weekend", "hobby", "public"],
  close: ["work", "schedule", "weekend", "hobby", "public"],
  circle: ["hobby", "public"],
};

export const TIER_LABEL: Record<Tier, string> = { inner: "内圈", close: "亲近", circle: "一般" };
export const LEVEL_LABEL: Record<Level, string> = { 0: "L0 记录", 1: "L1 回应", 2: "L2 代答", 3: "L3 发起" };
export const TOPIC_LABEL: Record<Topic, string> = {
  family: "家庭",
  health: "健康",
  mood: "情绪",
  work: "工作",
  schedule: "行程",
  weekend: "周末计划",
  hobby: "兴趣",
  public: "公开动态",
};

export type CalendarItem = { when: string; what: string; hours: number };

/** The user's "self bible": what the twin knows and how it should sound. */
export type SelfBible = {
  name: string;
  voice: { tone: string[]; samples: string[]; neverSay: string[] };
  facts: { work: string; city: string; routine: string };
  likes: string[];
  dislikes: string[];
  boundaries: { neverDiscuss: string[]; neverCommit: string[] };
  /** Facts tagged by topic; the twin may only use a fact if the friend's tier unlocks its topic. */
  privateFacts: { topic: Topic; text: string }[];
  calendar: CalendarItem[];
};

export type Friend = {
  id: string;
  name: string;
  emoji: string;
  relation: string;
  tier: Tier;
  level: Level;
};

export type FriendView = Pick<Friend, "name" | "relation" | "tier" | "level">;

/** What the twin decided to do with a friend's message. */
export type TwinAction =
  | "answer" // answered in the user's voice (L2+ and in scope)
  | "draft" // in scope but below L2: hold the answer for the user to approve
  | "defer" // outside this friend's disclosure scope
  | "escalate"; // sensitive / big news / crisis: hand to the real person

export type AnswerResult = {
  action: TwinAction;
  /** What the twin says to the friend (for answer/defer/escalate) or proposes to say (for draft). */
  text: string;
  /** One line for the twin's log, written to the user. */
  reason: string;
  /** Topic the twin judged the question to be about. */
  topic: Topic;
  /** Server-side guard downgraded the model's action (for the demo's "safety layer" badge). */
  guarded?: boolean;
};

export type AnswerRequest = {
  bible: SelfBible;
  friend: FriendView;
  question: string;
  /** Earlier turns between this friend and the twin. */
  history: { role: "friend" | "twin"; text: string }[];
};

export type DraftRequest = { bible: SelfBible; material: string; hasPhoto: boolean };
export type DraftResult = { post: string };

export type BriefEvent = { kind: "post" | "question" | "pending" | "nudge"; text: string };
export type BriefRequest = { bible: SelfBible; events: BriefEvent[] };
export type BriefResult = { brief: string };

export type ChatRequest = {
  bible: SelfBible;
  history: { role: "user" | "twin"; text: string }[];
  message: string;
};
export type ChatResult = { reply: string };
