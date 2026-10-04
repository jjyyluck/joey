/** Eligibility and revenue-share rules for AI comic adaptations. Pure, so they can be unit-tested. */

export type AdaptMetrics = { reads: number; completion: number; votes: number; rating: number; daysLive: number };
export type AdaptThresholds = { minReads: number; minCompletion: number; minVotes: number; minRating: number; minDays: number };

export const DEFAULT_THRESHOLDS: AdaptThresholds = {
  minReads: Number(process.env.ADAPT_MIN_READS ?? 1000),
  minCompletion: Number(process.env.ADAPT_MIN_COMPLETION ?? 0.5),
  minVotes: Number(process.env.ADAPT_MIN_VOTES ?? 30),
  minRating: Number(process.env.ADAPT_MIN_RATING ?? 8),
  minDays: Number(process.env.ADAPT_MIN_DAYS ?? 7),
};

export const AUTHOR_SHARE = Number(process.env.ADAPT_AUTHOR_SHARE ?? 0.2);

export type Check = { key: keyof AdaptMetrics; label: string; value: string; target: string; pass: boolean; progress: number };

export function evaluate(m: AdaptMetrics, t: AdaptThresholds = DEFAULT_THRESHOLDS, invited = false) {
  const pct = (x: number) => `${Math.round(x * 100)}%`;
  const checks: Check[] = [
    { key: "reads", label: "阅读人数", value: m.reads.toLocaleString("en-US"), target: `≥ ${t.minReads.toLocaleString("en-US")}`, pass: m.reads >= t.minReads, progress: m.reads / t.minReads },
    { key: "completion", label: "读完率", value: pct(m.completion), target: `≥ ${pct(t.minCompletion)}`, pass: m.completion >= t.minCompletion, progress: m.completion / t.minCompletion },
    { key: "votes", label: "评分人数", value: String(m.votes), target: `≥ ${t.minVotes}`, pass: m.votes >= t.minVotes, progress: m.votes / t.minVotes },
    { key: "rating", label: "平均分", value: m.votes ? m.rating.toFixed(1) : "—", target: `≥ ${t.minRating}`, pass: m.votes > 0 && m.rating >= t.minRating, progress: m.votes ? m.rating / t.minRating : 0 },
    { key: "daysLive", label: "上线天数", value: String(m.daysLive), target: `≥ ${t.minDays}`, pass: m.daysLive >= t.minDays, progress: m.daysLive / t.minDays },
  ].map((c) => ({ ...c, progress: Math.max(0, Math.min(1, c.progress)) })) as Check[];
  const metAll = checks.every((c) => c.pass);
  return { checks, eligible: metAll || invited, metAll, invited };
}

/** Author's cut of one month's net revenue, rounded down to the cent. Negative months pay nothing. */
export function authorCut(netCents: number, sharePct: number): number {
  if (netCents <= 0) return 0;
  return Math.floor(netCents * sharePct);
}

export const fmtUSD = (cents: number) => `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const ADAPT_STATUS: Record<string, [string, "warn" | "good" | "bad" | ""]> = {
  APPLIED: ["申请审核中", "warn"],
  ACCEPTED: ["已通过，待制作", "good"],
  IN_PRODUCTION: ["制作中", "good"],
  RELEASED: ["已上线", "good"],
  DECLINED: ["未通过", "bad"],
};
