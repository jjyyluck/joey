# MeChat AI · 可玩原型

用 AI 重做 MeChat 的第一个可玩版本：**固定剧情引入角色 → 好感 + 章节解锁 → AI 自由聊天**。
设计依据见 [`../docs/ai-story-chat-redesign.md`](../docs/ai-story-chat-redesign.md)，角色剧本见 [`../docs/characters/rafe-castellano.md`](../docs/characters/rafe-castellano.md)。

## 运行

```bash
cd app
npm install

# 不需要 API key，AI 回复为预设文本，用于走通完整流程
npm run dev:mock

# 接真实 Claude（需要 ANTHROPIC_API_KEY）
export ANTHROPIC_API_KEY=sk-ant-...
npm run dev
```

打开 http://localhost:5173 。生产模式：`npm run build && npm start`（端口 8787）。

| 环境变量 | 默认 | 说明 |
|---|---|---|
| `CHAT_MODEL` | `claude-opus-5-5` | 聊天与记忆提炼所用模型 |
| `CHAT_EFFORT` | `low` | 聊天推理强度；角色质量不够时调到 `medium` |
| `MOCK_AI` | 未设置 | 设为 `1` 时不调用 API |
| `PORT` | `8787` | 服务端端口 |

## 玩法流程

1. **滑卡匹配** Rafe → 他主动发第一条消息。
2. **第 1 章「Two Hours」**（脚本）：聊天 + 屋顶派对约会，选项影响好感，有 💎 付费选项。
3. **AI 试聊**：第 1 章结束后脚本开场 + 3 条免费 AI 回复，AI 在第 3 条自动收尾。
4. **次日主动消息**（D1 召回）：点「Skip to tomorrow」模拟第二天，AI 根据你的选择生成个性化推送。
5. **第 2 章「Blue Elena」**（脚本）：好感 ≥ 30 触发初吻分支；结尾拿到私人号码。
6. **解锁**：好感 ≥ 35 → AI 自由聊天（每日 15 条免费，超出 1💎/条）；不足 → 免费支线或付费补好感。
7. **自由聊天**：送礼（AI 会回应并记住）、好感达到 45 / 60 / 75 解锁秘密、好感 ≥ 50 且到第 2 天后触发第 3 章预告；🧠 面板查看"他记得的事"。

页面下方的 Prototype tools：加速文本、+50💎、+10 好感、重置。

## 结构

```
app/
  shared/types.ts            前后端共享类型（剧情状态、聊天请求、SSE 事件）
  server/
    index.ts                 Express：POST /api/chat（SSE 流式）、POST /api/memory（结构化输出提炼记忆）
    prompt.ts                提示词分层：角色圣经（可缓存）+ 剧情状态 + 当前模式指令
    characters/rafe.ts       Rafe 角色圣经、各章剧情摘要、秘密门槛
    safety.ts                危机表述的确定性兜底（988 求助热线）
    mock.ts                  MOCK_AI 预设回复
  src/
    content/rafe-story.ts    第 1、2 章 + 支线 + 礼物（数据驱动，可交给编剧维护）
    story/types.ts           剧情节点格式：msg / narr / scene / cg / choice / branch
    game.ts                  游戏状态、好感 / 秘密 / 额度规则、本地存档
    App.tsx                  剧情引擎 + 聊天界面
```

## AI 实现要点

- **记忆 = 剧情选择 + 聊天提炼**：每个选项带一句 `summary`，作为"他记得的剧情瞬间"注入提示词；自由聊天每 6 轮调用一次 `/api/memory`，用结构化输出合并成 ≤ 20 条长期事实（含玩家昵称）。
- **提示词缓存**：角色圣经放在第一个 system block 并打 `cache_control`；每次变化的状态放在其后，不破坏缓存前缀。缓存有最小长度门槛，圣经过短时不会命中——角色圣经扩写后用 `usage.cache_read_input_tokens` 确认。
- **拒答兜底**：开启服务端 `fallbacks: "default"`；流中途换模型时前端丢弃半截文本；整条链都拒答时返回一句角色内台词，不出戏。
- **安全**：17+ 边界、人设内拒绝、被认真询问时承认是 AI、未成年人停止恋爱内容，都写在角色圣经里；危机表述在服务端先行拦截，直接返回求助信息。

## 原型的边界（上线前要补）

- 状态存在浏览器 localStorage，由前端提交给服务端。生产环境必须改为服务端存储——好感、钻石、额度都不能信任客户端。
- 没有真实支付、账号、推送；CG 为占位卡片；语音 / 照片未实现。
- 内容审核只靠模型 + 关键词兜底，上线前需要接入独立的输入 / 输出审核。
- 还没有用真实 API 跑过（开发环境没有 API key）。已验证：类型检查、构建、mock 模式下从匹配到自由聊天的完整自动化走查。
