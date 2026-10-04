"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const IC: Record<string, React.ReactNode> = {
  discover: <><circle cx="12" cy="12" r="9" /><path d="M15.5 8.5l-2 5-5 2 2-5z" /></>,
  rank: <path d="M5 20V12M12 20V5M19 20v-9" />,
  create: <><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="M13.5 6.5l4 4" /></>,
  me: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20c1.3-3.5 4-5 7-5s5.7 1.5 7 5" /></>,
};

const ITEMS: [string, string, string, string?][] = [
  ["/", "发现", "discover"],
  ["/rank", "排行", "rank"],
  ["/create", "创作", "create", "center"],
  ["/me", "我的", "me"],
];

export function Nav() {
  const path = usePathname();
  const active = (href: string) =>
    href === "/" ? path === "/" || path.startsWith("/q/") || path.startsWith("/s/") : path.startsWith(href);
  return (
    <nav className="nav" aria-label="主导航">
      {ITEMS.map(([href, label, icon, cls]) => (
        <Link key={href} href={href} className={cls} aria-current={active(href) ? "page" : undefined}>
          <svg viewBox="0 0 24 24" aria-hidden="true">{IC[icon]}</svg>
          {label}
        </Link>
      ))}
    </nav>
  );
}

export function AskFab() {
  const path = usePathname();
  const show = path === "/" || path.startsWith("/rank") || path.startsWith("/q/");
  if (!show) return null;
  return (
    <Link href="/ask" className="fab">
      ＋ 提问
    </Link>
  );
}
