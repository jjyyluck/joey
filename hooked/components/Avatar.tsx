const HUES = [200, 160, 20, 280, 330, 40, 110, 240];

/** Initial-letter avatar; colour is stable per name. */
export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.codePointAt(0)!) >>> 0;
  const hue = HUES[h % HUES.length];
  return (
    <span
      className="avatar"
      aria-hidden="true"
      style={{ width: size, height: size, fontSize: size * 0.42, background: `hsl(${hue} 45% 42%)` }}
    >
      {[...name.trim()][0] ?? "?"}
    </span>
  );
}
