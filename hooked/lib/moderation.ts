/** Lightweight, synchronous text checks applied to all user-written text before it is saved. */

const BLOCK = [/https?:\/\//i, /www\./i, /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/, /[\w.+-]+@[\w-]+\.[\w.]+/];
const SLURS: string[] = (process.env.MODERATION_BLOCKLIST ?? "").split(",").map((s) => s.trim()).filter(Boolean);

export function checkText(text: string, { min = 1, max = 500 } = {}): string | null {
  const t = text.trim();
  if (t.length < min) return `至少写 ${min} 个字`;
  if (t.length > max) return `不能超过 ${max} 个字`;
  if (BLOCK.some((r) => r.test(t))) return "请不要留下链接、电话或邮箱";
  if (SLURS.some((w) => t.includes(w))) return "内容包含不允许的词语";
  return null;
}
