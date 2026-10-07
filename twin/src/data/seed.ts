import type { Friend, SelfBible } from "../../shared/types";

/** Pre-filled so the onboarding takes a minute; every field is editable there. */
export const DEFAULT_BIBLE: SelfBible = {
  name: "小泽",
  voice: {
    tone: ["直接", "爱开玩笑", "句子短", "不用感叹号"],
    samples: ["腿是废的，脑子是清的。", "行，我来。几点。", "这事儿我不聊，换个话题。", "火锅，第三周了。"],
    neverSay: ["亲亲", "宝子", "哈哈哈哈哈"],
  },
  facts: { work: "在游戏公司做产品", city: "上海", routine: "工作日 7 点起，周末睡到中午" },
  likes: ["火锅", "爬山", "老电影"],
  dislikes: ["早起的饭局", "电话会议"],
  boundaries: { neverDiscuss: ["薪资", "家里的财务"], neverCommit: ["借钱", "超过 2 小时的活动"] },
  privateFacts: [
    { topic: "health", text: "爸爸上个月做了个小手术，恢复得不错，下周复查。" },
    { topic: "mood", text: "最近有点倦，在考虑要不要换个方向。" },
    { topic: "work", text: "手上的新项目月底上线，这两周加班多。" },
    { topic: "weekend", text: "周六上午固定去佘山爬山。" },
  ],
  calendar: [
    { when: "周三 19:00", what: "和妈妈吃饭", hours: 2 },
    { when: "周六 09:00", what: "佘山爬山", hours: 3 },
    { when: "周日", what: "没安排", hours: 0 },
  ],
};

export const FRIENDS: Friend[] = [
  { id: "xiaoyu", name: "小雨", emoji: "🌧️", relation: "发小，认识二十年", tier: "inner", level: 0 },
  { id: "ajie", name: "阿杰", emoji: "🏀", relation: "前同事，球友", tier: "close", level: 0 },
  { id: "lena", name: "Lena", emoji: "🏃", relation: "健身房认识的", tier: "circle", level: 0 },
  { id: "laozhou", name: "老周", emoji: "🍜", relation: "大学室友", tier: "close", level: 0 },
];

export type SeedPost = {
  id: string;
  authorId: string;
  text: string;
  time: string;
  seenBy: string[];
  bigNews?: boolean;
};

export const SEED_POSTS: SeedPost[] = [
  { id: "p-xiaoyu-1", authorId: "xiaoyu", text: "搬回上海了。箱子还没拆，先找到了楼下的面馆。下周一新工作报到。", time: "昨天 21:40", seenBy: ["ajie"] },
  { id: "p-ajie-1", authorId: "ajie", text: "周六下午三点，老地方球场。谁来。", time: "昨天 22:15", seenBy: ["xiaoyu", "laozhou"] },
  { id: "p-lena-1", authorId: "lena", text: "晨跑第 40 天。今天 8 公里，第一次没停。", time: "今天 07:02", seenBy: [] },
  { id: "p-laozhou-1", authorId: "laozhou", text: "我和她分开了。先不说了，大家别问。", time: "今天 01:12", seenBy: ["xiaoyu"], bigNews: true },
];

/** Friends message the twin overnight. These run through /api/twin/answer with the user's current settings. */
export const SEED_QUESTIONS: { friendId: string; question: string }[] = [
  { friendId: "xiaoyu", question: "你爸恢复得怎么样了？复查了吗" },
  { friendId: "ajie", question: "周六下午三点打球来不来？" },
  { friendId: "lena", question: "你最近是不是心情不太好？出什么事了吗" },
];

export const QUICK_QUESTIONS: Record<string, string[]> = {
  xiaoyu: ["你爸身体好点了吗", "你最近状态怎么样", "周日有空吗，想找你吃饭", "你工资涨了没"],
  ajie: ["周六下午三点打球来不来", "最近项目忙吗", "你最近是不是心情不好", "能借我两千周转一下吗"],
  lena: ["周末去爬山吗", "你最近怎么了，看你朋友圈没更新", "你在哪家公司上班", "周六几点有空"],
  laozhou: ["周日有空吗", "你最近忙什么", "你爸没事吧", "借我点钱行吗"],
};
