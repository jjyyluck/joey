import "server-only";
import Anthropic from "@anthropic-ai/sdk";

const key = process.env.ANTHROPIC_API_KEY;
const client = key ? new Anthropic({ apiKey: key }) : null;

export const MODELS = {
  standard: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5-5",
  quick: process.env.ANTHROPIC_MODEL_QUICK ?? "claude-haiku-4-5-20251001",
};

export const aiEnabled = () => client !== null;

export class AIUnavailable extends Error {}

/** Extracts the first JSON value from model text (handles ```json fences and stray prose). */
export function extractJSON(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = (fenced ? fenced[1] : text).trim();
  try {
    return JSON.parse(body);
  } catch {
    const start = body.search(/[[{]/);
    if (start < 0) throw new Error("no json");
    const open = body[start];
    const close = open === "{" ? "}" : "]";
    const end = body.lastIndexOf(close);
    return JSON.parse(body.slice(start, end + 1));
  }
}

export async function askJSON<T>(opts: {
  system: string;
  prompt: string;
  tier?: keyof typeof MODELS;
  maxTokens?: number;
  timeoutMs?: number;
}): Promise<T> {
  if (!client) throw new AIUnavailable("ANTHROPIC_API_KEY is not set");
  const res = await client.messages.create(
    {
      model: MODELS[opts.tier ?? "standard"],
      max_tokens: opts.maxTokens ?? 1500,
      system: opts.system + "\n只输出 JSON，不要输出任何其他文字。",
      messages: [{ role: "user", content: opts.prompt }],
    },
    { timeout: opts.timeoutMs ?? 45_000 },
  );
  const text = res.content.map((b) => (b.type === "text" ? b.text : "")).join("");
  return extractJSON(text) as T;
}
