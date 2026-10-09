import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatMode } from "../shared/types";
import { streamChat, updateMemory } from "./api";
import { chapter1, chapter2, GIFTS, sideStory, teaserOpener, UNLOCK_AFFINITY } from "./content/rafe-story";
import {
  append,
  bubbles,
  characterState,
  check,
  clearSave,
  DAILY_CHAT_AFFINITY_CAP,
  FREE_MSGS_PER_DAY,
  initialState,
  load,
  MEMORY_EVERY,
  save,
  SECRETS,
  type GameState,
  type LogEntry,
} from "./game";
import type { Option } from "./story/types";

const STORY_STAGES = new Set(["ch1", "ch2", "side"]);
const MAX_HISTORY = 40;

/** `patch` covers state changes queued in the same tick that the request must already see. */
type AiTask = { mode: ChatMode; message?: string; display?: Omit<LogEntry, "id">; patch?: Partial<GameState> };

export default function App() {
  const [s, setS] = useState<GameState>(load);
  const [typing, setTyping] = useState(false);
  const [live, setLive] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [drawer, setDrawer] = useState<"memory" | "gifts" | null>(null);
  const [fast, setFast] = useState(false);
  const [matched, setMatched] = useState(false);
  const stateRef = useRef(s);
  stateRef.current = s;
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => save(s), [s]);
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [s.log.length, live, typing, s.pending]);

  useEffect(() => {
    if (!banner) return;
    const t = setTimeout(() => setBanner(null), 5000);
    return () => clearTimeout(t);
  }, [banner]);

  const flash = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  }, []);

  // ---------- AI ----------

  const runAi = useCallback(
    async (task: AiTask) => {
      const before = { ...stateRef.current, ...task.patch };
      const teaserTurn = task.mode === "teaser" ? before.teaserCount + 1 : undefined;
      setS((p) => {
        let n = p;
        if (task.display) n = append(n, [task.display]);
        if (task.message) n = { ...n, aiHistory: [...n.aiHistory, { role: "user", text: task.message }] };
        if (teaserTurn) n = { ...n, teaserCount: teaserTurn };
        return n;
      });
      setBusy(true);
      setTyping(true);
      const result = await streamChat(
        {
          characterId: "rafe",
          mode: task.mode,
          state: characterState(before),
          history: before.aiHistory.slice(-MAX_HISTORY),
          message: task.message,
          teaserTurn,
        },
        (ev) => {
          if (ev.type === "delta") {
            setTyping(false);
            setLive((t) => (t ?? "") + ev.text);
          } else if (ev.type === "reset") setLive(null);
        },
      );
      setLive(null);
      setTyping(false);
      setBusy(false);

      if (result.type === "error") {
        flash(result.message);
        return;
      }
      if (result.type !== "done") return;
      const text = result.text;

      if (task.mode === "next_day") setBanner(bubbles(text)[0] ?? null);

      setS((p) => {
        let n = append(
          p,
          result.crisis
            ? [{ kind: "system", text }]
            : bubbles(text).map((b) => ({ kind: "msg" as const, from: "rafe" as const, text: b })),
        );
        n = { ...n, aiHistory: [...n.aiHistory, { role: "assistant", text }] };

        if (task.mode === "teaser" && n.teaserCount >= 3) {
          n = append({ ...n, stage: "post_teaser" }, [{ kind: "system", text: "Chapter 2 unlocked · Blue Elena" }]);
        }
        if (task.mode === "free" && task.message) {
          // Chatting slowly raises affinity (capped per day) and can unlock secrets / story events.
          const gain = n.affinityToday < DAILY_CHAT_AFFINITY_CAP ? 1 : 0;
          n = { ...n, affinity: Math.min(100, n.affinity + gain), affinityToday: n.affinityToday + gain };
          n = unlockSecrets(n);
          if (!n.ch3Teased && n.affinity >= 50 && n.day >= 2) {
            n = append({ ...n, ch3Teased: true }, [
              { kind: "system", text: "📖 New chapter triggered by your bond: Chapter 3 · Sunday Dinner (coming soon)" },
            ]);
          }
          n = { ...n, msgsSinceMemory: n.msgsSinceMemory + 1 };
        }
        return n;
      });
    },
    [flash],
  );

  // Refresh long-term memory every few exchanges.
  useEffect(() => {
    if (s.msgsSinceMemory < MEMORY_EVERY || busy) return;
    const snap = stateRef.current;
    setS((p) => ({ ...p, msgsSinceMemory: 0 }));
    void updateMemory({
      characterId: "rafe",
      memory: snap.memory,
      nickname: snap.nickname,
      recent: snap.aiHistory.slice(-16),
    }).then((r) => setS((p) => ({ ...p, memory: r.memory, nickname: r.nickname })));
  }, [s.msgsSinceMemory, busy]);

  // ---------- Story engine ----------

  const unlock = useCallback(
    (p: GameState): GameState =>
      append({ ...p, stage: "free", starterPackOffered: true }, [
        { kind: "system", text: "🔓 Private line unlocked — text Rafe anything, anytime." },
      ]),
    [],
  );

  const finishChapter = useCallback(() => {
    const p = stateRef.current;
    if (p.stage === "ch1") {
      setS((q) =>
        append({ ...q, stage: "teaser", chapterDone: 1 }, [
          { kind: "system", text: "Chapter 1 complete · Rafe is texting you…" },
          ...teaserOpener(q.tags).map((t) => ({ kind: "msg" as const, from: "rafe" as const, text: t })),
        ]),
      );
      setS((q) => ({ ...q, aiHistory: teaserOpener(q.tags).map((text) => ({ role: "assistant" as const, text })) }));
    } else if (p.stage === "ch2" || p.stage === "side") {
      if (p.affinity >= UNLOCK_AFFINITY) {
        setS((q) => unlock({ ...q, chapterDone: 2 }));
        void runAi({ mode: "unlock_open", patch: { chapterDone: 2 } });
      } else {
        setS((q) =>
          append({ ...q, stage: "locked", chapterDone: 2 }, [
            {
              kind: "system",
              text: `📶 Signal weak — Rafe still isn't sure he can drag you into this. Bond ${q.affinity}/${UNLOCK_AFFINITY} to unlock his private line.`,
            },
          ]),
        );
      }
    }
  }, [runAi, unlock]);

  useEffect(() => {
    if (!STORY_STAGES.has(s.stage) || s.pending) return;
    if (s.queue.length === 0) {
      finishChapter();
      return;
    }
    const node = s.queue[0];
    const isRafe = node.t === "msg" && node.from === "rafe";
    const base = node.t === "choice" || node.t === "branch" ? 0 : isRafe ? 1100 : node.t === "cg" ? 900 : 700;
    const delay = fast ? Math.min(base, 120) : base;
    if (isRafe && delay > 0) setTyping(true);
    const timer = setTimeout(() => {
      setTyping(false);
      setS((p) => step(p));
    }, delay);
    return () => clearTimeout(timer);
  }, [s.stage, s.queue, s.pending, fast, finishChapter]);

  function startChapter(stage: "ch1" | "ch2" | "side") {
    const ch = stage === "ch1" ? chapter1 : stage === "ch2" ? chapter2 : sideStory;
    setS((p) =>
      append({ ...p, stage, queue: ch.nodes, pending: null }, [
        { kind: "scene", text: ch.n ? `Chapter ${ch.n} · ${ch.title}` : `Side story · ${ch.title}` },
      ]),
    );
  }

  function choose(o: Option) {
    if (o.cost && o.cost > s.diamonds) {
      flash(`Not enough diamonds (need ${o.cost}💎)`);
      return;
    }
    setS((p) => {
      const ch = p.stage === "ch1" ? 1 : 2;
      let n: GameState = {
        ...p,
        pending: null,
        affinity: Math.min(100, p.affinity + o.affinity),
        diamonds: p.diamonds - (o.cost ?? 0),
        tags: [...p.tags, o.tag],
        choices: [...p.choices, { ch, id: o.tag, summary: o.summary }],
        queue: [...(o.reply ?? []), ...p.queue],
      };
      n = append(n, [o.say ? { kind: "msg", from: "player", text: o.say } : { kind: "narr", text: o.act ?? o.label }]);
      return n;
    });
    if (o.affinity >= 5) flash(`💗 +${o.affinity} bond`);
  }

  // ---------- Player actions ----------

  function send() {
    const text = input.trim();
    if (!text || busy) return;
    if (s.stage === "teaser") {
      if (s.teaserCount >= 3) return;
    } else if (s.stage === "free") {
      if (s.freeMsgsUsed >= FREE_MSGS_PER_DAY) {
        if (s.diamonds < 1) {
          flash("Out of free messages today — get diamonds or come back tomorrow");
          return;
        }
        setS((p) => ({ ...p, diamonds: p.diamonds - 1 }));
      }
      setS((p) => ({ ...p, freeMsgsUsed: p.freeMsgsUsed + 1 }));
    } else return;
    setInput("");
    void runAi({
      mode: s.stage === "teaser" ? "teaser" : "free",
      message: text,
      display: { kind: "msg", from: "player", text },
    });
  }

  function sendGift(g: (typeof GIFTS)[number]) {
    if (g.cost > s.diamonds) {
      flash(`Not enough diamonds (need ${g.cost}💎)`);
      return;
    }
    setDrawer(null);
    setS((p) => unlockSecrets({
      ...p,
      diamonds: p.diamonds - g.cost,
      affinity: Math.min(100, p.affinity + g.affinity),
      gifts: [...p.gifts, g.name],
    }));
    flash(`💗 +${g.affinity} bond`);
    void runAi({
      mode: "free",
      message: `[The player sent you a gift: ${g.name}]`,
      display: { kind: "gift", text: `${g.emoji} You sent ${g.name}` },
      patch: { gifts: [...s.gifts, g.name], affinity: Math.min(100, s.affinity + g.affinity) },
    });
  }

  function nextDay() {
    if (busy) return;
    setS((p) =>
      append({ ...p, day: p.day + 1, freeMsgsUsed: 0, affinityToday: 0 }, [{ kind: "system", text: `☀️ Day ${p.day + 1}` }]),
    );
    void runAi({ mode: "next_day", patch: { day: s.day + 1 } });
  }

  function reset() {
    clearSave();
    setS(initialState());
    setMatched(false);
    setBanner(null);
  }

  // ---------- Render ----------

  if (s.stage === "match") {
    return (
      <Shell>
        <MatchScreen
          matched={matched}
          onLike={() => {
            setMatched(true);
            setTimeout(() => {
              setS((p) => append(p, [{ kind: "system", text: "💘 You matched with Rafe" }]));
              startChapter("ch1");
            }, 1400);
          }}
        />
        <DevBar fast={fast} setFast={setFast} reset={reset} />
      </Shell>
    );
  }

  const canChat = s.stage === "teaser" || s.stage === "free";
  const quotaLeft = Math.max(0, FREE_MSGS_PER_DAY - s.freeMsgsUsed);

  return (
    <Shell>
      <div className="phone">
        {banner && (
          <button className="push" onClick={() => setBanner(null)}>
            <span className="push-app">MeChat · now</span>
            <b>Rafe</b> {banner}
          </button>
        )}
        <header className="top">
          <div className="avatar">R</div>
          <div className="who">
            <b>Rafe Castellano</b>
            <small>{typing || live ? "typing…" : canChat ? "online" : `Chapter ${s.stage === "ch1" ? 1 : 2}`}</small>
          </div>
          <div className="meters">
            <span className="bond" title="Bond">
              💗 {s.affinity}
            </span>
            <span className="gems" title="Diamonds">
              💎 {s.diamonds}
            </span>
            <button className="icon" onClick={() => setDrawer(drawer === "memory" ? null : "memory")} title="What he remembers">
              🧠
            </button>
          </div>
        </header>

        <div className="log" ref={listRef}>
          {s.log.map((e) => (
            <Entry key={e.id} e={e} />
          ))}
          {live && bubbles(live).map((b, i) => <div key={`live${i}`} className="bubble rafe">{b}</div>)}
          {typing && !live && (
            <div className="bubble rafe typing">
              <i />
              <i />
              <i />
            </div>
          )}
          {s.starterPackOffered && !s.starterPackBought && s.stage === "free" && (
            <div className="offer">
              <b>Starter pack · $0.99</b>
              <span>60 💎 · his first voice note · “The Burner Phone” photo</span>
              <button
                onClick={() => {
                  setS((p) => append({ ...p, diamonds: p.diamonds + 60, starterPackBought: true }, [{ kind: "system", text: "🎁 Starter pack added (prototype: no real payment)" }]));
                }}
              >
                Get it
              </button>
            </div>
          )}
        </div>

        <footer className="bottom">
          {STORY_STAGES.has(s.stage) && s.pending && (
            <div className="choices">
              {s.pending.map((o) => (
                <button key={o.tag} className={o.cost ? "choice premium" : "choice"} onClick={() => choose(o)}>
                  {o.label}
                  {o.cost ? <em>{o.cost}💎</em> : null}
                </button>
              ))}
            </div>
          )}

          {s.stage === "post_teaser" && (
            <div className="actions">
              <button className="primary" onClick={() => startChapter("ch2")}>
                Continue · Chapter 2: Blue Elena
              </button>
              <button onClick={nextDay} disabled={busy}>
                ⏭ Skip to tomorrow (see his day-2 message)
              </button>
            </div>
          )}

          {s.stage === "locked" && (
            <div className="actions">
              <button className="primary" onClick={() => startChapter("side")}>
                Side story (free): The Cat Has a Name Now
              </button>
              <button
                onClick={() => {
                  if (s.diamonds < 10) return flash("Not enough diamonds (need 10💎)");
                  setS((p) => {
                    const n = { ...p, diamonds: p.diamonds - 10, affinity: p.affinity + 10 };
                    return n.affinity >= UNLOCK_AFFINITY ? unlock(n) : n;
                  });
                  if (s.affinity + 10 >= UNLOCK_AFFINITY) void runAi({ mode: "unlock_open", patch: { affinity: s.affinity + 10 } });
                }}
              >
                Win him over · +10 bond <em>10💎</em>
              </button>
            </div>
          )}

          {canChat && (
            <>
              <div className="hint">
                {s.stage === "teaser"
                  ? `Late-night chat · ${3 - s.teaserCount} free replies left`
                  : quotaLeft > 0
                    ? `${quotaLeft} free messages left today`
                    : "Free messages used · 1💎 per message"}
              </div>
              <form
                className="composer"
                onSubmit={(ev) => {
                  ev.preventDefault();
                  send();
                }}
              >
                {s.stage === "free" && (
                  <button type="button" className="icon" onClick={() => setDrawer(drawer === "gifts" ? null : "gifts")} title="Send a gift">
                    🎁
                  </button>
                )}
                <input
                  value={input}
                  onChange={(ev) => setInput(ev.target.value)}
                  placeholder={s.stage === "teaser" && s.teaserCount >= 3 ? "He had to go…" : "Message Rafe"}
                  disabled={busy || (s.stage === "teaser" && s.teaserCount >= 3)}
                  maxLength={500}
                />
                <button type="submit" className="send" disabled={busy || !input.trim()}>
                  ↑
                </button>
              </form>
              {s.stage === "free" && (
                <button className="link" onClick={nextDay} disabled={busy}>
                  ⏭ Skip to tomorrow
                </button>
              )}
            </>
          )}
        </footer>

        {drawer === "gifts" && (
          <div className="drawer">
            <h3>Send Rafe a gift</h3>
            {GIFTS.map((g) => (
              <button key={g.id} className="gift" onClick={() => sendGift(g)}>
                <span>{g.emoji}</span>
                <span>{g.name}</span>
                <em>{g.cost}💎</em>
              </button>
            ))}
            <p className="muted">Gifts raise your bond, and he'll remember them.</p>
          </div>
        )}
        {drawer === "memory" && <MemoryDrawer s={s} onClose={() => setDrawer(null)} />}
        {toast && <div className="toast">{toast}</div>}
      </div>
      <DevBar
        fast={fast}
        setFast={setFast}
        reset={reset}
        addGems={() => setS((p) => ({ ...p, diamonds: p.diamonds + 50 }))}
        addBond={() => setS((p) => unlockSecrets({ ...p, affinity: Math.min(100, p.affinity + 10) }))}
      />
    </Shell>
  );
}

