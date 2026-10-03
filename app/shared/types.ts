// Types shared by the client and the server.

export type StoryChoice = { ch: number; id: string; summary: string };

/** Story/relationship state the AI needs. The client owns it in this prototype. */
export type CharacterState = {
  affinity: number;
  chapterDone: number;
  kissed: boolean;
  choices: StoryChoice[];
  secretsUnlocked: string[];
  memory: string[]; // facts extracted from free chat
  gifts: string[];
  nickname: string | null;
  day: number;
};

export type ChatTurn = { role: "user" | "assistant"; text: string };

/**
 * teaser       – 3 free messages after chapter 1
 * free         – unlocked free chat after chapter 2
 * unlock_open  – the semi-scripted first message after unlocking
 * next_day     – proactive "day 2" message used for D1 recall
 */
export type ChatMode = "teaser" | "free" | "unlock_open" | "next_day";

export type ChatRequest = {
  characterId: string;
  mode: ChatMode;
  state: CharacterState;
  history: ChatTurn[];
  message?: string; // the player's new message (absent for proactive modes)
  teaserTurn?: number; // 1-based index of the player's teaser message
};

/** Server-sent events emitted by POST /api/chat. */
export type ChatEvent =
  | { type: "delta"; text: string }
  | { type: "reset" } // a fallback model took over: discard partial text
  | { type: "done"; text: string; crisis?: boolean }
  | { type: "error"; message: string };

export type MemoryRequest = {
  characterId: string;
  memory: string[];
  nickname: string | null;
  recent: ChatTurn[];
};

export type MemoryResponse = { memory: string[]; nickname: string | null };
