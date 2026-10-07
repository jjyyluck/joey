// Canned behaviour so the whole flow can be demoed without API credentials (MOCK_AI=1).
// Decisions come from policy.ts (the same rules that guard the real model); only the wording is canned.

import type { AnswerRequest, AnswerResult, BriefRequest, ChatRequest, DraftRequest, Topic } from "../shared/types.js";
import { classifyTopic, maxAction } from "./policy.js";

function factFor(req: AnswerRequest, topic: Topic): string | undefined {
  return req.bible.privateFacts.find((f) => f.topic === topic)?.text;
}

function scheduleAnswer(req: AnswerRequest): string {
  const q = req.question;
  const sat = /周六|星期六|saturday/i.test(q);
  const sun = /周日|星期天|sunday/i.test(q);
  const items = req.bible.calendar.filter((c) => (sat ? c.when.startsWith("周六") : sun ? c.when.startsWith("周日") : true));
  if (sat && /下午|晚上|afternoon|evening/i.test(q)) {
    return "周六下午他没安排，上午在佘山爬山，下午三点以后人是空的。我先帮他记上，他看到会确认。";
  }
  if (sat) return `周六他上午爬山（${items[0]?.what ?? "佘山"}），下午和晚上都空。想约哪个时段？`;
  if (sun) return "周日他一天都没安排，不过他周末一般睡到中午，下午约比较稳。";
  return `这周他排了：${req.bible.calendar.map((c) => `${c.when} ${c.what}`).join("、")}。其他时间基本都空。`;
}

export function mockAnswer(req: AnswerRequest): AnswerResult {
  const topic = classifyTopic(req.question);
  const action = maxAction(req.friend, req.question, topic);
  const name = req.bible.name;

  if (action === "escalate") {
    return { action, topic, text: `这件事我不替${name}回。我现在就提醒他亲自来找你，很快。`, reason: `${req.friend.name}的消息涉及需要真人处理的内容，我已退出并通知你。` };
  }
  if (action === "defer") {
    const boundary = /(工资|薪|收入|借钱|借我)/.test(req.question);
    return {
      action,
      topic,
      text: boundary ? `这个他一向不聊，你也别问我，我真不知道 😄` : `这个我得让${name}自己跟你说。`,
      reason: boundary
        ? `${req.friend.name}问到了你的边界话题「${topic === "work" ? "薪资" : "借钱"}」，我没透露。`
        : `「${topicLabel(topic)}」不在${req.friend.name}（${req.friend.tier === "circle" ? "一般" : "亲近"}）的透露范围内，我没透露。`,
    };
  }

  let text: string;
  switch (topic) {
    case "schedule":
    case "weekend":
      text = scheduleAnswer(req);
      break;
    case "health":
    case "family":
      text = factFor(req, "health") ? `${factFor(req, "health")} 他没怎么跟人说，你问了他会挺高兴的。` : "家里都挺好的，没什么新鲜事。";
      break;
    case "mood":
      text = factFor(req, "mood") ? `${factFor(req, "mood")} 不过这种事他更想自己跟你讲，你直接问他吧。` : "状态还行，就是忙。";
      break;
    case "work":
      text = factFor(req, "work") ?? `还是在${req.bible.facts.work.replace(/^在/, "")}，最近在赶一个新项目，加班比较多。`;
      break;
    case "hobby":
      text = `最近就是爬山和火锅轮着来，老电影也没停。你要拉他去哪？`;
      break;
    default:
      text = `这个他没特别跟我说过，我就不瞎编了。你直接问他，或者我帮你留个话？`;
  }

  if (action === "draft") {
    return {
      action,
      topic,
      text,
      reason: `${req.friend.name}问了「${topicLabel(topic)}」，在范围内，但他的等级是 L${req.friend.level}，我把回复先留给你确认。`,
    };
  }
  return { action: "answer", topic, text, reason: `${req.friend.name}（L${req.friend.level}）问了「${topicLabel(topic)}」，在范围内，我已直接回复。` };
}

function topicLabel(topic: Topic): string {
  return (
    { family: "家庭", health: "健康", mood: "情绪", work: "工作", schedule: "行程", weekend: "周末计划", hobby: "兴趣", public: "公开动态" } as Record<Topic, string>
  )[topic];
}

export function mockDraft(req: DraftRequest): string {
  const m = req.material.trim();
  const short = m.length > 40 ? `${m.slice(0, 40)}…` : m;
  if (/爬山|佘山|hike/i.test(m)) return `佘山又去了一趟。腿是废的，脑子是清的。${req.hasPhoto ? "山顶这张，雾刚散。" : ""}`.trim();
  if (/火锅/.test(m)) return `火锅，第三周了。没有人能在这件事上说服我。${req.hasPhoto ? "锅底证据在此。" : ""}`.trim();
  if (/加班|项目|上线/.test(m)) return `项目上线，命还在。这周不接任何早起的饭局。`;
  if (/电影/.test(m)) return `又看了一遍老片子。好电影的问题是看完不想说话。`;
  return `${short}${req.hasPhoto ? " 📷" : ""}`;
}

export function mockBrief(req: BriefRequest): string {
  const name = req.bible.name;
  const posts = req.events.filter((e) => e.kind === "post");
  const questions = req.events.filter((e) => e.kind === "question");
  const pending = req.events.filter((e) => e.kind === "pending");
  const nudges = req.events.filter((e) => e.kind === "nudge");
  const lines = [`早，${name}。圈子里昨晚到现在的事，我捋了一下：`];
  if (posts.length) lines.push(...posts.map((p) => `· ${p.text}`));
  if (questions.length) lines.push("", "有人找你：", ...questions.map((q) => `· ${q.text}`));
  if (pending.length) lines.push("", "下面这些我没擅自回，等你一句话：", ...pending.map((q) => `· ${q.text}`));
  if (nudges.length) lines.push("", ...nudges.map((n) => `⚠️ ${n.text}`));
  lines.push("", "今天有什么要我记的，直接说。");
  return lines.join("\n");
}

export function mockChat(req: ChatRequest): string {
  const m = req.message;
  if (/你是谁|你是什么/.test(m)) return `我是你，只是不下线的那个。你授权我知道的事我才知道，你没确认的话我不替你说。`;
  if (/记得|记住/.test(m)) return `记下了。要不要顺手发成动态？你说一声我就起个草稿。`;
  if (/累|烦|难受/.test(m)) return `收到。今天圈子里的事我先替你接着，没什么非你不可的。想发泄就在这儿说，不会出去。`;
  if (/谁|什么事|发生/.test(m)) return `小雨搬回上海了，阿杰约周六打球，老周那条你得自己看。要我把哪件展开？`;
  return `(mock) 收到：「${m}」。设置 ANTHROPIC_API_KEY 并去掉 MOCK_AI，分身就会真的用你的口气说话。`;
}
