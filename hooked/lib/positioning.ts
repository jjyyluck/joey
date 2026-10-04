/**
 * The product's positioning, in one place so the app and ad copy say the same thing.
 * Readers: one sitting, hooked from the first line, every story edited.
 * Keep claims true: the licensed library's median read time is ~28 minutes, so we say "一次读完", not "十分钟".
 * Writers: a short story can become a paid AI comic adaptation.
 */
export const READER_PITCH = {
  tagline: "一个问题，一个故事，一次读完。",
  points: [
    ["短篇", "一篇一个完整故事，一次读完，不追连载"],
    ["钩子", "标题就是一个问题，第一句就进入冲突"],
    ["精编", "每篇都经过编辑审核，不是随手发的帖子"],
  ] as const,
};

export const WRITER_PITCH = {
  tagline: "写一个短篇，读者在等；写得好，改成 AI 漫剧，你拿分成。",
  steps: [
    ["选题", "挑一个读者在“坐等”的问题，或者上传写好的短篇"],
    ["上线", "编辑审核后上线，AI 帮你起标题、定付费点"],
    ["改编", "数据达标可申请 AI 漫剧改编，平台出制作费"],
    ["分成", "按漫剧净收入分成，每月结算"],
  ] as const,
};

export const META_DESCRIPTION = "提一个问题，读一个故事。每篇一次读完，都经过编辑审核；写得好的故事会被改编成 AI 漫剧。";
