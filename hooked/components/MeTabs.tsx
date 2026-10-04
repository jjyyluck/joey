import Link from "next/link";

const TABS: [string, string][] = [
  ["/me/questions", "我的提问"],
  ["/me/shelf", "书架"],
  ["/me/following", "关注"],
  ["/me/submissions", "我的投稿"],
  ["/me/adaptations", "漫剧"],
  ["/me/notifications", "通知"],
];

export function MeTabs({ active }: { active: string }) {
  return (
    <nav className="tabs" aria-label="我的">
      {TABS.map(([h, l]) => (
        <Link key={h} href={h} aria-current={h === active ? "page" : undefined}>
          {l}
        </Link>
      ))}
    </nav>
  );
}

export const SUB_STATUS: Record<string, [string, string]> = {
  REVIEWING: ["编辑审核中", "warn"],
  CHANGES_REQUESTED: ["需要修改", "bad"],
  APPROVED: ["已上线", "good"],
  REJECTED: ["未通过", "bad"],
};
