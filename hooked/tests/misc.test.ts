import { describe, expect, it } from "vitest";
import { extractJSON } from "@/lib/ai";
import { easternDay, easternWeekStart } from "@/lib/time";
import { checkText } from "@/lib/moderation";

describe("extractJSON", () => {
  it("parses fenced and prose-wrapped JSON", () => {
    expect(extractJSON('```json\n{"a":1}\n```')).toEqual({ a: 1 });
    expect(extractJSON('好的：["x","y"] 以上')).toEqual(["x", "y"]);
  });
});

describe("eastern time", () => {
  it("uses the New York calendar day", () => {
    // 03:00 UTC on Oct 5 is still Oct 4 in New York
    expect(easternDay(new Date("2026-10-05T03:00:00Z")).toISOString().slice(0, 10)).toBe("2026-10-04");
  });
  it("weeks start on Monday", () => {
    expect(easternWeekStart(new Date("2026-10-04T15:00:00Z")).toISOString().slice(0, 10)).toBe("2026-09-28");
  });
});

describe("checkText", () => {
  it("rejects links and contact details", () => {
    expect(checkText("看这里 https://x.com")).toMatch(/链接/);
    expect(checkText("call 555-123-4567")).toMatch(/电话/);
    expect(checkText("好故事")).toBeNull();
  });
});
