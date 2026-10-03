import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { characters } from "./characters/index.js";
import { buildMessages, buildSystem, TEASER_TURNS } from "./prompt.js";
import { CRISIS_REPLY, isCrisis } from "./safety.js";
import { mockReply } from "./mock.js";
import type { ChatEvent, ChatRequest, MemoryRequest, MemoryResponse } from "../shared/types.js";

const MODEL = process.env.CHAT_MODEL ?? "claude-opus-5-5";
// Chat is latency-sensitive and does well at low effort; raise it if quality needs it.
const CHAT_EFFORT = (process.env.CHAT_EFFORT ?? "low") as "low" | "medium" | "high";
const MOCK = process.env.MOCK_AI === "1";
const PORT = Number(process.env.PORT ?? 8787);

const client = MOCK ? null : new Anthropic();
const app = express();
app.use(express.json({ limit: "1mb" }));

function send(res: express.Response, ev: ChatEvent) {
  res.write(`data: ${JSON.stringify(ev)}\n\n`);
}

app.post("/api/chat", async (req, res) => {
  const body = req.body as ChatRequest;
  const def = characters[body.characterId];
  if (!def) return void res.status(404).json({ error: "unknown character" });
  if (body.mode === "teaser" && (body.teaserTurn ?? 1) > TEASER_TURNS) {
    return void res.status(403).json({ error: "teaser limit reached" });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.flushHeaders();

  if (body.message && isCrisis(body.message)) {
    send(res, { type: "done", text: CRISIS_REPLY, crisis: true });
    return void res.end();
  }

  if (!client) {
    const text = mockReply(body);
    for (const word of text.split(/(?<= )/)) send(res, { type: "delta", text: word });
    send(res, { type: "done", text });
    return void res.end();
  }

  try {
    const stream = client.beta.messages.stream({
      model: MODEL,
      max_tokens: 4000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: CHAT_EFFORT },
      system: buildSystem(def, body.state, body.mode, body.teaserTurn),
      messages: buildMessages(body.history, body.mode, body.message),
    });

    let text = "";
    for await (const event of stream) {
      if (event.type === "content_block_start" && event.content_block.type === "fallback") {
        // The first model declined mid-stream and a fallback model continues: drop the partial.
        text = "";
        send(res, { type: "reset" });
      } else if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        text += event.delta.text;
        send(res, { type: "delta", text: event.delta.text });
      }
    }
    const final = await stream.finalMessage();
    if (final.stop_reason === "refusal") {
      console.warn("chat refusal", final.stop_details);
      send(res, { type: "reset" });
      send(res, { type: "done", text: def.refusalLine });
    } else {
      send(res, { type: "done", text: text.trim() });
    }
  } catch (err) {
    console.error("chat error", err);
    const message =
      err instanceof Anthropic.RateLimitError
        ? "He's getting a lot of messages right now. Try again in a moment."
        : err instanceof Anthropic.APIConnectionError
          ? "Connection lost. Try again."
          : "Something went wrong. Try again.";
    send(res, { type: "error", message });
  }
  res.end();
});

const MemorySchema = z.object({
  facts: z.array(z.string()).describe("Durable facts about the player and the relationship, newest last, max 20"),
  nickname: z.string().nullable().describe("What Rafe should call the player, if the player gave a name or nickname"),
});

app.post("/api/memory", async (req, res) => {
  const body = req.body as MemoryRequest;
  if (!client) {
    const r: MemoryResponse = { memory: body.memory, nickname: body.nickname };
    return void res.json(r);
  }
  try {
    const transcript = body.recent.map((t) => `${t.role === "user" ? "Player" : "Rafe"}: ${t.text}`).join("\n");
    const response = await client.messages.parse({
      model: MODEL,
      max_tokens: 4000,
      output_config: { effort: "low", format: zodOutputFormat(MemorySchema) },
      messages: [
        {
          role: "user",
          content: [
            "You maintain the long-term memory of a character in a romance chat story.",
            "Merge the existing facts with anything new and durable from the recent conversation:",
            "the player's name, job, preferences, plans, things they shared, promises made, inside jokes, gifts.",
            "Skip small talk. Keep each fact under 20 words, written from Rafe's point of view about the player.",
            "",
            `Existing facts:\n${body.memory.map((m) => `- ${m}`).join("\n") || "(none)"}`,
            `Current nickname: ${body.nickname ?? "(none)"}`,
            "",
            `Recent conversation:\n${transcript}`,
          ].join("\n"),
        },
      ],
    });
    const parsed = response.parsed_output;
    if (!parsed) return void res.json({ memory: body.memory, nickname: body.nickname });
    res.json({ memory: parsed.facts.slice(-20), nickname: parsed.nickname ?? body.nickname } satisfies MemoryResponse);
  } catch (err) {
    console.error("memory error", err);
    res.json({ memory: body.memory, nickname: body.nickname } satisfies MemoryResponse);
  }
});

if (process.env.NODE_ENV === "production") {
  const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../dist");
  app.use(express.static(dist));
  app.get("/{*path}", (_req, res) => res.sendFile(path.join(dist, "index.html")));
}

app.listen(PORT, () => console.log(`MeChat AI server on :${PORT}${MOCK ? " (mock AI)" : ` (${MODEL})`}`));
