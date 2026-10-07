import type { AnswerResult, Friend, SelfBible, TwinAction } from "../shared/types";
import { DEFAULT_BIBLE, FRIENDS, SEED_POSTS } from "./data/seed";

export type Reaction = { emoji: string; by: string; byTwin: boolean };
export type Reply = { by: string; text: string; byTwin: boolean };

export type Post = {
  id: string;
  authorId: string; // "me" or a friend id
  byTwin: boolean; // drafted by the twin and approved by the user → still shows as 本人; twin-only content never enters the feed
  text: string;
  time: string;
  seenBy: string[];
  reactions: Reaction[];
  replies: Reply[];
  bigNews?: boolean;
  hasPhoto?: boolean;
};

export type Card =
  | { kind: "draft_post"; material: string; post: string; hasPhoto: boolean; status: "pending" | "posted" | "dropped" }
  | {
      kind: "friend_question";
      friendId: string;
      question: string;
      result: AnswerResult;
      /** pending: awaiting the user (draft). sent: twin answered (auto or approved). self: user took over. retracted: pulled back. */
      status: "pending" | "sent" | "self" | "retracted" | "closed";
    }
  | { kind: "nudge"; friendId: string; postId?: string; text: string; status: "pending" | "done" };

export type Msg = { id: string; role: "user" | "twin"; text?: string; card?: Card; time: string };

export type LogEntry = {
  id: string;
  time: string;
  friendId?: string;
  /** The chat card this entry belongs to, so a retraction can update it. */
  cardId?: string;
  postId?: string;
  action: TwinAction | "post" | "react" | "exit";
  detail: string;
  retractable: boolean;
  retracted?: boolean;
  guarded?: boolean;
};

export type ThreadTurn = { role: "friend" | "twin" | "me"; text: string; action?: TwinAction; guarded?: boolean };
export type Thread = { turns: ThreadTurn[]; waitingHuman: boolean };

export type State = {
  phase: "onboarding" | "app";
  bible: SelfBible;
  friends: Friend[];
  posts: Post[];
  chat: Msg[];
  log: LogEntry[];
  threads: Record<string, Thread>;
  seeded: boolean;
};

const KEY = "twin-demo-v1";

export function initialState(): State {
  return {
    phase: "onboarding",
    bible: DEFAULT_BIBLE,
    friends: FRIENDS,
    posts: SEED_POSTS.map((p) => ({ ...p, byTwin: false, reactions: [], replies: [] })),
    chat: [],
    log: [],
    threads: {},
    seeded: false,
  };
}

export function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...initialState(), ...(JSON.parse(raw) as State) };
  } catch {
    /* ignore */
  }
  return initialState();
}

export function save(s: State) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

let counter = 0;
export function uid(prefix = "id"): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter}`;
}

export function now(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function friendOf(s: State, id: string): Friend {
  return s.friends.find((f) => f.id === id) ?? { id, name: id, emoji: "👤", relation: "", tier: "circle", level: 0 };
}

export function logEntry(partial: Omit<LogEntry, "id" | "time">): LogEntry {
  return { id: uid("log"), time: now(), ...partial };
}

export function twinMsg(text: string): Msg {
  return { id: uid("m"), role: "twin", text, time: now() };
}

export function userMsg(text: string): Msg {
  return { id: uid("m"), role: "user", text, time: now() };
}

export function cardMsg(card: Card): Msg {
  return { id: uid("m"), role: "twin", card, time: now() };
}

export function updateCard(s: State, msgId: string, patch: (c: Card) => Card): State {
  return { ...s, chat: s.chat.map((m) => (m.id === msgId && m.card ? { ...m, card: patch(m.card) } : m)) };
}

export function appendThread(s: State, friendId: string, turn: ThreadTurn, waitingHuman?: boolean): State {
  const t = s.threads[friendId] ?? { turns: [], waitingHuman: false };
  return {
    ...s,
    threads: { ...s.threads, [friendId]: { turns: [...t.turns, turn], waitingHuman: waitingHuman ?? t.waitingHuman } },
  };
}

/** Human-facing metrics the proposal cares about (§9.2). */
export function metrics(s: State) {
  const twinActs = s.log.filter((l) => l.action === "answer" || l.action === "react");
  const retracted = s.log.filter((l) => l.retracted).length;
  const humanPosts = s.posts.filter((p) => p.authorId === "me").length;
  const humanReplies = s.posts.reduce((n, p) => n + p.replies.filter((r) => !r.byTwin).length, 0);
  const waiting = Object.values(s.threads).filter((t) => t.waitingHuman).length;
  return {
    twinActs: twinActs.length,
    retractRate: twinActs.length ? Math.round((retracted / twinActs.length) * 100) : 0,
    humanMoments: humanPosts + humanReplies,
    waitingHuman: waiting,
  };
}
