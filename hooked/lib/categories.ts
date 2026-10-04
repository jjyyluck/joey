export const CATEGORIES = [
  "家庭偏心",
  "婚姻背叛",
  "职场打脸",
  "校园逆袭",
  "金钱反转",
  "身份反转",
  "复仇",
  "当众打脸",
  "发现秘密",
  "婚礼修罗场",
  "职业经历",
  "重生穿越",
  "古言宫廷",
  "离奇故事",
] as const;

export type Category = (typeof CATEGORIES)[number];

export function isCategory(v: string): v is Category {
  return (CATEGORIES as readonly string[]).includes(v);
}
