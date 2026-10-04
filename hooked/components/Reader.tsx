"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { addComment, listComments, rateStory, recordRead, reportComment, type CommentView } from "@/app/actions/reading";

type Props = {
  storyId: string;
  paragraphs: string[];
  total: number;
  paywallAfter: number;
  unlocked: boolean;
  signedIn: boolean;
  commentCounts: Record<number, number>;
  myRating: number | null;
};

export function Reader(p: Props) {
  const path = usePathname();
  const maxSeen = useRef(0);
  const sent = useRef({ max: -1, fin: false });
  const [sheet, setSheet] = useState<number | null>(null);
  const [rating, setRating] = useState(p.myRating);
  const [msg, setMsg] = useState("");
  const [, start] = useTransition();

  // Track how far the reader got; flush progress at most every few seconds and on leave.
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>("[data-pi]");
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) maxSeen.current = Math.max(maxSeen.current, Number(e.target.getAttribute("data-pi")) + 1);
      });
    });
    els.forEach((el) => io.observe(el));
    const flush = () => {
      const fin = maxSeen.current >= p.total;
      if (maxSeen.current > sent.current.max || (fin && !sent.current.fin)) {
        sent.current = { max: maxSeen.current, fin };
        recordRead(p.storyId, maxSeen.current, fin).catch(() => {});
      }
    };
    const t = setInterval(flush, 5000);
    const onHide = () => document.visibilityState === "hidden" && flush();
    document.addEventListener("visibilitychange", onHide);
    flush();
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onHide);
      io.disconnect();
      flush();
    };
  }, [p.storyId, p.total]);

  const finishedVisible = p.unlocked;
  const login = `/login?next=${encodeURIComponent(path)}`;

  return (
    <>
      <article className="reader">
        {p.paragraphs.map((t, i) => (
          <p key={i} data-pi={i}>
            {t}
            <button className="pcb" onClick={() => setSheet(i)} aria-label={`第 ${i + 1} 段的段评`}>
              {p.commentCounts[i] ? p.commentCounts[i] : "＋"}
            </button>
          </p>
        ))}
      </article>
      {!p.unlocked && (
        <div className="paywall">
          <b>后面还有 {p.total - p.paywallAfter} 段</b>
          <span className="small">登录后可以继续读完。付费功能上线前，所有故事登录后限时免费。</span>
          <div className="btnrow">
            <Link className="btn" href={login}>
              登录继续读
            </Link>
            <Link className="btn ghost" href={`/signup?next=${encodeURIComponent(path)}`}>
              注册
            </Link>
          </div>
        </div>
      )}
      {finishedVisible && (
        <div className="pad">
          <div className="card soft">
            <b>读完了，给这个故事打个分</b>
            <div className="stars" role="group" aria-label="评分 1 到 10">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  aria-pressed={rating === n}
                  onClick={() =>
                    start(async () => {
                      await recordRead(p.storyId, p.total, true).catch(() => {});
                      const r = await rateStory(p.storyId, n);
                      if (r.error) setMsg(r.error);
                      else {
                        setRating(n);
                        setMsg("已打分");
                      }
                    })
                  }
                >
                  {n}
                </button>
              ))}
            </div>
            {msg && <span className="small">{msg}</span>}
          </div>
          <div className="btnrow">
            <Link className="btn ghost" href="/ask">
              我也想问一个
            </Link>
          </div>
        </div>
      )}
      {sheet !== null && <CommentSheet storyId={p.storyId} paragraph={sheet} signedIn={p.signedIn} login={login} onClose={() => setSheet(null)} />}
    </>
  );
}

function CommentSheet({ storyId, paragraph, signedIn, login, onClose }: { storyId: string; paragraph: number; signedIn: boolean; login: string; onClose: () => void }) {
  const [items, setItems] = useState<CommentView[] | null>(null);
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();
  const load = () => listComments(storyId, paragraph).then(setItems);
  useEffect(() => {
    load();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paragraph]);
  return (
    <>
      <div className="sheet-bg" onClick={onClose} />
      <div className="sheet" role="dialog" aria-label={`第 ${paragraph + 1} 段的段评`}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <b>第 {paragraph + 1} 段 · 段评</b>
          <span className="sp" />
          <button className="btn small ghost" onClick={onClose}>
            关闭
          </button>
        </div>
        {signedIn ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              start(async () => {
                const r = await addComment(storyId, paragraph, text);
                if (r.error) setErr(r.error);
                else {
                  setText("");
                  setErr("");
                  load();
                }
              });
            }}
            className="field"
          >
            <textarea id="cm-text" value={text} onChange={(e) => setText(e.target.value)} placeholder="说说你读到这里的想法" maxLength={300} style={{ minHeight: 70 }} />
            {err && <span className="err">{err}</span>}
            <div className="btnrow">
              <button className="btn small" disabled={pending || !text.trim()}>
                发送
              </button>
            </div>
          </form>
        ) : (
          <Link className="btn ghost" href={login}>
            登录后发段评
          </Link>
        )}
        {items === null ? (
          <span className="small">加载中…</span>
        ) : items.length === 0 ? (
          <span className="small">这一段还没有段评，来写第一条。</span>
        ) : (
          items.map((c) => (
            <div key={c.id} className="cm">
              <span className="small">{c.name}</span>
              <span>{c.body}</span>
              {!c.mine && signedIn && (
                <button
                  className="small"
                  style={{ border: 0, background: "none", alignSelf: "flex-start", padding: 0 }}
                  onClick={async () => {
                    await reportComment(c.id, "读者举报");
                    setItems((xs) => xs!.filter((x) => x.id !== c.id));
                  }}
                >
                  举报并隐藏
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </>
  );
}
