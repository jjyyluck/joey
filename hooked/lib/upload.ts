/** Upload helpers shared by the server action and unit tests (no I/O here). */

export const MIN_CHARS = 300;
export const MAX_CHARS = 60_000;

export function splitParagraphs(raw: string): string[] {
  return raw
    .replace(/\r\n?/g, "\n")
    .split(/\n+/)
    .map((p) => p.replace(/[ 　\s]+/g, " ").trim())
    .filter((p) => p.length > 0);
}

export const charCount = (ps: string[]) => ps.reduce((n, p) => n + p.replace(/\s/g, "").length, 0);

/** Default paywall: after the paragraph where ~25% of the characters have been read, never 0, never the last. */
export function suggestPaywall(ps: string[], ratio = 0.25): number {
  if (ps.length < 2) return ps.length;
  const total = charCount(ps);
  let acc = 0;
  for (let i = 0; i < ps.length; i++) {
    acc += ps[i].replace(/\s/g, "").length;
    if (acc >= total * ratio) return Math.min(Math.max(1, i + 1), ps.length - 1);
  }
  return Math.max(1, ps.length - 1);
}

export function clampPaywall(n: number, len: number): number {
  if (len < 2) return len;
  return Math.min(Math.max(1, Math.round(n)), len - 1);
}

export function heuristicTitles(ps: string[]): string[] {
  const first = (ps[0] ?? "").split(/[。！？!?]/)[0].slice(0, 24);
  return [first, (ps[1] ?? "").split(/[。！？!?]/)[0].slice(0, 24)].filter((t) => t.length >= 4);
}

export const preview = (ps: string[]) => ps.join("").slice(0, 200);

export type UploadAnalysis = {
  titles: string[];
  line: string;
  category: string;
  questionId: string | null;
  newQuestion: string;
  paywallAfter: number;
  hookOk: boolean;
  notes: string[];
  source: "ai" | "rules";
};
