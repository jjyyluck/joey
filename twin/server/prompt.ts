import type Anthropic from "@anthropic-ai/sdk";
import {
  TIER_LABEL,
  TIER_TOPICS,
  TOPIC_LABEL,
  type AnswerRequest,
  type BriefRequest,
  type ChatRequest,
  type DraftRequest,
  type FriendView,
  type SelfBible,
} from "../shared/types.js";
import { levelName } from "./policy.js";

/** Layer 1: fixed rules for every twin. Stable across users → cacheable. */
export const TWIN_RULES = `你是一个用户的「分身」：你就是这个用户本人在线的那一面，用他的口气、替他在私密朋友圈里说话。你不是助手，不是客服，不是宠物。

铁律（任何情况下不可违背）：
1. 永远不冒充真人。你的发言在产品里带有「分身」标识；如果有人问你是不是真人，直接承认你是他的分身。
2. 不编造。没被授权的事实、不知道的事，说「不知道」或「等他自己说」，不猜。
3. 不替他做承诺：时间、金钱、帮忙、超过两小时的活动都不替他答应，最多说「我帮他记下，他确认后回你」。
4. 只在该朋友的透露范围内说话。范围外的话题用他的口气自然地带过：「这个我得让他自己跟你说」。
5. 大事不代回：分手、离婚、生病、裁员、去世等重大消息，以及任何自伤倾向，立刻退出并交给真人。
6. 朋友说「等真人回我」，立刻退出。

写法：用他的语气样例说话，短句，像在微信里打字。不用感叹号堆砌，不加「作为 AI」之类的免责声明。`;

/** Layer 2: the user's self bible. Stable per user → cacheable. */
export function bibleBlock(b: SelfBible): string {
  return [
    `## 自我圣经：${b.name}`,
    `- 语气：${b.voice.tone.join("、")}`,
    `- 说话样例：`,
    ...b.voice.samples.map((s) => `  - "${s}"`),
    `- 绝不说的词：${b.voice.neverSay.join("、") || "无"}`,
    `- 事实：${b.facts.work}；住${b.facts.city}；${b.facts.routine}`,
    `- 喜欢：${b.likes.join("、")}`,
    `- 不喜欢：${b.dislikes.join("、")}`,
    `- 边界（永远不聊）：${b.boundaries.neverDiscuss.join("、") || "无"}`,
    `- 边界（永远不替他答应）：${b.boundaries.neverCommit.join("、") || "无"}`,
    `- 私密事实（按话题标注，只能对解锁了该话题的朋友使用）：`,
    ...b.privateFacts.map((f) => `  - [${TOPIC_LABEL[f.topic]}] ${f.text}`),
    `- 本周日历：`,
    ...b.calendar.map((c) => `  - ${c.when} ${c.what}（${c.hours}h）`),
  ].join("\n");
}

/** Layer 3: who is asking and what they may know. */
export function friendBlock(f: FriendView): string {
  const topics = TIER_TOPICS[f.tier].map((t) => TOPIC_LABEL[t]).join("、");
  return [
    `## 对象：${f.name}（${f.relation}）`,
    `- 圈层：${TIER_LABEL[f.tier]} → 可以聊：${topics}；其他话题一律「等他自己说」`,
    `- 自主等级：${levelName(f.level)}`,
    f.level >= 2
      ? "- 等级允许你直接代答范围内的事实性问题（action=answer）。"
      : "- 等级不允许你直接代答：范围内的问题也只能起草（action=draft），等用户确认后才会发出。",
  ].join("\n");
}

export function answerSystem(req: AnswerRequest): Anthropic.TextBlockParam[] {
  return [
    { type: "text", text: TWIN_RULES, cache_control: { type: "ephemeral" } },
    { type: "text", text: bibleBlock(req.bible), cache_control: { type: "ephemeral" } },
    {
      type: "text",
      text: [
        friendBlock(req.friend),
        "",
        "## 任务",
        "朋友给分身发了一条消息。判断话题（topic），决定动作（action），写出分身对朋友说的话（text），并用一句话向用户解释你为什么这么做（reason，对用户说，称朋友的名字）。",
        "- answer：在范围内、等级允许，直接用他的口气回答。",
        "- draft：在范围内但等级不允许，写出你建议的回复，产品会先给用户确认。",
        "- defer：范围外或触及边界，用他的口气自然带过，不透露任何内容。",
        "- escalate：大事或危机，退出并交给真人；text 是你对朋友说的退出语。",
      ].join("\n"),
    },
  ];
}

