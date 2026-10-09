# 匹配卡风格指南（MeChat Swipe Card）

> 样本：MeChat 16 张滑卡截图（14 个角色）+ iChat 1 张旧版卡。
> 用途：新角色上线前，按本指南产出**卡面插画需求 + 卡片文案**；AI 生成候选文案时把 §4 作为 prompt 约束。
> 与本项目的关系：滑卡是玩家见到角色的第 0 秒，卡面要和角色圣经里的 Hook line / Contrast / `heat_pace` 对齐（见 `docs/characters/*.md`）。

---

## 1. 卡片结构（从上到下）

```
┌──────────────────────────────┐
│          MeChat  ← 品牌字，粉 #F0457B，粗圆体    │
├──────────────────────────────┤
│  ╭────────────────────────╮  │
│  │   [徽章 右上角，可选]   │  │  ✦ Exclusive（紫→橙渐变）/ ♛ Early Access（金）
│  │                        │  │
│  │   角色立绘（满版出血）    │  │  约占卡片 70% 高
│  │   背景虚化              │  │
│  │                        │  │
│  │ ░░░ 底部黑色渐变 ░░░░░░ │  │  从 55% 处开始压黑，文字区全黑
│  │ Tokugawa Rinji          │  │  姓名：白色、粗体、≈34px、左对齐
│  │ ♈ Let's see what you… │  │  星座符号（粉）+ 一句话 tagline（白，≈17px）
│  │   (↺)   (✕)   (♥)      │  │  三个圆形按钮，描边色各异
│  ╰────────────────────────╯  │
├──────────────────────────────┤
│  💎  🏅  🃏  👑  💬         │  底部 Tab，当前页粉色
└──────────────────────────────┘
```

| 元素 | 规格 |
|---|---|
| 卡片 | 圆角 ≈ 24px，占满屏宽减 16px 边距，黑底 |
| 立绘 | 满版出血，人物头部贴近卡顶，**主体在上半区**，下半身被渐变和文字压住 |
| 渐变 | 底部黑色线性渐变，从人物胸口处开始，保证名字区域纯黑可读 |
| 姓名 | 全名（名 + 姓），白色粗体，一行 |
| tagline | 星座 glyph（粉色 `♈♌♋♑♎♐♉♊♍`）+ 空格 + 一句话；最多两行 |
| 按钮 | ↺ 回退（黄描边）· ✕ 跳过（红描边）· ♥ 喜欢（薄荷绿描边 + 薄荷绿心）；按钮在黑底上，不压住画。**回退只在有上一张卡时出现**（Hugo、Petra、Amelia、Charlez 卡都没有），两键时居中对称 |
| 多图进度条 | 卡顶一排白色分段细条（Chase、Hugo 卡），一段 = 一张图，点击切换；单图卡没有 |
| 徽章 | 右上角斜切标签：`✦ Exclusive`（紫橙渐变，整卡边框同色，品牌字变紫）；`♛ Early Access`（金，整卡金边）；带徽章的卡**没有回退按钮** |
| 多人卡 | 一张卡可以放 2–3 个人（Jordan Downes 卡：三人自拍构图），名字只写主角 |
| 星座入画 | 星座可以直接画进立绘：Petra（天蝎）胸口是蝎子纹身。可选，但做了很加分 |
| 非人角色 | 允许明显的非人特征（Nair：龙角、龙翼、脸颊鳞片、尖指甲；Skyler：恶魔角），但脸和身体比例仍是人，保证“能谈恋爱”的观感 |

**iChat 旧版差异**（Elena Demetrias 卡）：浅色主题、热度条 `🔥🔥🔥`（亮几个火代表尺度/推进速度，对应本项目 `heat_pace`）、右下 ⓘ 详情按钮、星座 glyph 用黄色方块 emoji 风格。热度条是值得保留的信息，MeChat 版没有。

---

## 2. 立绘风格

