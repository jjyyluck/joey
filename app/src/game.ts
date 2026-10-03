import type { ChatTurn, CharacterState, StoryChoice } from "../shared/types";
import type { Cond, Option, StoryNode } from "./story/types";

export type Stage =
  | "match" // swipe card
  | "ch1"
  | "teaser" // 3 AI messages after chapter 1
  | "post_teaser" // waiting to start chapter 2
  | "ch2"
  | "locked" // chapter 2 done, affinity below the unlock threshold
  | "side" // free side story to earn affinity
  | "free"; // AI unlocked

export type LogEntry = {
  id: number;
  kind: "msg" | "narr" | "scene" | "cg" | "system" | "gift";
  from?: "rafe" | "player" | "npc";
  name?: string;
  text: string;
  desc?: string;
};

export type GameState = {
  stage: Stage;
  affinity: number;
  tags: string[];
  choices: StoryChoice[];
  diamonds: number;
  log: LogEntry[];
  nextId: number;
  queue: StoryNode[];
  pending: Option[] | null;
  aiHistory: ChatTurn[];
  teaserCount: number;
  memory: string[];
  nickname: string | null;
  gifts: string[];
  secrets: string[];
  day: number;
  freeMsgsUsed: number;
  affinityToday: number;
  msgsSinceMemory: number;
  chapterDone: number;
  starterPackOffered: boolean;
  starterPackBought: boolean;
  ch3Teased: boolean;
};

export const FREE_MSGS_PER_DAY = 15;
export const DAILY_CHAT_AFFINITY_CAP = 8;
export const MEMORY_EVERY = 6;

export const SECRETS = [
  { id: "secret_mother", minAffinity: 45, label: "Why he really closed Blue Elena" },
  { id: "secret_ray", minAffinity: 60, label: "Who the man in the gray coat is" },
  { id: "secret_piano", minAffinity: 75, label: "The song he never finished" },
];

export function initialState(): GameState {
  return {
    stage: "match",
    affinity: 0,
    tags: [],
    choices: [],
    diamonds: 30,
    log: [],
    nextId: 1,
    queue: [],
    pending: null,
    aiHistory: [],
    teaserCount: 0,
    memory: [],
    nickname: null,
    gifts: [],
    secrets: [],
    day: 1,
    freeMsgsUsed: 0,
    affinityToday: 0,
    msgsSinceMemory: 0,
    chapterDone: 0,
    starterPackOffered: false,
    starterPackBought: false,
    ch3Teased: false,
  };
}

const KEY = "mechat-ai-proto-v1";

export function load(): GameState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...initialState(), ...(JSON.parse(raw) as GameState) };
  } catch {
    /* storage unavailable */
  }
  return initialState();
}

export function save(s: GameState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* storage unavailable */
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* storage unavailable */
  }
}

export function check(cond: Cond | undefined, s: GameState): boolean {
  if (!cond) return true;
  if (cond.minAffinity !== undefined && s.affinity < cond.minAffinity) return false;
  if (cond.maxAffinity !== undefined && s.affinity > cond.maxAffinity) return false;
  if (cond.tag && !s.tags.includes(cond.tag)) return false;
  if (cond.notTag && s.tags.includes(cond.notTag)) return false;
  return true;
}

export function append(s: GameState, entries: Omit<LogEntry, "id">[]): GameState {
  let id = s.nextId;
  const added = entries.map((e) => ({ ...e, id: id++ }));
  return { ...s, log: [...s.log, ...added], nextId: id };
}

export function characterState(s: GameState): CharacterState {
  return {
    affinity: s.affinity,
    chapterDone: s.chapterDone,
    kissed: s.tags.includes("kissed"),
    choices: s.choices,
    secretsUnlocked: s.secrets,
    memory: s.memory,
    gifts: s.gifts,
    nickname: s.nickname,
    day: s.day,
  };
}

/** Split an AI reply into chat bubbles. */
export function bubbles(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}
