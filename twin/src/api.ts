import type {
  AnswerRequest,
  AnswerResult,
  BriefRequest,
  BriefResult,
  ChatRequest,
  ChatResult,
  DraftRequest,
  DraftResult,
} from "../shared/types";

async function post<TReq, TRes>(path: string, body: TReq): Promise<TRes> {
  const res = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? `请求失败 (${res.status})`);
  }
  return (await res.json()) as TRes;
}

export const api = {
  answer: (req: AnswerRequest) => post<AnswerRequest, AnswerResult>("/api/twin/answer", req),
  draft: (req: DraftRequest) => post<DraftRequest, DraftResult>("/api/twin/draft", req),
  brief: (req: BriefRequest) => post<BriefRequest, BriefResult>("/api/twin/brief", req),
  chat: (req: ChatRequest) => post<ChatRequest, ChatResult>("/api/twin/chat", req),
};