统一画风：**欧美漫 + 日系的混合半写实**。线条干净、赛璐璐分层上色 + 柔光，皮肤有高光，头发分大缕有光带。不是写实，也不是低龄二次元。

有两个变体并存：主线角色是描线赛璐璐（Rinji、Chase、Yuki 等）；Petra、Elena 是无描线的厚涂 / AI 生成风，更写实。同一张卡只能是一种，一个角色的所有图要同一种。若本项目走 AI 生图，Petra 这种厚涂风更容易保持一致。

| 维度 | 规则 |
|---|---|
| 构图 | 半身或胸像，3/4 侧脸，**必须看镜头**（唯一例外：Elena 侧望，旧版）。头部占卡宽 40–50% |
| 动作 | 每个人都有一个"手在做事"：拿写字板、整领带、捏眼镜、玩泡泡糖、掌心托起、扯衣领。手 = 性格 |
| 道具/标志物 | 每人一个一眼能记住的符号：背带 harness、玫瑰、乌鸦、恶魔角、毛领、驯鹿、草莓发卡、耳坠。**一卡一符号**，不堆 |
| 发色 | 允许非自然色（藏青、薰衣草灰、紫、粉白双色、淡蓝），同一卡只用一种主发色 |
| 眼睛 | 高饱和、有光点，常用紫/红/蓝灰等非常规色，是"非人/危险"的提示 |
| 服装 | 领口开、肩颈露，但不裸（Chase 裸上身是上限）。黑/红/粉/白为主，题材感靠配饰 |
| 背景 | 全部虚化（办公室、夜市灯笼、雪夜、天台、教室），只给氛围不给细节，和人物色调互补 |
| 表情 | 嘴角上扬的七种变体：挑眉坏笑 / 含笑 / 露齿 / 眯眼 / 单眼闭 / 咬唇 / 抿嘴。**没有一个是面无表情的** |
| 反差型 | 允许一个“邻家”角色破规则：Hugo（眼镜、雀斑、创可贴、灰 T、沙发）没有任何危险信号，靠亲切感立住。一个角色库里留一两个这种位子 |
| 光 | 人物比背景亮一档，边缘有轮廓光（rim light），眼睛和唇有专门高光 |

题材 → 视觉提示对照：

| 题材 | 视觉 |
|---|---|
| 黑帮 / 豪门 | 黑衬衫、harness、戒指、冷光办公室（Rinji） |
| 超自然 / 暗黑 | 乌鸦、眼罩、choker、紫眼、黑指甲、灰雾（Phobos、Gaston） |
| 奇幻 / 龙族 | 龙角、龙翼剪影、鳞片、额饰宝石、金色纹章、落日天空（Nair） |
| 校园 / 青春 | 头巾、发卡、校园光、多人自拍（Jordan、Skyler） |
| 街头 / 潮流 | 挂饰外套、银链、灯笼街（Yuki） |
| 夏日 / 运动 | 裸上身、腰包、泡泡糖、天台夕阳（Chase） |
| 节日限定 | 驯鹿、雪、红衬衫 + 背带（Charlez，圣诞 Exclusive）；绿衬衫 + 红唇 emoji（Hugo，圣帕特里克节） |
| 邻家 / 治愈 | 眼镜、创可贴、沙发、卫衣（Hugo） |

---

## 3. 姓名

- **全名两段**，名 + 姓，没有年龄、没有职业（和 Tinder 不同，刻意去掉现实信息）。
- 名字本身带题材暗示：`Tokugawa Rinji`（日式权贵）、`Phobos Blade`（神话 + 武器 = 暗黑）、`Charlez Frost`（冬季限定）、`Amelia Star`（明星）、`Chase Milligan`（名字直接玩双关）。
- 读音要短、硬：两到三个音节，重音在前。避免生僻拼写（`Charlez` 这种一个字母的变体是上限）。
- 中文团队产名字时的检查：北美玩家能不能一眼读出来？有没有和已有角色撞首字母？

