"use client";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toggleStoryLike } from "@/app/actions/social";
import { toggleBookmark } from "@/app/actions/reading";

type Props = { storyId: string; likes: number; liked: boolean; comments: number; bookmarked: boolean; signedIn: boolean; title: string };

/** Bottom bar on the reader: like, jump to comments, bookmark, share. */
export function ActionBar(p: Props) {
  const router = useRouter();
  const path = usePathname();
  const [like, setLike] = useState({ on: p.liked, n: p.likes });
  const [mark, setMark] = useState(p.bookmarked);
  const [toast, setToast] = useState("");
  const [, start] = useTransition();
  const flash = (t: string) => {
    setToast(t);
    setTimeout(() => setToast(""), 1800);
  };
  const needLogin = () => {
    if (p.signedIn) return false;
    router.push(`/login?next=${encodeURIComponent(path)}`);
    return true;
  };
  return (
    <div className="actionbar" role="toolbar" aria-label="故事操作">
      <button
        className="likeb"
        aria-pressed={like.on}
        onClick={() => {
          if (needLogin()) return;
          setLike((l) => ({ on: !l.on, n: l.n + (l.on ? -1 : 1) }));
          start(async () => {
            const r = await toggleStoryLike(p.storyId);
            if (r.error) flash(r.error);
            else setLike({ on: !!r.on, n: r.count ?? 0 });
          });
        }}
      >
        ▲ {like.on ? "已赞同" : "赞同"} {like.n || ""}
      </button>
      <span className="sp" />
      <a className="abtn" href="#comments">
        <span aria-hidden="true">💬</span> {p.comments || "评论"}
      </a>
      <button
        className="abtn"
        aria-pressed={mark}
        onClick={() => {
          if (needLogin()) return;
          start(async () => {
            const r = await toggleBookmark(p.storyId);
            if (r.error) flash(r.error);
            else {
              setMark(!!r.on);
              flash(r.on ? "已加入书架" : "已移出书架");
            }
          });
        }}
      >
        <span aria-hidden="true">{mark ? "★" : "☆"}</span> {mark ? "已收藏" : "收藏"}
      </button>
      <button
        className="abtn"
        onClick={async () => {
          const url = location.origin + path;
          try {
            if (navigator.share) await navigator.share({ title: p.title, url });
            else {
              await navigator.clipboard.writeText(url);
              flash("链接已复制");
            }
          } catch {
            /* share sheet dismissed */
          }
        }}
      >
        分享
      </button>
      {toast && (
        <span className="toast" role="status">
          {toast}
        </span>
      )}
    </div>
  );
}
