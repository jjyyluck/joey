import { describe, expect, it } from "vitest";
import { charCount, clampPaywall, splitParagraphs, suggestPaywall } from "@/lib/upload";

describe("splitParagraphs", () => {
  it("splits on newlines, trims and drops blanks", () => {
    expect(splitParagraphs("  第一段 \r\n\r\n　第二段\n\n")).toEqual(["第一段", "第二段"]);
  });
});

describe("charCount", () => {
  it("ignores whitespace", () => {
    expect(charCount(["a b", "c"])).toBe(3);
  });
});

describe("suggestPaywall", () => {
  it("cuts after about a quarter of the text", () => {
    const ps = Array.from({ length: 20 }, () => "十个字十个字十个字十");
    expect(suggestPaywall(ps)).toBe(5);
  });
  it("never cuts at 0 or after the last paragraph", () => {
    expect(suggestPaywall(["很长".repeat(100), "短"])).toBe(1);
    expect(suggestPaywall(["只有一段"])).toBe(1);
  });
});

describe("clampPaywall", () => {
  it("keeps at least one free and one paid paragraph", () => {
    expect(clampPaywall(0, 10)).toBe(1);
    expect(clampPaywall(99, 10)).toBe(9);
    expect(clampPaywall(4.6, 10)).toBe(5);
  });
});
