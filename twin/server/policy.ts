// Deterministic policy layer. It runs before and after the model:
//  - classifies the friend's question into a topic (also used by mock mode),
//  - decides the maximum action the twin is allowed to take for this friend,
//  - downgrades anything the model tries beyond that ("guarded").
// The model writes the words; this file decides what the words may do.

import { TIER_TOPICS, type AnswerResult, type FriendView, type Level, type Topic, type TwinAction } from "../shared/types.js";

const TOPIC_PATTERNS: [Topic, RegExp][] = [
  ["family", /(爸|妈|父|母|家里|家人|老婆|老公|孩子|女儿|儿子|parents?|dad|mom|family)/i],
  ["health", /(身体|病|手术|恢复|住院|医院|体检|健康|sick|hospital|surgery|health)/i],
  ["mood", /(心情|难过|不开心|状态|压力|焦虑|怎么了|出什么事|还好吗|okay\?|upset|stress|mood)/i],
  ["work", /(工作|公司|项目|上班|加班|跳槽|换工作|老板|同事|工资|薪|年终|job|work|salary|boss)/i],
  ["weekend", /(周末|周六|周日|星期六|星期天|weekend|saturday|sunday)/i],
  ["schedule", /(有空|时间|几点|什么时候|在哪|约|来不来|能来|安排|free|when|where|available)/i],
  ["hobby", /(爬山|火锅|电影|跑步|健身|打球|篮球|游戏|吃|喝|hike|movie|run|gym|basketball)/i],
];

const BOUNDARY_PATTERNS: RegExp[] = [/(工资|薪|收入|赚多少|salary|income)/i, /(借钱|借我|转我|lend|borrow)/i];
const CRISIS = /(不想活|自杀|想死|自残|活不下去|kill myself|suicid|self[- ]?harm|want to die)/i;
const BIG_NEWS = /(分手|离婚|分开了|去世|走了|裁员|被裁|失业|住院|出事|确诊|破产|broke up|divorce|passed away|laid off|fired)/i;

export function classifyTopic(text: string): Topic {
  for (const [topic, re] of TOPIC_PATTERNS) if (re.test(text)) return topic;
  return "public";
}

export function isCrisis(text: string): boolean {
  return CRISIS.test(text);
}

export function isBigNews(text: string): boolean {
  return BIG_NEWS.test(text);
}

export function hitsBoundary(text: string): boolean {
  return BOUNDARY_PATTERNS.some((re) => re.test(text));
}

export function inScope(friend: FriendView, topic: Topic): boolean {
  return TIER_TOPICS[friend.tier].includes(topic);
}

/** The most autonomous action this friend's settings allow for this topic. */
export function maxAction(friend: FriendView, question: string, topic: Topic): TwinAction {
  if (isCrisis(question)) return "escalate";
  if (hitsBoundary(question)) return "defer";
  if (!inScope(friend, topic)) return "defer";
  return friend.level >= 2 ? "answer" : "draft";
}

const RANK: Record<TwinAction, number> = { escalate: 0, defer: 1, draft: 2, answer: 3 };

/** Clamp the model's decision to what policy allows. Never upgrades. */
export function guard(result: AnswerResult, friend: FriendView, question: string): AnswerResult {
  const allowed = maxAction(friend, question, result.topic);
  if (RANK[result.action] <= RANK[allowed]) return result;
  // The model wanted to say more than policy permits: fall back to the canned safe line.
  return { ...result, action: allowed, text: safeLine(allowed, friend), guarded: true, reason: `${result.reason}（安全层已降级为「${allowed}」）` };
}

export function safeLine(action: TwinAction, friend: FriendView, name = "他"): string {
  switch (action) {
    case "defer":
      return `这个我得让${name}自己跟你说。`;
    case "escalate":
      return `这件事我不替${name}回，我现在就提醒${name}亲自来找你。`;
    case "draft":
      return `我先帮你记下，${name}看到会确认后回你。`;
    case "answer":
      return `${friend.name}，这个我可以回：`;
  }
}

export function levelName(level: Level): string {
  return ["L0 记录", "L1 回应", "L2 代答", "L3 发起"][level];
}