/** Pop one node off the queue and apply it. */
function step(p: GameState): GameState {
  const [node, ...rest] = p.queue;
  let n: GameState = { ...p, queue: rest };
  if (!node) return n;
  if ("if" in node && node.t !== "branch" && !check(node.if, n)) return n;
  switch (node.t) {
    case "msg":
      return append(n, [{ kind: "msg", from: node.from, name: node.name, text: node.text }]);
    case "narr":
      return append(n, [{ kind: "narr", text: node.text }]);
    case "scene":
      return append(n, [{ kind: "scene", text: node.text }]);
    case "cg":
      return append(n, [{ kind: "cg", text: node.title, desc: node.desc }]);
    case "choice":
      return { ...n, pending: node.options };
    case "branch": {
      const taken = check(node.if, n);
      if (taken && node.flag) n = { ...n, tags: [...n.tags, node.flag] };
      return { ...n, queue: [...(taken ? node.then : (node.else ?? [])), ...rest] };
    }
  }
}

function unlockSecrets(p: GameState): GameState {
  let n = p;
  for (const sec of SECRETS) {
    if (n.affinity >= sec.minAffinity && !n.secrets.includes(sec.id)) {
      n = append({ ...n, secrets: [...n.secrets, sec.id] }, [
        { kind: "system", text: `🔐 Secret unlocked: ${sec.label} — ask him about it` },
      ]);
    }
  }
  return n;
}