样本：Tokugawa Rinji · Sebastian Martinez · Gaston Jarnis · Martin Diaz · Phobos Blade · Jordan Downes · Skyler Morrison · Yuki Nakano · Chase Milligan · Charlez Frost · Amelia Star · Hugo O'Brien · Petra Aveza · Nair Tiamat · Elena Demetrias

姓氏也在干活：`O'Brien` 配 “I'm Irish”，`Frost` 配雪景，`Star` 配 “I am a star”，`Tiamat`（巴比伦龙母神）配龙角。姓 + tagline + 道具三者里至少两个互相呼应。

---

## 4. Tagline 写法（核心）

格式：`{星座 glyph} {一句话}{可选 emoji}`

### 4.1 硬性规则

1. **第一人称，对"你"说话**。不是简介，是角色对玩家开的第一口。
2. **≤ 12 个英文单词**，一行最好，两行上限（Charlez、Nair 都是 14 词、折两行，是上限）。
3. 结尾三选一：`?`（邀请）/ `!`（宣言）/ `.`（陈述），可以接**一个** emoji（😈 😜 😏 ❤ 😉），不能两个。
4. 必须暗示**关系会怎么开始**（挑衅、邀约、诱惑、威胁、撒娇），不描述外貌、不描述职业。
5. 不出现角色名以外的专有名词，不解释世界观。
6. 星座不是装饰：星座性格要和句子口吻一致（白羊=挑战、狮子=自负、巨蟹=情感诱惑、摩羯=掌控/承诺、天秤=神秘优雅、射手=直率玩笑、金牛=慵懒、双子=双关、处女座=自恋反转）。

### 4.2 五种 hook 类型（样本归类）

| 类型 | 口吻 | 样本 |
|---|---|---|
| **挑战 / 邀约** | 把球踢给你，要求你证明自己 | ♈ Let's see what you can do and see if we can set the world on fire together!（Rinji）<br>♉ Up for a study break?（Skyler）<br>♓ Always on the run… think you can catch me? 👀（Elena） |
| **直球欲望** | 自信到越线，但用玩笑兜住 | ♌ Got everything I want in life except you in my bed. 😈（Sebastian）<br>♑ Already seen the best nudes, now send me love!（Martin）<br>♐ You like what you see? Me too ❤（Yuki） |
| **诱惑 / 承诺** | 我知道你想要什么 | ♋ I'll show you how beautiful sin feels.（Gaston）<br>♑ I know your greatest wish and I can fulfill it 😉（Charlez） |
| **威胁 / 神秘** | 极短、冷、全大写或留白 | ♎ B E  N O T  A F R A I D（Phobos，字母间距拉开） |
| **宣示所有权** | 我拥有一切，你也在其中 | ♐ Everything the sun hits belongs to me. Everything in the shadows… more so.（Nair，两句对仗，化用《狮子王》） |
| **玩笑 / 双关** | 用名字或反差制造一个笑点 | ♊ I don't chase, I am Chase 😏（Chase）<br>♐ Don't you mind sharing… food? 😜（Jordan，三人卡，"sharing"双关）<br>♍ Well as you see… I Am a Star（Amelia，自恋反转）<br>♐ Kiss Me, I'm Irish 💋（Hugo，借现成俚语，节日限定） |
| **自我标签** | 借别人的嘴给自己贴标签，让你来验证 | ♏ Your mom would call me a bad girl 😏（Petra） |

### 4.3 句子技巧清单

