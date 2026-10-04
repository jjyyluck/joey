import "server-only";
import { db } from "./db";
import { aiEnabled, askJSON } from "./ai";
import type { AdaptMetrics } from "./adaptation-rules";

export async function storyMetrics(storyId: string): Promise<AdaptMetrics | null> {
  const s = await db.story.findUnique({ where: { id: storyId }, select: { publishedAt: true } });
  if (!s) return null;
  const [reads, finished, rating] = await Promise.all([
    db.readEvent.count({ where: { storyId } }),
    db.readEvent.count({ where: { storyId, finished: true } }),
    db.rating.aggregate({ where: { storyId }, _avg: { score: true }, _count: { _all: true } }),
  ]);
  return {
    reads,
    completion: reads ? finished / reads : 0,
    votes: rating._count._all,
    rating: rating._avg.score ?? 0,
    daysLive: Math.floor((Date.now() - s.publishedAt.getTime()) / 86400_000),
  };
}

export type Assessment = {
  scores: { conflict: number; public: number; reversal: number; infoGap: number };
  total: number;
  scenes: string[];
  compliance: "none" | "spot" | "structural";
  complianceNotes: string;
  summary: string;
  source: "ai" | "none";
};

const FOUR = `四要素（每项 0–5 分）：
1. 冲突可见：冲突外化为动作和画面（掀桌、下跪、摔东西、拿出证据），不是内心独白或旁白交代。
2. 当众性：有第三方在场目击（婚礼、家宴、公司、学校），羞辱和打脸被人看见。
3. 反转落差：有身份、权力或关系的瞬间翻转，或完整的“憋屈→爆发”微循环。
4. 信息差：观众知道角色不知道的事（或反之），段落结束留下未揭晓的钩子。
合规定性：none（无问题）/ spot（点状问题，改完故事还在，如年龄上调、个别画面）/ structural（结构性问题，删掉故事就不成立）。`;

/** Scores a story's AI-comic potential with the team's four-element test. Never throws. */
export async function assess(paragraphs: string[], title: string): Promise<Assessment | null> {
  if (!aiEnabled()) return null;
  const text = paragraphs.join("\n");
  const sample = text.length > 16000 ? text.slice(0, 11000) + "\n……\n" + text.slice(-5000) : text;
  try {
    const r = await askJSON<Partial<Assessment> & { scores?: Partial<Assessment["scores"]> }>({
      maxTokens: 1200,
      system: `你是 AI 漫剧（解说漫）项目的选书编辑，用桥段测试判断一篇短篇能不能改编成竖屏漫剧。\n${FOUR}\n输出 JSON：{"scores":{"conflict":0-5,"public":0-5,"reversal":0-5,"infoGap":0-5},"scenes":[最多 3 个最适合做成画面的桥段，每个一句话],"compliance":"none|spot|structural","complianceNotes":"一句话","summary":"两句话结论：适不适合改编、最大的亮点和风险"}`,
      prompt: `标题：${title}\n正文：\n${sample}`,
    });
    const n = (v: unknown) => Math.max(0, Math.min(5, Math.round(Number(v) || 0)));
    const scores = { conflict: n(r.scores?.conflict), public: n(r.scores?.public), reversal: n(r.scores?.reversal), infoGap: n(r.scores?.infoGap) };
    return {
      scores,
      total: scores.conflict + scores.public + scores.reversal + scores.infoGap,
      scenes: (r.scenes ?? []).map(String).slice(0, 3),
      compliance: r.compliance === "spot" || r.compliance === "structural" ? r.compliance : "none",
      complianceNotes: String(r.complianceNotes ?? "").slice(0, 200),
      summary: String(r.summary ?? "").slice(0, 300),
      source: "ai",
    };
  } catch {
    return null;
  }
}
