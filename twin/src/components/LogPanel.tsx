import { LEVEL_LABEL, TIER_LABEL, TIER_TOPICS, TOPIC_LABEL, type Level, type Tier } from "../../shared/types";
import { friendOf, metrics, type LogEntry, type State } from "../state";

type Props = {
  state: State;
  onSetFriend: (friendId: string, patch: { tier?: Tier; level?: Level }) => void;
  onRetract: (logId: string) => void;
  onReset: () => void;
};

const LEVEL_HELP: Record<Level, string> = {
  0: "只出草稿，一切发出前要你确认。",
  1: "可以回表情、说「收到」「恭喜」这类低风险的话。",
  2: "可以根据日历和已授权的事实直接回答问题。",
  3: "可以主动发动态、约人、牵线。（Demo 未实现）",
};

/** Authorization per friend, the twin's full action log, and the metrics the proposal says matter. */
export function LogPanel({ state, onSetFriend, onRetract, onReset }: Props) {
  const m = metrics(state);
  return (
    <div className="panel">
      <section className="metrics">
        <div>
          <b>{m.twinActs}</b>
          <small>分身替你做的事</small>
        </div>
        <div>
          <b>{m.retractRate}%</b>
          <small>修正 / 撤回率</small>
        </div>
        <div>
          <b>{m.humanMoments}</b>
          <small>你亲自出面的次数</small>
        </div>
        <div>
          <b>{m.waitingHuman}</b>
          <small>「等真人」中</small>
        </div>
      </section>

      <h2>授权：谁能让分身做多少</h2>
      {state.friends.map((f) => (
        <div className="auth-row" key={f.id}>
          <div className="auth-head">
            <span className="avatar">{f.emoji}</span>
            <div className="who">
              <b>{f.name}</b>
              <small>{f.relation}</small>
            </div>
          </div>
          <div className="auth-ctl">
            <label>圈层</label>
            <div className="seg">
              {(["inner", "close", "circle"] as Tier[]).map((t) => (
                <button key={t} className={f.tier === t ? "on" : ""} onClick={() => onSetFriend(f.id, { tier: t })}>
                  {TIER_LABEL[t]}
                </button>
              ))}
            </div>
            <small className="scope">可聊：{TIER_TOPICS[f.tier].map((t) => TOPIC_LABEL[t]).join(" · ")}</small>
          </div>
          <div className="auth-ctl">
            <label>自主等级</label>
            <div className="seg">
              {([0, 1, 2, 3] as Level[]).map((l) => (
                <button key={l} className={f.level === l ? "on" : ""} disabled={l === 3} onClick={() => onSetFriend(f.id, { level: l })}>
                  {LEVEL_LABEL[l].split(" ")[0]}
                </button>
              ))}
            </div>
            <small className="scope">{LEVEL_HELP[f.level]}</small>
          </div>
        </div>
      ))}

      <h2>分身日志</h2>
      <p className="hint">分身代表你做过的每一件事都在这里，能撤回的都能撤回。撤回时它会告诉对方那条是分身说的。</p>
      {state.log.length === 0 && <div className="empty">还没有记录。</div>}
      <ul className="log">
        {[...state.log].reverse().map((l) => (
          <LogRow key={l.id} entry={l} state={state} onRetract={onRetract} />
        ))}
      </ul>

      <h2>原型工具</h2>
      <div className="actions">
        <button className="ghost small danger" onClick={onReset}>
          重置 Demo
        </button>
      </div>
      <p className="hint">
        Demo 不接位置、相册、通讯录，也不做分身间串门。设置 ANTHROPIC_API_KEY 后，分身的措辞由模型生成；动作边界始终由服务端规则层决定。
      </p>
    </div>
  );
}

function LogRow({ entry, state, onRetract }: { entry: LogEntry; state: State; onRetract: (id: string) => void }) {
  const f = entry.friendId ? friendOf(state, entry.friendId) : null;
  return (
    <li className={`log-row ${entry.retracted ? "retracted" : ""} act-${entry.action}`}>
      <div className="log-main">
        <span className="time">{entry.time}</span>
        <span className={`tag tag-${entry.action}`}>{labelOf(entry.action)}</span>
        {entry.guarded && <span className="tag tag-guard">安全层</span>}
        {f && (
          <span className="log-friend">
            {f.emoji} {f.name}
          </span>
        )}
      </div>
      <div className="log-detail">{entry.detail}</div>
      {entry.retractable && !entry.retracted && (
        <button className="link danger" onClick={() => onRetract(entry.id)}>
          撤回
        </button>
      )}
      {entry.retracted && <small>已撤回</small>}
    </li>
  );
}

function labelOf(a: LogEntry["action"]): string {
  return (
    {
      answer: "代答",
      draft: "留给你",
      defer: "未透露",
      escalate: "交给真人",
      post: "发动态",
      react: "回表情",
      exit: "退出",
    } as Record<LogEntry["action"], string>
  )[a];
}