- **省略号制造停顿再反转**：`sharing… food?`、`as you see… I Am a Star`、`on the run… think you can catch me?`。前半句让人想歪，后半句收回或坐实。
- **名字入句**：`I am Chase`、`I Am a Star`。只在名字本身有词义时用。
- **先给再要**：`Already seen the best nudes, now send me love!` 结构 = 我已经 X，现在你 Y。
- **把"你"放在句尾**：`…except you in my bed`，`…fulfill it`。最后落在玩家身上。
- **借第三方视角**：`Your mom would call me…`。不自夸，让一个不在场的人来定义自己，玩家自然想反驳或验证。
- **两句对仗 + 第二句加码**：`Everything the sun hits… Everything in the shadows… more so.` 第一句立规则，第二句用省略号停一拍再翻倍。只给霸道 / 王者型用，且是字数上限。
- **化用玩家熟悉的台词**：Nair 化用《狮子王》“everything the light touches”，Hugo 化用节日俚语。改掉一两个词让它变成角色自己的话，不能原句照搬。
- **借现成短语**：`Kiss Me, I'm Irish` 是北美人人认识的节日 T 恤文案。节日 / 限定角色可以直接用一句玩家已经会背的话，零理解成本。
- **排版当语气**：全大写 + 字母间距 = 压迫感，只给暗黑/超自然角色用，一个角色库里最多一个。
- **emoji 选角色不选句子**：😈 给坏男人，😜 给阳光型，😏 给自恋 / 坏女孩型，😉 给承诺型，❤ 给直球型，💋 给节日 / 亲昵型，👀 给逃跑 / 猫鼠型。

### 4.4 禁区

- 不写 "Looking for…" / "I'm a…" / "Love to…"（真人交友软件腔，样本里一句都没有）。
- 不用形容自己外貌的词（hot、handsome）。画已经说了。
- 不出现任何现实世界联系方式、地名。
- 17+ 尺度内：`in my bed`、`nudes` 是上限，不能更露骨；不涉及未成年、不涉及强迫。

---

## 5. 产卡流程（新角色）

1. 从角色圣经取三样：**Hook line**（第一句台词）、**Contrast**（反差）、**heat_pace**。
2. 选 hook 类型（§4.2）：`heat_pace: fast` → 直球欲望或诱惑；`slow` → 挑战或玩笑；暗黑题材 → 威胁。
3. 按 §4.1 写 5 条候选，各不同类型，保留 ≤ 12 词的。
4. 定一个符号道具 + 一个手部动作 + 一种主发色，写进插画需求。
5. 卡面文案复核：读出声 3 秒内读完；去掉名字能不能猜出是谁的卡（能 = 过）。

### 5.1 AI 生成候选文案的 prompt 片段

```
Write 5 one-line dating-card taglines for {name}, a character in a 17+ interactive romance app.
Rules: first person, speaking to the player ("you"); max 12 words; end with ? ! or . and at most one emoji;
hint at how the relationship will start (challenge / desire / temptation / threat / joke), never describe looks or job;
match the voice of a {zodiac}; no "looking for", no real-world contact info; suggestive is fine, explicit is not.
Character hook: {hook_line}. Contrast: {contrast}. Pace: {heat_pace}.
Output as: {zodiac glyph} {line}
```

---

## 6. 应用：Rafe Castellano 的卡

| 字段 | 值 |
|---|---|
| 姓名 | Rafe Castellano |
| 星座 | ♏ 天蝎（占有欲、秘密、掌控，和 Soul/Dark side 一致） |
| 徽章 | 无（首发免费角色） |
| hook 类型 | 挑战 / 邀约（`heat_pace: fast` 但第一句是"任务"，用邀约更贴 Hook line） |
| tagline | **♏ I need a date in two hours. Don't ask questions. 😏** |
| 备选 | ♏ Smile at my father, don't drink what my brother hands you. Deal?<br>♏ Three months. That's how long we've been dating. Starting now.<br>♏ My family won't like you. That's the point.<br>♏ My father would call you a bad idea. 😏（自我标签型，参考 Petra） |
| 立绘需求 | 黑西装无领带、衬衫领口开两颗、胸口一条细链挂着 Blue Elena 的钥匙（符号；另可在手腕内侧加一个小蝎子纹身把星座画进去）；手部动作：单手把西装外套搭上肩；3/4 侧脸看镜头，挑眉不笑；背景：夜晚天台灯串虚化；发色深棕近黑，眼睛深棕带金高光；轮廓光暖金 |
