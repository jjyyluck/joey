import { useState } from "react";
import { TIER_LABEL, type Friend, type SelfBible, type Tier } from "../../shared/types";

const TONE_OPTIONS = ["直接", "爱开玩笑", "句子短", "不用感叹号", "温和", "话多", "爱用比喻", "冷幽默"];
const DISCUSS_OPTIONS = ["薪资", "家里的财务", "感情状况", "健康细节", "政治"];
const COMMIT_OPTIONS = ["借钱", "超过 2 小时的活动", "周末早起", "帮忙搬家", "任何饭局"];

type Props = { bible: SelfBible; friends: Friend[]; onDone: (bible: SelfBible, friends: Friend[]) => void };

/** Three short steps that produce the self bible. Everything is pre-filled so a demo takes a minute. */
export function Onboarding({ bible: init, friends: initFriends, onDone }: Props) {
  const [step, setStep] = useState(0);
  const [b, setB] = useState<SelfBible>(init);
  const [friends, setFriends] = useState<Friend[]>(initFriends);

  const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  return (
    <div className="onboard">
      <div className="onboard-head">
        <div className="brand">
          <span className="dot" /> 分身
        </div>
        <div className="steps">
          {["你是谁", "边界", "圈子"].map((t, i) => (
            <span key={t} className={i === step ? "on" : i < step ? "done" : ""}>
              {t}
            </span>
          ))}
        </div>
      </div>

      {step === 0 && (
        <section className="onboard-body">
          <h1>先让分身认识你。</h1>
          <p className="lead">分身就是你本人不下线的那一面。它只知道你告诉它的，只说你允许它说的。</p>
          <label>
            叫你什么
            <input value={b.name} onChange={(e) => setB({ ...b, name: e.target.value })} />
          </label>
          <label>你说话的样子</label>
          <div className="chips">
            {TONE_OPTIONS.map((t) => (
              <button key={t} className={b.voice.tone.includes(t) ? "chip on" : "chip"} onClick={() => setB({ ...b, voice: { ...b.voice, tone: toggle(b.voice.tone, t) } })}>
                {t}
              </button>
            ))}
          </div>
          <label>
            几句你平时会说的话（分身学口气用，一行一句）
            <textarea
              rows={4}
              value={b.voice.samples.join("\n")}
              onChange={(e) => setB({ ...b, voice: { ...b.voice, samples: e.target.value.split("\n").filter(Boolean) } })}
            />
          </label>
          <label>
            你在做什么、住哪
            <input value={b.facts.work} onChange={(e) => setB({ ...b, facts: { ...b.facts, work: e.target.value } })} />
          </label>
        </section>
      )}

      {step === 1 && (
        <section className="onboard-body">
          <h1>分身永远不碰的事。</h1>
          <p className="lead">这是硬约束。不管谁问、不管哪一级授权，分身都不会越过这条线。</p>
          <label>永远不聊</label>
          <div className="chips">
            {DISCUSS_OPTIONS.map((t) => (
              <button key={t} className={b.boundaries.neverDiscuss.includes(t) ? "chip on" : "chip"} onClick={() => setB({ ...b, boundaries: { ...b.boundaries, neverDiscuss: toggle(b.boundaries.neverDiscuss, t) } })}>
                {t}
              </button>
            ))}
          </div>
          <label>永远不替你答应</label>
          <div className="chips">
            {COMMIT_OPTIONS.map((t) => (
              <button key={t} className={b.boundaries.neverCommit.includes(t) ? "chip on" : "chip"} onClick={() => setB({ ...b, boundaries: { ...b.boundaries, neverCommit: toggle(b.boundaries.neverCommit, t) } })}>
                {t}
              </button>
            ))}
          </div>
          <label>分身已经知道的私密事实（按话题分级，只对解锁该话题的圈层可见）</label>
          <ul className="facts">
            {b.privateFacts.map((f) => (
              <li key={f.text}>
                <span className="topic">{f.topic === "health" ? "健康" : f.topic === "mood" ? "情绪" : f.topic === "work" ? "工作" : "周末"}</span>
                {f.text}
              </li>
            ))}
          </ul>
        </section>
      )}

      {step === 2 && (
        <section className="onboard-body">
          <h1>谁能知道多少。</h1>
          <p className="lead">Path 对所有好友一视同仁。你不是。给每个人分个圈层，分身会记住对谁说到哪。</p>
          <div className="tier-legend">
            <div>
              <b>内圈</b> 家庭 · 健康 · 情绪 · 工作 · 行程 · 兴趣
            </div>
            <div>
              <b>亲近</b> 工作 · 行程 · 周末 · 兴趣
            </div>
            <div>
              <b>一般</b> 兴趣 · 公开动态
            </div>
          </div>
          {friends.map((f) => (
            <div className="friend-row" key={f.id}>
              <span className="avatar">{f.emoji}</span>
              <div className="who">
                <b>{f.name}</b>
                <small>{f.relation}</small>
              </div>
              <div className="seg">
                {(["inner", "close", "circle"] as Tier[]).map((t) => (
                  <button key={t} className={f.tier === t ? "on" : ""} onClick={() => setFriends(friends.map((x) => (x.id === f.id ? { ...x, tier: t } : x)))}>
                    {TIER_LABEL[t]}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <p className="hint">所有人的自主等级默认是 L0 记录：分身出草稿，一切发出前要你确认。之后在「日志 / 授权」里逐个放开。</p>
        </section>
      )}

      <footer className="onboard-foot">
        {step > 0 ? (
          <button className="ghost" onClick={() => setStep(step - 1)}>
            上一步
          </button>
        ) : (
          <span />
        )}
        {step < 2 ? (
          <button className="primary" onClick={() => setStep(step + 1)}>
            下一步
          </button>
        ) : (
          <button className="primary" onClick={() => onDone(b, friends)}>
            生成自我圣经，进入
          </button>
        )}
      </footer>
    </div>
  );
}
