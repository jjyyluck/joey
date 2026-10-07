import { useEffect, useRef, useState } from "react";
import { friendOf, type Card, type Msg, type State } from "../state";
import { ActionTag, Badge } from "./Badge";

type Props = {
  state: State;
  busy: boolean;
  onChat: (message: string) => void;
  onDraft: (material: string, hasPhoto: boolean) => void;
  onPublish: (msgId: string, text: string, hasPhoto: boolean) => void;
  onDrop: (msgId: string) => void;
  onApprove: (msgId: string, text: string) => void;
  onSelf: (msgId: string, text: string) => void;
  onRetractCard: (msgId: string) => void;
  onGoCircle: () => void;
};

/** The product's main screen: a conversation with your own twin. Friends arrive here as cards. */
export function TwinChat(p: Props) {
  const [input, setInput] = useState("");
  const [photo, setPhoto] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [p.state.chat.length, p.busy]);

  const send = (mode: "chat" | "draft") => {
    const text = input.trim();
    if (!text || p.busy) return;
    setInput("");
    if (mode === "chat") p.onChat(text);
    else {
      p.onDraft(text, photo);
      setPhoto(false);
    }
  };

  return (
    <div className="chat">
      <div className="list" ref={listRef}>
        {p.state.chat.length === 0 && <div className="typing">分身正在整理圈子里昨晚的事…</div>}
        {p.state.chat.map((m) => (
          <Row key={m.id} msg={m} {...p} />
        ))}
        {p.busy && p.state.chat.length > 0 && <div className="typing">…</div>}
      </div>
      <div className="composer">
        <button className={photo ? "icon on" : "icon"} title="附一张照片（示意）" onClick={() => setPhoto(!photo)}>
          📷
        </button>
        <input
          placeholder={photo ? "照片配一句话，分身帮你起草" : "跟分身说点什么，或者记一下今天的事"}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send(photo ? "draft" : "chat")}
        />
        <button className="ghost small" disabled={!input.trim() || p.busy} onClick={() => send("chat")}>
          聊
        </button>
        <button className="primary small" disabled={!input.trim() || p.busy} onClick={() => send("draft")}>
          记一下
        </button>
      </div>
      <div className="examples">
        {["今天爬了佘山，腿废了", "火锅第三周", "项目上线了", "圈子里今天有什么事"].map((e) => (
          <button key={e} className="chip" onClick={() => setInput(e)}>
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}

function Row({ msg, ...p }: { msg: Msg } & Props) {
  if (msg.card) return <CardView id={msg.id} card={msg.card} {...p} />;
  return (
    <div className={`bubble ${msg.role}`}>
      {msg.role === "twin" && (
        <div className="from">
          <Badge kind="twin" />
        </div>
      )}
      <div className="text">{msg.text}</div>
    </div>
  );
}

function CardView({ id, card, ...p }: { id: string; card: Card } & Props) {
  const { state } = p;
  const [edit, setEdit] = useState<string | null>(null);
  const [selfText, setSelfText] = useState("");

  if (card.kind === "draft_post") {
    return (
      <div className={`card ${card.status}`}>
        <div className="card-head">
          <Badge kind="twin" /> 帮你起了条动态
        </div>
        {edit !== null ? <textarea rows={3} value={edit} onChange={(e) => setEdit(e.target.value)} /> : <div className="post-preview">{card.hasPhoto && <span className="photo" />}{card.post}</div>}
        {card.status === "pending" ? (
          <div className="actions">
            {edit !== null ? (
              <button className="primary small" onClick={() => p.onPublish(id, edit.trim() || card.post, card.hasPhoto)}>
                改好了，发
              </button>
            ) : (
              <>
                <button className="primary small" onClick={() => p.onPublish(id, card.post, card.hasPhoto)}>
                  发
                </button>
                <button className="ghost small" onClick={() => setEdit(card.post)}>
                  改一下
                </button>
                <button className="ghost small" onClick={() => p.onDrop(id)}>
                  算了
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="status">
            {card.status === "posted" ? (
              <>
                已发出，圈子里显示为<b>本人</b>。{" "}
                <button className="link" onClick={p.onGoCircle}>
                  去看看
                </button>
              </>
            ) : (
              "没发。"
            )}
          </div>
        )}
      </div>
    );
  }

  if (card.kind === "nudge") {
    const f = friendOf(state, card.friendId);
    return (
      <div className={`card nudge ${card.status}`}>
        <div className="card-head">
          <Badge kind="twin" /> 该你出面 · {f.emoji} {f.name}
        </div>
        <div className="text">{card.text}</div>
        {card.status === "pending" ? (
          <div className="self-reply">
            <input placeholder={`以你本人的身份回${f.name}…`} value={selfText} onChange={(e) => setSelfText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && selfText.trim() && p.onSelf(id, selfText.trim())} />
            <button className="primary small" disabled={!selfText.trim()} onClick={() => p.onSelf(id, selfText.trim())}>
              我来说
            </button>
          </div>
        ) : (
          <div className="status">你亲自回了。</div>
        )}
      </div>
    );
  }

  // friend_question
  const f = friendOf(state, card.friendId);
  const r = card.result;
  return (
    <div className={`card q ${card.status}`}>
      <div className="card-head">
        {f.emoji} {f.name} 问分身 <ActionTag action={card.status === "sent" && r.action === "draft" ? "answer" : r.action} guarded={r.guarded} />
      </div>
      <div className="quote">“{card.question}”</div>
      <div className="reason">{r.reason}</div>

      {card.status === "pending" && (
        <>
          <div className="proposed">
            <small>我打算这么回：</small>
            {edit !== null ? <textarea rows={3} value={edit} onChange={(e) => setEdit(e.target.value)} /> : <div>{r.text}</div>}
          </div>
          <div className="actions">
            <button className="primary small" onClick={() => p.onApprove(id, (edit ?? r.text).trim() || r.text)}>
              {edit !== null ? "改好了，发" : "就这么回"}
            </button>
            {edit === null && (
              <button className="ghost small" onClick={() => setEdit(r.text)}>
                改一下
              </button>
            )}
          </div>
          <div className="self-reply">
            <input placeholder="或者你自己回…" value={selfText} onChange={(e) => setSelfText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && selfText.trim() && p.onSelf(id, selfText.trim())} />
            <button className="ghost small" disabled={!selfText.trim()} onClick={() => p.onSelf(id, selfText.trim())}>
              我自己回
            </button>
          </div>
        </>
      )}
      {card.status === "sent" && (
        <>
          <div className="proposed sent">
            <small>我回的：</small>
            <div>{r.text}</div>
          </div>
          <div className="actions">
            <button className="ghost small danger" onClick={() => p.onRetractCard(id)}>
              撤回并说明
            </button>
          </div>
        </>
      )}
      {card.status === "closed" && (
        <div className="proposed sent">
          <small>我对{f.name}说的：</small>
          <div>{r.text}</div>
        </div>
      )}
      {card.status === "retracted" && <div className="status">已撤回，并告诉{f.name}那条是分身说的。</div>}
      {card.status === "self" && <div className="status">你自己回了。</div>}
    </div>
  );
}
