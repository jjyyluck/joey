export function fmtN(n: number): string {
  if (n >= 10000) return (n / 10000).toFixed(n >= 100000 ? 0 : 1).replace(/\.0$/, "") + " 万";
  return n.toLocaleString("en-US");
}

export function readMinutes(chars: number): number {
  return Math.max(1, Math.round(chars / 500));
}

export function timeAgo(d: Date, now = new Date()): string {
  const s = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (s < 60) return "刚刚";
  if (s < 3600) return `${Math.floor(s / 60)} 分钟前`;
  if (s < 86400) return `${Math.floor(s / 3600)} 小时前`;
  if (s < 86400 * 30) return `${Math.floor(s / 86400)} 天前`;
  return d.toISOString().slice(0, 10);
}
