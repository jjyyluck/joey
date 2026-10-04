"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Avatar } from "./Avatar";
import { addStoryComment, deleteMyComment, listReplies, listStoryComments, toggleCommentLike, type ThreadComment } from "@/app/actions/social";
import { reportComment } from "@/app/actions/reading";
import { timeAgo } from "@/lib/format";

export function Comments({ storyId, signedIn, initialTotal }: { storyId: string; signedIn: boolean; initialTotal: number }) {
  const path = usePathname();
  const [sort, setSort] = useState<"hot" | "new">("hot");
  const [items, setItems] = useState<ThreadComment[] | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(initialTotal);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();

  const load = (s = sort, pg = 0) =>
    listStoryComments(storyId, s, pg).then((r) => {
      setItems((cur) => (pg === 0 ? r.items : [...(cur ?? []), ...r.items]));
      setHasMore(r.hasMore);
      setTotal(r.total);
      setPage(pg);
    });
  useEffect(() => {
    load(sort, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort, storyId]);

  const submit = () =>
    start(async () => {
      const r = await addStoryComment(storyId, text, replyTo?.id ?? null);
      if (r.error) return setErr(r.error);
      setText("");
      setErr("");
      setReplyTo(null);
      if (sort !== "new" && !replyTo) setSort("new");
      else load(sort, 0);
    });

  return (
    <section id="comments" className="pad" aria-label="评论">
      <div style={{ display: "flex", alignItems: "center" }}>
        <h2>评论 {total || ""}</h2>
        <span className="sp" />
        <div className="tabs" style={{ padding: 0 }}>
          <button aria-pressed={sort === "hot"} onClick={() => setSort("hot")}>
            最热
          </button>
          <button aria-pressed={sort === "new"} onClick={() => setSort("new")}>
            最新
          </button>
        </div>
      </div>
      {signedIn ? (
        <div className="field">
          {replyTo && (
            <span className="small">
              回复 {replyTo.name}{" "}
              <button className="linkb" onClick={() => setReplyTo(null)}>
                取消
              </button>
            </span>
          )}
          <textarea id="story-comment" value={text} onChange={(e) => setText(e.target.value)} maxLength={500} placeholder={replyTo ? `回复 ${replyTo.name}` : "写下你的评论"} style={{ minHeight: 70 }} />
          {err && <span className="err">{err}</span>}
          <div className="btnrow">
            <button className="btn small" disabled={pending || !text.trim()} onClick={submit}>
              发布
            </button>
          </div>
        </div>
      ) : (
        <Link className="btn ghost" href={`/login?next=${encodeURIComponent(path + "#comments")}`}>
          登录后发表评论
        </Link>
      )}
      {items === null ? (
        <span className="small">加载中…</span>
      ) : items.length === 0 ? (
        <span className="small">还没有评论，来说说你的想法。</span>
      ) : (
        items.map((c) => (
          <CommentItem
            key={`${c.id}:${c.replyCount}:${c.likes}`}
            c={c}
            signedIn={signedIn}
            onReply={(t) => {
              setReplyTo(t);
              document.getElementById("story-comment")?.focus();
            }}
            onRemoved={() => load(sort, 0)}
          />
        ))
      )}
      {hasMore && (
        <button className="btn ghost small" onClick={() => load(sort, page + 1)}>
          更多评论
        </button>
      )}
    </section>
  );
}

function CommentItem({ c, signedIn, onReply, onRemoved, isReply = false }: { c: ThreadComment; signedIn: boolean; onReply: (t: { id: string; name: string }) => void; onRemoved: () => void; isReply?: boolean }) {
  const [like, setLike] = useState({ on: c.liked, n: c.likes });
  const [replies, setReplies] = useState(c.replies);
  const [gone, setGone] = useState(false);
  if (gone) return null;
  const more = c.replyCount - replies.length;
  return (
    <div className={isReply ? "cmt reply" : "cmt"}>
      <Avatar name={c.name} size={isReply ? 24 : 32} />
      <div className="cbody">
        <Link href={`/u/${c.userId}`} className="small" style={{ fontWeight: 700, color: "var(--ink)" }}>
          {c.name}
        </Link>
        <span>{c.body}</span>
        <span className="cmeta">
          <span>{timeAgo(new Date(c.at))}</span>
          <button
            className="linkb"
            aria-pressed={like.on}
            disabled={!signedIn}
            onClick={async () => {
              setLike((l) => ({ on: !l.on, n: l.n + (l.on ? -1 : 1) }));
              const r = await toggleCommentLike(c.id);
              if (!r.error) setLike({ on: !!r.on, n: r.count ?? 0 });
            }}
          >
            {like.on ? "♥" : "♡"} {like.n || "赞"}
          </button>
          {signedIn && (
            <button className="linkb" onClick={() => onReply({ id: c.id, name: c.name })}>
              回复
            </button>
          )}
          {c.mine ? (
            <button
              className="linkb"
              onClick={async () => {
                await deleteMyComment(c.id);
                setGone(true);
                onRemoved();
              }}
            >
              删除
            </button>
          ) : (
            signedIn && (
              <button
                className="linkb"
                onClick={async () => {
                  await reportComment(c.id, "读者举报");
                  setGone(true);
                }}
              >
                举报
              </button>
            )
          )}
        </span>
        {replies.map((r) => (
          <CommentItem key={r.id} c={r} signedIn={signedIn} onReply={() => onReply({ id: c.id, name: r.name })} onRemoved={onRemoved} isReply />
        ))}
        {!isReply && more > 0 && (
          <button className="linkb" onClick={async () => setReplies(await listReplies(c.id))}>
            查看全部 {c.replyCount} 条回复
          </button>
        )}
      </div>
    </div>
  );
}
