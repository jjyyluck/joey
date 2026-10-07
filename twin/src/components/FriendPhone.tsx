import { useEffect, useRef, useState } from "react";
import { LEVEL_LABEL, TIER_LABEL } from "../../shared/types";
import { QUICK_QUESTIONS } from "../data/seed";
import { friendOf, type State } from "../state";
import { ActionTag, Badge } from "./Badge";

type Props = {
  state: State;
  friendId: string;
  busy: boolean;
  onSwitch: (friendId: string) => void;
  onBack: () => void;
  onAsk: (friendId: string, question: string) => void;
  onWaitHuman: (friendId: string) => void;
};

/**
 * What a friend sees when they open the user's page: the user's own posts, and a chat with the user's twin.
 * The twin is labelled, and the friend can always ask for the real person.
 */
export function FriendPhone({ state, friendId, busy, onSwitch, onBack, onAsk, onWaitHuman }: Props) {
  const friend = friendOf(state, friendId);
  const thread = state.threads[friendId] ?? { turns: [], waitingHuman: false };
  const [input, setInput] = useState("");
  const [tab, setTab] = useState<"twin" | "posts">("twin");
  const listRef = useRef<HTMLDivElement>(null);
  const me = state.bible.name;

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [thread.turns.length, busy]);

  const ask = (q: string) => {
    const text = q.trim();
    if (!text || busy) return;
    setInput("");
    onAsk(friendId, text);
  };

  return (
    <div className="friend-phone">
      <header className="topbar alt">
        <button className="ghost small" onClick={onBack}>
          ← 回到我的手机
        </button>
        <div className="switch">
          <small>你现在是</small>
          <select value={friendId} onChange={(e) => onSwitch(e.target.value)}>
            {state.friends.map((f) => (
              <option key={f.id} value={f.id}>
                {f.emoji} {f.name}
              </option>
            ))}
          </select>
        </div>
      </header>

      <div className="profile">
        <span className="avatar big">🫵</span>
        <div>
          <h2>{me}</h2>
          <small>
            对你：{TIER_LABEL[friend.tier]} · 分身 {LEVEL_LABEL[friend.level]}
          </small>
        </div>
      </div>

      <div className="subtabs">
        <button className={tab === "twin" ? "on" : ""} onClick={() => setTab("twin")}>
          问{me}的分身
        </button>
        <button className={tab === "posts" ? "on" : ""} onClick={() => setTab("posts")}>
          {me}的动态
        </button>
      </div>

      {tab === "posts" && (
        <div className="feed small">
          {state.posts.filter((p) => p.authorId === "me").length === 0 && <div className="empty">{me}还没发过动态。</div>}
          {state.posts
            .filter((p) => p.authorId === "me")
            .map((p) => (
              <article className="post" key={p.id}>
                <header>
                  <span className="avatar">🫵</span>
                  <div className="who">
                    <b>
                      {me} <Badge kind="me" />
                    </b>
                    <small>{p.time}</small>
                  </div>
                </header>
                <div className="body">
                  {p.hasPhoto && <div className="photo-block" />}
                  {p.text}
                </div>
              </article>
            ))}
        </div>
      )}

      {tab === "twin" && (
        <>
          <div className="list" ref={listRef}>
            <div className="sys">
              你在和 <b>{me}的分身</b> 聊。它只会说{me}允许它对你说的事；随时可以点「等真人回我」。
            </div>
            {thread.turns.map((t, i) => (
              <div key={i} className={`bubble ${t.role === "friend" ? "user" : "twin"} ${t.role === "me" ? "human" : ""}`}>
                {t.role !== "friend" && (
                  <div className="from">
                    {t.role === "me" ? <Badge kind="me" /> : <Badge kind="friend-twin" />}
                    {t.action && t.role === "twin" && <ActionTag action={t.action} guarded={t.guarded} />}
                  </div>
                )}
                <div className="text">{t.text}</div>
              </div>
            ))}
            {busy && <div className="typing">…</div>}
            {thread.waitingHuman && <div className="sys wait">分身已退出，{me}本人会来回你。</div>}
          </div>
          <div className="examples">
            {(QUICK_QUESTIONS[friendId] ?? []).map((q) => (
              <button key={q} className="chip" onClick={() => ask(q)} disabled={busy}>
                {q}
              </button>
            ))}
          </div>
          <div className="composer">
            <input placeholder={`问${me}的分身…`} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && ask(input)} />
            <button className="primary small" disabled={!input.trim() || busy} onClick={() => ask(input)}>
              发
            </button>
            <button className="ghost small" disabled={thread.waitingHuman} onClick={() => onWaitHuman(friendId)}>
              等真人回我
            </button>
          </div>
        </>
      )}
    </div>
  );
}