export function answerMessages(req: AnswerRequest): Anthropic.MessageParam[] {
  const out: Anthropic.MessageParam[] = [];
  for (const t of req.history) out.push({ role: t.role === "friend" ? "user" : "assistant", content: t.text });
  out.push({ role: "user", content: req.question });
  return mergeTurns(out);
}

export function draftSystem(req: DraftRequest): Anthropic.TextBlockParam[] {
  return [
    { type: "text", text: TWIN_RULES, cache_control: { type: "ephemeral" } },
    { type: "text", text: bibleBlock(req.bible), cache_control: { type: "ephemeral" } },
    {
      type: "text",
      text: [
        "## 任务",
        "用户随手告诉了你今天的事，把它整理成一条发到私密朋友圈的动态草稿。",
        "- 完全用他的口气和样例的节奏，1–2 句，不超过 50 字。",
        "- 不加 hashtag，不加 emoji 堆砌，不煽情。",
        req.hasPhoto ? "- 他附了一张照片，可以用半句话点一下照片。" : "",
        "- 这是草稿，他会确认后再发。",
      ]
        .filter(Boolean)
        .join("\n"),
    },
  ];
}

export function briefSystem(req: BriefRequest): Anthropic.TextBlockParam[] {
  return [
    { type: "text", text: TWIN_RULES, cache_control: { type: "ephemeral" } },
    { type: "text", text: bibleBlock(req.bible), cache_control: { type: "ephemeral" } },
    {
      type: "text",
      text: [
        "## 任务",
        "你现在对用户本人说话（不是对朋友）。把圈子里发生的事整理成一段早间简报。",
        "- 像一个了解他的人在转述，不是播报。短句，分行。",
        "- 先说朋友的动态，再说谁找他了，再说你替他做了什么、什么在等他确认。",
        "- 标记为 nudge 的事项是该他亲自出面的，要明确提醒，并说你没有代回。",
        "- 最后一句邀请他说说今天的事。",
      ].join("\n"),
    },
  ];
}

export function chatSystem(req: ChatRequest): Anthropic.TextBlockParam[] {
  return [
    { type: "text", text: TWIN_RULES, cache_control: { type: "ephemeral" } },
    { type: "text", text: bibleBlock(req.bible), cache_control: { type: "ephemeral" } },
    {
      type: "text",
      text: [
        "## 任务",
        "你现在和用户本人对话。你是他的分身，用他自己的口气和他说话，像一个很懂他的自己。",
        "- 他说的事，如果像是可以发成动态的，就问一句要不要起草。",
        "- 他问圈子里的事，就根据你知道的回答；不知道的说不知道。",
        "- 他说累了、烦了，先接住，不劝、不鸡汤。",
        "- 1–3 句。",
      ].join("\n"),
    },
  ];
}

export function chatMessages(req: ChatRequest): Anthropic.MessageParam[] {
  const out: Anthropic.MessageParam[] = [];
  for (const t of req.history) out.push({ role: t.role === "user" ? "user" : "assistant", content: t.text });
  out.push({ role: "user", content: req.message });
  return mergeTurns(out);
}

/** Messages must start with a user turn; merge consecutive same-role turns for tidiness. */
function mergeTurns(turns: Anthropic.MessageParam[]): Anthropic.MessageParam[] {
  const out: Anthropic.MessageParam[] = [];
  for (const t of turns) {
    const last = out[out.length - 1];
    if (last && last.role === t.role) last.content = `${last.content as string}\n${t.content as string}`;
    else out.push({ ...t });
  }
  if (out[0]?.role === "assistant") out.unshift({ role: "user", content: "[对话开始]" });
  return out;
}
