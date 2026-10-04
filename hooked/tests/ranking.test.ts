import { describe, expect, it } from "vitest";
import { bayesian, praiseScore, weekHeat } from "@/lib/ranking-math";

describe("weekHeat", () => {
  it("weights finishes, comments and bookmarks above reads", () => {
    expect(weekHeat({ reads: 10, finishes: 2, comments: 1, bookmarks: 1 })).toBe(10 + 6 + 2 + 2);
  });
});

describe("bayesian", () => {
  it("pulls a story with few votes toward the site mean", () => {
    const few = bayesian(3, 10, 7, 30);
    const many = bayesian(300, 9.5, 7, 30);
    expect(few).toBeCloseTo(7.27, 2);
    expect(many).toBeGreaterThan(few);
  });
  it("returns 0 with no votes and no prior", () => {
    expect(bayesian(0, 0, 7, 0)).toBe(0);
  });
});

describe("praiseScore", () => {
  it("scales between 0.9x and 1.1x by completion", () => {
    expect(praiseScore(8, 0)).toBeCloseTo(7.2);
    expect(praiseScore(8, 1)).toBeCloseTo(8.8);
    expect(praiseScore(8, 5)).toBeCloseTo(8.8);
  });
});
