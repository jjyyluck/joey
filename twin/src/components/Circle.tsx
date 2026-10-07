import { useState } from "react";
import { friendOf, type Post, type State } from "../state";
import { Badge } from "./Badge";

const EMOJIS = ["🙂", "❤️", "😮", "😢", "👏"];

type Props = { state: State; onReact: (postId: string, emoji: string) => void; onReply: (postId: string, text: string) => void };

/** Path's timeline, kept as Path left it: friends only, newest first, no algorithm, "seen by" and emoji reactions. */
export function Circle({ state, onReact, onReply }: Props) {
  return (
    <div className="feed">
      <div className="feed-note">只有真人确认过的内容会出现在这里。分身的互动在「日志」里，不进信息流。</div>
      {state.posts.map((p) => (
        <PostView key={p.id} post={p} state={state} onReact={onReact} onReply={onReply} />
      ))}
    </div>
  );
}

function PostView({ post, state, onReact, onReply }: { post: Post; state: State } & Omit<Props, "state">) {
  const [reply, setReply] = useState("");
  const [open, setOpen] = useState(false);
  const mine = post.authorId === "me";
  const author = mine ? { name: state.bible.name, emoji: "🫵" } : friendOf(state, post.authorId);
  const seen = post.seenBy.map((id) => friendOf(state, id).name);

  return (
    <article className={`post ${post.bigNews ? "big" : ""}`}>
      <header>
        <span className="avatar">{author.emoji}</span>
        <div className="who">
          <b>
            {author.name} {mine && <Badge kind="me" />}
          </b>
          <small>{post.time}</small>
        </div>
      </header>
      <div className="body">
        {post.hasPhoto && <div className="photo-block" />}
        {post.text}
      </div>
      {post.bigNews && !post.replies.some((r) => !r.byTwin) && <div className="big-note">分身不会替你回应这条。</div>}
      <footer>
        <div className="reactions">
          {post.reactions.map((r, i) => (
            <span key={i} className={`react ${r.byTwin ? "by-twin" : ""}`} title={r.byTwin ? "你的分身回的" : "你本人回的"}>
              {r.emoji}
              {r.byTwin && <small>分身</small>}
            </span>
          ))}
          {!mine &&
            EMOJIS.map((e) => (
              <button key={e} className="emoji" onClick={() => onReact(post.id, e)}>
                {e}
              </button>
            ))}
        </div>
        <div className="seen">{seen.length ? `${seen.join("、")} 看过` : "还没人看过"}</div>
      </footer>
      {post.replies.length > 0 && (
        <div className="replies">
          {post.replies.map((r, i) => (
            <div key={i} className="reply">
              <b>{r.by === "me" ? state.bible.name : friendOf(state, r.by).name}</b> {r.byTwin ? <Badge kind="twin" /> : <Badge kind="me" />} {r.text}
            </div>
          ))}
        </div>
      )}
      {!mine && (
        <div className="reply-box">
          {open ? (
            <>
              <input autoFocus placeholder="以你本人的身份回一句…" value={reply} onChange={(e) => setReply(e.target.value)} onKeyDown={(e) => e.key === "Enter" && reply.trim() && (onReply(post.id, reply.trim()), setReply(""), setOpen(false))} />
              <button className="primary small" disabled={!reply.trim()} onClick={() => (onReply(post.id, reply.trim()), setReply(""), setOpen(false))}>
                发
              </button>
            </>
          ) : (
            <button className="link" onClick={() => setOpen(true)}>
              亲自回一句
            </button>
          )}
        </div>
      )}
    </article>
  );
}