function Entry({ e }: { e: LogEntry }) {
  switch (e.kind) {
    case "msg":
      return (
        <div className={`bubble ${e.from}`}>
          {e.from === "npc" && <span className="npc-name">{e.name}</span>}
          {e.text}
        </div>
      );
    case "narr":
      return <p className="narr">{e.text}</p>;
    case "scene":
      return <div className="scene">{e.text}</div>;
    case "cg":
      return (
        <figure className="cg">
          <div className="cg-art">
            <span>CG</span>
          </div>
          <figcaption>
            <b>{e.text}</b>
            <span>{e.desc}</span>
          </figcaption>
        </figure>
      );
    case "gift":
      return <div className="gift-sent">{e.text}</div>;
    case "system":
      return <div className="system">{e.text}</div>;
  }
}

function MemoryDrawer({ s, onClose }: { s: GameState; onClose: () => void }) {
  return (
    <div className="drawer tall">
      <h3>
        What Rafe remembers <button className="icon" onClick={onClose}>✕</button>
      </h3>
      <section>
        <h4>Story moments</h4>
        {s.choices.length ? (
          <ul>
            {s.choices.map((c, i) => (
              <li key={i}>
                <small>Ch{c.ch}</small> {c.summary}
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">Nothing yet.</p>
        )}
      </section>
      <section>
        <h4>From your chats</h4>
        {s.memory.length ? (
          <ul>
            {s.memory.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        ) : (
          <p className="muted">He'll start remembering details after a few messages.</p>
        )}
        {s.nickname && <p>He calls you <b>{s.nickname}</b>.</p>}
      </section>
      <section>
        <h4>Secrets</h4>
        <ul>
          {SECRETS.map((sec) => (
            <li key={sec.id} className={s.secrets.includes(sec.id) ? "" : "muted"}>
              {s.secrets.includes(sec.id) ? "🔓" : "🔒"} {s.secrets.includes(sec.id) ? sec.label : `Bond ${sec.minAffinity}`}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function MatchScreen({ matched, onLike }: { matched: boolean; onLike: () => void }) {
  // Card layout follows docs/style/match-card-style.md: full-bleed art, black fade,
  // full name, zodiac glyph + one-line tagline, rewind / nope / like.
  return (
    <div className="phone match">
      <div className="brand">MeChat</div>
      <div className="card">
        <div className="card-art">
          <span>R</span>
        </div>
        <div className="card-info">
          <h2>Rafe Castellano</h2>
          <p className="tagline">
            <span className="zodiac">♏&#xFE0E;</span> I need a date in two hours. Don't ask questions. 😏
          </p>
          <div className="swipe">
            <button className="rewind" onClick={() => alert("Prototype: nothing to rewind yet")} aria-label="Rewind">
              ↺
            </button>
            <button className="nope" onClick={() => alert("Prototype: only Rafe is in the deck — give him a chance 😏")} aria-label="Pass">
              ✕
            </button>
            <button className="like" onClick={onLike} disabled={matched} aria-label="Like">
              ♥
            </button>
          </div>
        </div>
      </div>
      {matched && <div className="matched">It's a match!</div>}
    </div>
  );
}

function DevBar(props: { fast: boolean; setFast: (v: boolean) => void; reset: () => void; addGems?: () => void; addBond?: () => void }) {
  return (
    <div className="dev">
      <span>Prototype tools</span>
      <label>
        <input type="checkbox" checked={props.fast} onChange={(e) => props.setFast(e.target.checked)} /> fast text
      </label>
      {props.addGems && <button onClick={props.addGems}>+50💎</button>}
      {props.addBond && <button onClick={props.addBond}>+10 bond</button>}
      <button onClick={props.reset}>Reset</button>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="shell">{children}</div>;
}
