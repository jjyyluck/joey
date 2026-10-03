import type Anthropic from "@anthropic-ai/sdk";
import type { CharacterDef } from "./characters/types.js";
import type { CharacterState, ChatMode, ChatTurn } from "../shared/types.js";

export const TEASER_TURNS = 3;

function stage(state: CharacterState): string {
  if (state.affinity >= 75) return "falling hard for each other";
  if (state.affinity >= 50) return "fake dating that has clearly turned real";
  if (state.affinity >= 30) return "fake dating, turning real";
  return "strangers playing a fake couple, curious about each other";
}

function modeInstructions(mode: ChatMode, teaserTurn = 1): string {
  switch (mode) {
    case "teaser":
      return [
        "It is the night of the rooftop party (end of chapter 1). This is a short late-night chat before chapter 2.",
        "Stay on tonight's topics: the party, the stranger in the gray coat, the 'ask me at midnight' question.",
        "Reveal no secrets. Do not mention Blue Elena, the docks plan or the burner phone yet.",
        teaserTurn >= TEASER_TURNS
          ? "This is the LAST reply of this chat: answer, then wrap up naturally — something came up, you have to go, you'll explain over breakfast tomorrow."
          : `This is reply ${teaserTurn} of ${TEASER_TURNS}. Keep the player intrigued.`,
      ].join("\n");
    case "unlock_open":
      return [
        "It is later the same night, after the docks. You just got back safe. You are texting the player on the burner phone for the first time.",
        "Write 3–4 bubbles: first exactly \"It's done. I'm okay.\", then one line that references the player's choice about the docks,",
        "then (if you kissed) one line about the unfinished song at the piano, otherwise one line about Blue Elena,",
        "and end with an invitation to talk because you don't want to think about tonight.",
      ].join("\n");
    case "next_day":
      return [
        "A day has passed and the player hasn't opened the chat. Send ONE proactive text (1–2 bubbles) that pulls them back.",
        "Make it personal: refer to something specific they chose or told you. Ask a question that is easy and fun to answer.",
        "No guilt-tripping, no 'I missed you so much I couldn't sleep' pressure.",
      ].join("\n");
    case "free":
      return "Free chat. Keep it moving forward, per your pacing rules.";
  }
}

/** Layer 3–7: per-request state. Lives after the cached bible block. */
export function stateBlock(def: CharacterDef, state: CharacterState, mode: ChatMode, teaserTurn?: number): string {
  const unlocked = def.secrets.filter((s) => state.secretsUnlocked.includes(s.id)).map((s) => s.id);
  const story = Object.entries(def.storySoFar)
    .filter(([n]) => Number(n) <= state.chapterDone)
    .map(([, text]) => text);
  const lines = [
    "## Story so far",
    ...story,
    "",
    "## Story state (use naturally; never recite)",
    `- Chapters completed: ${state.chapterDone} · Story day: ${state.day}`,
    `- Relationship: ${stage(state)} · Affinity ${state.affinity}/100 · Kissed: ${state.kissed ? "yes" : "no"}`,
    `- Call the player: ${state.nickname ?? "trouble (no name/nickname given yet)"}`,
    "- What the player did in the story:",
    ...(state.choices.length ? state.choices.map((c) => `  - (ch${c.ch}) ${c.summary}`) : ["  - (nothing yet)"]),
    "- What you remember from chatting:",
    ...(state.memory.length ? state.memory.map((m) => `  - ${m}`) : ["  - (nothing yet)"]),
    `- Gifts the player has given you: ${state.gifts.length ? state.gifts.join(", ") : "none"}`,
    `- Secrets unlocked (only these may be revealed): ${unlocked.length ? unlocked.join(", ") : "none"}`,
    state.chapterDone >= 2
      ? "- Open threads you may tease but not resolve: what happened at the docks; who the stranger is; Sunday dinner with Vincent; the unfinished song."
      : "- Open threads you may tease but not resolve: who the stranger is; what happened at the docks last Friday.",
    "",
    "## Right now",
    modeInstructions(mode, teaserTurn),
  ];
  return lines.join("\n");
}

export function buildSystem(
  def: CharacterDef,
  state: CharacterState,
  mode: ChatMode,
  teaserTurn?: number,
): Anthropic.TextBlockParam[] {
  return [
    { type: "text", text: def.bible, cache_control: { type: "ephemeral" } },
    { type: "text", text: stateBlock(def, state, mode, teaserTurn) },
  ];
}

const PROACTIVE_CUE: Record<string, string> = {
  unlock_open: "[Story: Rafe is back from the docks. The player is holding the burner phone.]",
  next_day: "[Story: a day has passed. The player hasn't opened the chat since.]",
};

/**
 * Turn the stored chat into Messages API turns: must start with a user turn and
 * alternate. Scripted lines from Rafe come first, so we open with a story cue.
 */
export function buildMessages(history: ChatTurn[], mode: ChatMode, message?: string): Anthropic.MessageParam[] {
  const turns: ChatTurn[] = [...history];
  if (message) turns.push({ role: "user", text: message });
  else turns.push({ role: "user", text: PROACTIVE_CUE[mode] ?? "[Story continues.]" });

  const out: Anthropic.MessageParam[] = [];
  for (const t of turns) {
    const last = out[out.length - 1];
    if (last && last.role === t.role) last.content = `${last.content as string}\n${t.text}`;
    else out.push({ role: t.role, content: t.text });
  }
  if (out[0]?.role === "assistant") out.unshift({ role: "user", content: "[Story: the player opens Rafe's chat.]" });
  return out;
}
