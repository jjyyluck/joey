import { describe, expect, it } from "vitest";
import { authorCut, evaluate, fmtUSD } from "@/lib/adaptation-rules";

const T = { minReads: 1000, minCompletion: 0.5, minVotes: 30, minRating: 8, minDays: 7 };
const good = { reads: 1500, completion: 0.62, votes: 40, rating: 8.6, daysLive: 10 };

describe("evaluate", () => {
  it("is eligible only when every threshold is met", () => {
    expect(evaluate(good, T).eligible).toBe(true);
    const low = evaluate({ ...good, rating: 7.9 }, T);
    expect(low.eligible).toBe(false);
    expect(low.checks.filter((c) => !c.pass).map((c) => c.key)).toEqual(["rating"]);
  });
  it("lets an editor invitation bypass the thresholds", () => {
    const r = evaluate({ reads: 3, completion: 0, votes: 0, rating: 0, daysLive: 0 }, T, true);
    expect(r.eligible).toBe(true);
    expect(r.metAll).toBe(false);
  });
  it("does not pass rating with zero votes and clamps progress", () => {
    const r = evaluate({ ...good, votes: 0, rating: 0, reads: 5000 }, T);
    expect(r.checks.find((c) => c.key === "rating")!.pass).toBe(false);
    expect(r.checks.find((c) => c.key === "reads")!.progress).toBe(1);
  });
});

describe("authorCut", () => {
  it("takes the locked share, rounded down to the cent", () => {
    expect(authorCut(100050, 0.2)).toBe(20010);
    expect(authorCut(999, 0.2)).toBe(199);
  });
  it("pays nothing on loss months", () => {
    expect(authorCut(-5000, 0.2)).toBe(0);
  });
  it("formats dollars", () => {
    expect(fmtUSD(20010)).toBe("$200.10");
  });
});
