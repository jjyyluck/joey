import type { ChatEvent, ChatRequest, MemoryRequest, MemoryResponse } from "../shared/types";

/** POST /api/chat and read the SSE stream. Resolves with the final text. */
export async function streamChat(req: ChatRequest, onEvent: (ev: ChatEvent) => void): Promise<ChatEvent> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok || !res.body) {
    const ev: ChatEvent = { type: "error", message: `Server error (${res.status})` };
    onEvent(ev);
    return ev;
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let last: ChatEvent = { type: "error", message: "Connection closed" };
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? "";
    for (const frame of frames) {
      if (!frame.startsWith("data: ")) continue;
      const ev = JSON.parse(frame.slice(6)) as ChatEvent;
      onEvent(ev);
      if (ev.type === "done" || ev.type === "error") last = ev;
    }
  }
  return last;
}

export async function updateMemory(req: MemoryRequest): Promise<MemoryResponse> {
  const res = await fetch("/api/memory", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) return { memory: req.memory, nickname: req.nickname };
  return (await res.json()) as MemoryResponse;
}
