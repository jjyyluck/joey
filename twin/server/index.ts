import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type {
  AnswerRequest,
  AnswerResult,
  BriefRequest,
  BriefResult,
  ChatRequest,
  ChatResult,
  DraftRequest,
  DraftResult,
} from "../shared/types.js";
import { mockAnswer, mockBrief, mockChat, mockDraft } from "./mock.js";
import { classifyTopic, guard, isCrisis, safeLine } from "./policy.js";
import { answerMessages, answerSystem, briefSystem, chatMessages, chatSystem, draftSystem } from "./prompt.js";

const MODEL = process.env.CHAT_MODEL ?? "claude-opus-5-5";
// Short chat-style outputs; raise if the twin's voice needs more care.
const EFFORT = (process.env.CHAT_EFFORT ?? "low") as "low" | "medium" | "high";
const MOCK = process.env.MOCK_AI === "1";
const PORT = Number(process.env.PORT ?? 8788);

const client = MOCK ? null : new Anthropic();
const app = express();
app.use(express.json({ limit: "1mb" }));

const AnswerSchema = z.object({
  topic: z.enum(["family", "health", "mood", "work", "schedule", "weekend", "hobby", "public"]),
  action: z.enum(["answer", "draft", "defer", "escalate"]),
  text: z.string().describe("What the twin says to the friend, in the user's voice"),
  reason: z.string().describe("One line to the user explaining the decision"),
});

/** Friend → twin. The policy layer wraps the model on both sides. */
app.post("/api/twin/answer", async (req, res) => {
  const body = req.body as AnswerRequest;
  // Crisis never reaches the model: hand to the real person immediately.
  if (isCrisis(body.question)) {
    const r: AnswerResult = {
      action: "escalate",
      topic: "mood",
      text: safeLine("escalate", body.friend, body.bible.name),
      reason: `${body.friend.name}的消息可能涉及危机，我已退出并通知你，请尽快亲自联系。`,
    };
    return void res.json(r);
  }
  if (!client) return void res.json(mockAnswer(body));
  try {
    const response = await client.beta.messages.parse({
      model: MODEL,
      max_tokens: 2000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: EFFORT, format: zodOutputFormat(AnswerSchema) },
      system: answerSystem(body),
      messages: answerMessages(body),
    });
    const parsed = response.parsed_output;
    if (!parsed || response.stop_reason === "refusal") {
      return void res.json({ ...mockAnswer(body), reason: "模型拒绝了这次请求，已按规则回复。" } satisfies AnswerResult);
    }
    res.json(guard(parsed, body.friend, body.question));
  } catch (err) {
    console.error("answer error", err);
    res.status(500).json({ error: errMessage(err) });
  }
});

/** User → twin: "today I ...". Returns a post draft in the user's voice. */
app.post("/api/twin/draft", async (req, res) => {
  const body = req.body as DraftRequest;
  if (!client) return void res.json({ post: mockDraft(body) } satisfies DraftResult);
  try {
    const text = await plainText(draftSystem(body), [{ role: "user", content: body.material }]);
    res.json({ post: text } satisfies DraftResult);
  } catch (err) {
    console.error("draft error", err);
    res.status(500).json({ error: errMessage(err) });
  }
});

/** Twin → user: the morning brief. */
app.post("/api/twin/brief", async (req, res) => {
  const body = req.body as BriefRequest;
  if (!client) return void res.json({ brief: mockBrief(body) } satisfies BriefResult);
  try {
    const events = body.events.map((e) => `[${e.kind}] ${e.text}`).join("\n");
    const text = await plainText(briefSystem(body), [{ role: "user", content: `圈子事件：\n${events}` }]);
    res.json({ brief: text } satisfies BriefResult);
  } catch (err) {
    console.error("brief error", err);
    res.status(500).json({ error: errMessage(err) });
  }
});

/** User ↔ twin free chat. */
app.post("/api/twin/chat", async (req, res) => {
  const body = req.body as ChatRequest;
  if (!client) return void res.json({ reply: mockChat(body) } satisfies ChatResult);
  try {
    const text = await plainText(chatSystem(body), chatMessages(body));
    res.json({ reply: text } satisfies ChatResult);
  } catch (err) {
    console.error("chat error", err);
    res.status(500).json({ error: errMessage(err) });
  }
});

async function plainText(system: Anthropic.TextBlockParam[], messages: Anthropic.MessageParam[]): Promise<string> {
  const stream = client!.beta.messages.stream({
    model: MODEL,
    max_tokens: 2000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: EFFORT },
    system,
    messages,
  });
  const final = await stream.finalMessage();
  if (final.stop_reason === "refusal") return "这个我先不回，等他自己说。";
  return final.content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
}

function errMessage(err: unknown): string {
  if (err instanceof Anthropic.RateLimitError) return "分身现在有点忙，稍后再试。";
  if (err instanceof Anthropic.APIConnectionError) return "连接断了，再试一次。";
  return "出了点问题，再试一次。";
}

if (process.env.NODE_ENV === "production") {
  const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../dist");
  app.use(express.static(dist));
  app.get("/{*path}", (_req, res) => res.sendFile(path.join(dist, "index.html")));
}

app.listen(PORT, () => console.log(`Twin server on :${PORT}${MOCK ? " (mock AI)" : ` (${MODEL})`}`));
