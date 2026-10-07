import { useCallback, useEffect, useRef, useState } from "react";
import type { AnswerResult, BriefEvent, Level, Tier } from "../shared/types";
import { api } from "./api";
import { Circle } from "./components/Circle";
import { FriendPhone } from "./components/FriendPhone";
import { LogPanel } from "./components/LogPanel";
import { Onboarding } from "./components/Onboarding";
import { TwinChat } from "./components/TwinChat";
import { SEED_QUESTIONS } from "./data/seed";
import {
  appendThread,
  cardMsg,
  clearSave,
  friendOf,
  initialState,
  load,
  logEntry,
  save,
  twinMsg,
  uid,
  updateCard,
  userMsg,
  type Card,
  type Post,
  type State,
} from "./state";

export type Tab = "twin" | "circle" | "log";

const DRAFT_LINE = (name: string) => `我先帮你记下，${name}看到会确认后回你。`;
const RETRACT_LINE = "刚才那条是我的分身替我说的，我收回。";
const EXIT_LINE = "好，我退了。我现在就提醒他亲自回你。";

export default function App() {
  const [s, setS] = useState<State>(load);
  const [tab, setTab] = useState<Tab>("twin");
  const [viewAs, setViewAs] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const stateRef = useRef(s);
  stateRef.current = s;

  useEffect(() => save(s), [s]);

  const flash = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  }, []);

  const fail = useCallback((err: unknown) => flash(err instanceof Error ? err.message : "出了点问题"), [flash]);

  // ---------- Applying a twin decision (shared by seeding, friend view, approvals) ----------

  /** Turn an AnswerResult into thread turns, a chat card and a log entry. Returns the card's message id. */
  const applyAnswer = useCallback((st: State, friendId: string, question: string, r: AnswerResult): State => {
    const friend = friendOf(st, friendId);
    const cardId = uid("m");
    const base: Extract<Card, { kind: "friend_question" }> = { kind: "friend_question", friendId, question, result: r, status: "pending" };
    let n = st;
    switch (r.action) {
      case "answer": {
        n = appendThread(n, friendId, { role: "twin", text: r.text, action: "answer", guarded: r.guarded });
        n = { ...n, chat: [...n.chat, { id: cardId, role: "twin", card: { ...base, status: "sent" }, time: time() }] };
        n = { ...n, log: [...n.log, logEntry({ friendId, cardId, action: "answer", detail: `替你回了${friend.name}：「${r.text}」`, retractable: true, guarded: r.guarded })] };
        break;
      }
      case "draft": {
        n = appendThread(n, friendId, { role: "twin", text: DRAFT_LINE(st.bible.name), action: "draft" });
        n = { ...n, chat: [...n.chat, { id: cardId, role: "twin", card: base, time: time() }] };
        n = { ...n, log: [...n.log, logEntry({ friendId, cardId, action: "draft", detail: `${friend.name}问「${question}」，回复留给你确认。`, retractable: false })] };
        break;
      }
      case "defer": {
        n = appendThread(n, friendId, { role: "twin", text: r.text, action: "defer", guarded: r.guarded });
        n = { ...n, chat: [...n.chat, { id: cardId, role: "twin", card: { ...base, status: "closed" }, time: time() }] };
        n = { ...n, log: [...n.log, logEntry({ friendId, cardId, action: "defer", detail: `${friend.name}问「${question}」，范围外，我没透露。`, retractable: false, guarded: r.guarded })] };
        break;
      }
      case "escalate": {
        n = appendThread(n, friendId, { role: "twin", text: r.text, action: "escalate" }, true);
        const nudge: Card = { kind: "nudge", friendId, text: `${friend.name}刚才的消息我没替你回：「${question}」。这件事该你亲自说。`, status: "pending" };
        n = { ...n, chat: [...n.chat, { id: cardId, role: "twin", card: nudge, time: time() }] };
        n = { ...n, log: [...n.log, logEntry({ friendId, cardId, action: "escalate", detail: `${friend.name}的消息需要真人处理，我已退出并通知你。`, retractable: false })] };
        break;
      }
    }
    return n;
  }, []);

  // ---------- Seeding: overnight activity + the morning brief ----------

  useEffect(() => {
    if (s.phase !== "app" || s.seeded || busy) return;
    let cancelled = false;
    (async () => {
      setBusy(true);
      try {
        let n: State = { ...stateRef.current, seeded: true };
        const events: BriefEvent[] = n.posts
          .filter((p) => p.authorId !== "me")
          .map((p) => ({ kind: "post", text: `${friendOf(n, p.authorId).name}：${p.text}` }));
        for (const q of SEED_QUESTIONS) {
          const friend = friendOf(n, q.friendId);
          n = appendThread(n, q.friendId, { role: "friend", text: q.question });
          const r = await api.answer({ bible: n.bible, friend, question: q.question, history: [] });
          n = applyAnswer(n, q.friendId, q.question, r);
          events.push({
            kind: r.action === "draft" ? "pending" : "question",
            text: `${friend.name}问：「${q.question}」。${r.reason}`,
          });
        }
        for (const p of n.posts.filter((p) => p.bigNews)) {
          const friend = friendOf(n, p.authorId);
          const nudge: Card = { kind: "nudge", friendId: p.authorId, postId: p.id, text: `${friend.name}凌晨发了「${p.text}」。这件事我没替你回应，建议你亲自说一句。`, status: "pending" };
          n = { ...n, chat: [...n.chat, cardMsg(nudge)] };
          events.push({ kind: "nudge", text: `${friend.name}发了「${p.text}」，我没有代回，这件事该他本人出面。` });
        }
        const { brief } = await api.brief({ bible: n.bible, events });
        n = { ...n, chat: [twinMsg(brief), ...n.chat] };
        if (!cancelled) setS(n);
      } catch (err) {
        if (!cancelled) {
          fail(err);
          setS((p) => ({ ...p, seeded: true, chat: [twinMsg("早。圈子里的事我没拉到（服务没连上）。先聊点别的？")] }));
        }
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.phase, s.seeded]);

  // ---------- User ↔ twin ----------

  const chat = useCallback(
    async (message: string) => {
      const before = stateRef.current;
      setS((p) => ({ ...p, chat: [...p.chat, userMsg(message)] }));
      setBusy(true);
      try {
        const history = before.chat.filter((m) => m.text).map((m) => ({ role: m.role, text: m.text! })).slice(-12);
        const { reply } = await api.chat({ bible: before.bible, history, message });
        setS((p) => ({ ...p, chat: [...p.chat, twinMsg(reply)] }));
      } catch (err) {
        fail(err);
      } finally {
        setBusy(false);
      }
    },
    [fail],
  );

  const draftPost = useCallback(
    async (material: string, hasPhoto: boolean) => {
      const before = stateRef.current;
      setS((p) => ({ ...p, chat: [...p.chat, userMsg(`${hasPhoto ? "📷 " : ""}${material}`)] }));
      setBusy(true);
      try {
        const { post } = await api.draft({ bible: before.bible, material, hasPhoto });
        setS((p) => ({ ...p, chat: [...p.chat, cardMsg({ kind: "draft_post", material, post, hasPhoto, status: "pending" })] }));
      } catch (err) {
        fail(err);
      } finally {
        setBusy(false);
      }
    },
    [fail],
  );

  const publishPost = useCallback((msgId: string, text: string, hasPhoto: boolean) => {
    const post: Post = { id: uid("p"), authorId: "me", byTwin: true, text, time: "刚刚", seenBy: [], reactions: [], replies: [], hasPhoto };
    setS((p) => {
      let n = updateCard(p, msgId, (c) => (c.kind === "draft_post" ? { ...c, post: text, status: "posted" } : c));
      n = { ...n, posts: [post, ...n.posts] };
      n = { ...n, log: [...n.log, logEntry({ action: "post", postId: post.id, detail: `你确认后发出了动态：「${text}」`, retractable: false })] };
      return n;
    });
    flash("已发出。圈子里显示为你本人。");
  }, [flash]);

  const dropDraft = useCallback((msgId: string) => {
    setS((p) => updateCard(p, msgId, (c) => (c.kind === "draft_post" ? { ...c, status: "dropped" } : c)));
  }, []);

  const approveDraft = useCallback((msgId: string, text: string) => {
    setS((p) => {
      const m = p.chat.find((x) => x.id === msgId);
      if (!m?.card || m.card.kind !== "friend_question") return p;
      const { friendId } = m.card;
      let n = appendThread(p, friendId, { role: "twin", text, action: "answer" });
      n = updateCard(n, msgId, (c) => (c.kind === "friend_question" ? { ...c, status: "sent", result: { ...c.result, text } } : c));
      n = { ...n, log: [...n.log, logEntry({ friendId, cardId: msgId, action: "answer", detail: `你确认后，我回了${friendOf(p, friendId).name}：「${text}」`, retractable: true })] };
      return n;
    });
  }, []);

  const selfReply = useCallback((msgId: string, text: string) => {
    setS((p) => {
      const m = p.chat.find((x) => x.id === msgId);
      if (!m?.card) return p;
      const friendId = m.card.kind === "friend_question" || m.card.kind === "nudge" ? m.card.friendId : null;
      if (!friendId) return p;
      let n = appendThread(p, friendId, { role: "me", text }, false);
      n = updateCard(n, msgId, (c) => (c.kind === "friend_question" ? { ...c, status: "self" } : c.kind === "nudge" ? { ...c, status: "done" } : c));
      // A nudge about a post: the personal reply also lands under that post in the circle.
      if (m.card.kind === "nudge" && m.card.postId) {
        const postId = m.card.postId;
        n = { ...n, posts: n.posts.map((po) => (po.id === postId ? { ...po, replies: [...po.replies, { by: "me", text, byTwin: false }] } : po)) };
      }
      return n;
    });
    flash("你本人回的，分身退到一边。");
  }, [flash]);

  const retract = useCallback((logId: string) => {
    setS((p) => {
      const entry = p.log.find((l) => l.id === logId);
      if (!entry || entry.retracted) return p;
      let n: State = { ...p, log: p.log.map((l) => (l.id === logId ? { ...l, retracted: true } : l)) };
      if (entry.action === "answer" && entry.friendId) {
        n = appendThread(n, entry.friendId, { role: "twin", text: RETRACT_LINE });
        if (entry.cardId) n = updateCard(n, entry.cardId, (c) => (c.kind === "friend_question" ? { ...c, status: "retracted" } : c));
      }
      if (entry.action === "react" && entry.postId) {
        n = { ...n, posts: n.posts.map((po) => (po.id === entry.postId ? { ...po, reactions: po.reactions.filter((r) => !(r.byTwin && r.by === "me")) } : po)) };
      }
      return n;
    });
    flash("已撤回，并向对方说明。");
  }, [flash]);

  // ---------- Circle ----------

  const react = useCallback((postId: string, emoji: string) => {
    setS((p) => ({
      ...p,
      posts: p.posts.map((po) =>
        po.id === postId ? { ...po, reactions: [...po.reactions.filter((r) => !(r.by === "me" && !r.byTwin)), { emoji, by: "me", byTwin: false }] } : po,
      ),
    }));
  }, []);

  const replyPost = useCallback((postId: string, text: string) => {
    setS((p) => {
      let n: State = { ...p, posts: p.posts.map((po) => (po.id === postId ? { ...po, replies: [...po.replies, { by: "me", text, byTwin: false }] } : po)) };
      n = { ...n, chat: n.chat.map((m) => (m.card?.kind === "nudge" && m.card.postId === postId ? { ...m, card: { ...m.card, status: "done" } } : m)) };
      return n;
    });
    flash("你亲自回的。");
  }, [flash]);

  // ---------- Settings: tier / level, with re-evaluation ----------

  const setFriend = useCallback((friendId: string, patch: { tier?: Tier; level?: Level }) => {
    setS((p) => {
      let n: State = { ...p, friends: p.friends.map((f) => (f.id === friendId ? { ...f, ...patch } : f)) };
      const friend = friendOf(n, friendId);
      // L1+: the twin may leave low-risk reactions on this friend's ordinary posts.
      if (friend.level >= 1) {
        for (const po of n.posts.filter((x) => x.authorId === friendId && !x.bigNews && !x.reactions.some((r) => r.byTwin))) {
          n = { ...n, posts: n.posts.map((x) => (x.id === po.id ? { ...x, reactions: [...x.reactions, { emoji: "🙂", by: "me", byTwin: true }] } : x)) };
          n = { ...n, log: [...n.log, logEntry({ friendId, postId: po.id, action: "react", detail: `给${friend.name}的动态「${po.text.slice(0, 18)}…」回了个表情。`, retractable: true })] };
        }
      }
      // L2+: pending in-scope drafts for this friend go out now.
      if (friend.level >= 2) {
        for (const m of n.chat) {
          if (m.card?.kind === "friend_question" && m.card.friendId === friendId && m.card.status === "pending" && m.card.result.action === "draft") {
            const text = m.card.result.text;
            n = appendThread(n, friendId, { role: "twin", text, action: "answer" });
            n = updateCard(n, m.id, (c) => (c.kind === "friend_question" ? { ...c, status: "sent" } : c));
            n = { ...n, log: [...n.log, logEntry({ friendId, cardId: m.id, action: "answer", detail: `你把${friend.name}升到 L2，我把等待中的回复发了：「${text}」`, retractable: true })] };
          }
        }
      }
      return n;
    });
  }, []);

  // ---------- Friend view ----------

  const askTwin = useCallback(
    async (friendId: string, question: string) => {
      const before = stateRef.current;
      const friend = friendOf(before, friendId);
      const history = (before.threads[friendId]?.turns ?? [])
        .filter((t) => t.role !== "me")
        .map((t) => ({ role: t.role as "friend" | "twin", text: t.text }))
        .slice(-10);
      setS((p) => appendThread(p, friendId, { role: "friend", text: question }));
      setBusy(true);
      try {
        const r = await api.answer({ bible: before.bible, friend, question, history });
        setS((p) => applyAnswer(p, friendId, question, r));
      } catch (err) {
        fail(err);
      } finally {
        setBusy(false);
      }
    },
    [applyAnswer, fail],
  );

  const waitHuman = useCallback((friendId: string) => {
    setS((p) => {
      const friend = friendOf(p, friendId);
      let n = appendThread(p, friendId, { role: "twin", text: EXIT_LINE, action: "escalate" }, true);
      n = { ...n, chat: [...n.chat, cardMsg({ kind: "nudge", friendId, text: `${friend.name}说要等你本人回。我退出来了，你有空去说一句。`, status: "pending" })] };
      n = { ...n, log: [...n.log, logEntry({ friendId, action: "exit", detail: `${friend.name}要求真人回复，我已退出。`, retractable: false })] };
      return n;
    });
  }, []);

  const reset = useCallback(() => {
    clearSave();
    setS(initialState());
    setTab("twin");
    setViewAs(null);
  }, []);

  // ---------- Render ----------

  if (s.phase === "onboarding") {
    return (
      <div className="shell">
        <div className="phone">
          <Onboarding bible={s.bible} friends={s.friends} onDone={(bible, friends) => setS((p) => ({ ...p, bible, friends, phase: "app" }))} />
        </div>
      </div>
    );
  }

  if (viewAs) {
    return (
      <div className="shell">
        <div className="phone phone-friend">
          <FriendPhone
            state={s}
            friendId={viewAs}
            busy={busy}
            onSwitch={setViewAs}
            onBack={() => setViewAs(null)}
            onAsk={askTwin}
            onWaitHuman={waitHuman}
          />
        </div>
        {toast && <div className="toast">{toast}</div>}
      </div>
    );
  }

  const pending = s.chat.filter((m) => m.card && (m.card.status === "pending")).length;

  return (
    <div className="shell">
      <div className="phone">
        <header className="topbar">
          <div className="title">
            <span className="dot" />
            {tab === "twin" ? `${s.bible.name}的分身` : tab === "circle" ? "圈子" : "分身日志"}
          </div>
          <button className="ghost small" onClick={() => setViewAs("ajie")}>
            朋友视角 →
          </button>
        </header>

        <main className="screen">
          {tab === "twin" && (
            <TwinChat state={s} busy={busy} onChat={chat} onDraft={draftPost} onPublish={publishPost} onDrop={dropDraft} onApprove={approveDraft} onSelf={selfReply} onRetractCard={(cardId) => {
              const entry = s.log.find((l) => l.cardId === cardId && l.action === "answer" && !l.retracted);
              if (entry) retract(entry.id);
            }} onGoCircle={() => setTab("circle")} />
          )}
          {tab === "circle" && <Circle state={s} onReact={react} onReply={replyPost} />}
          {tab === "log" && <LogPanel state={s} onSetFriend={setFriend} onRetract={retract} onReset={reset} />}
        </main>

        <nav className="tabs">
          <button className={tab === "twin" ? "on" : ""} onClick={() => setTab("twin")}>
            分身{pending > 0 && <span className="pill">{pending}</span>}
          </button>
          <button className={tab === "circle" ? "on" : ""} onClick={() => setTab("circle")}>
            圈子
          </button>
          <button className={tab === "log" ? "on" : ""} onClick={() => setTab("log")}>
            日志 / 授权
          </button>
        </nav>
        {toast && <div className="toast">{toast}</div>}
      </div>
    </div>
  );
}

function time(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
