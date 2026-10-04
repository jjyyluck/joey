import Link from "next/link";

const TABS: [string, string][] = [
  ["/editor", "审核队列"],
  ["/editor/picks", "编辑推荐"],
  ["/editor/reports", "举报"],
  ["/editor/stories", "故事管理"],
];

export function EditorTabs({ active }: { active: string }) {
  return (
    <nav className="tabs" aria-label="编辑后台">
      {TABS.map(([h, l]) => (
        <Link key={h} href={h} aria-current={h === active ? "page" : undefined}>
          {l}
        </Link>
      ))}
    </nav>
  );
}
