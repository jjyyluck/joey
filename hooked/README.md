# Hooked（有个故事）

故事问答平台：读者提问，作者用故事回答。这是可上线的第一版（Web，中文界面），覆盖核心闭环：

| 模块 | 功能 |
|---|---|
| 发现 | 单列信息流，问题在上、故事开头在下，按题材筛选 |
| 问题页 | 坐等（想看）、查看所有回答、“我来写” |
| 阅读 | 付费点之前公开；之后登录可读（付费上线前限时免费）。段评、1–10 分评分、阅读进度统计。底部操作栏：赞同、评论、收藏、分享 |
| 评论 | 全文评论（最热 / 最新）、回复（一层楼中楼）、评论点赞、删除自己的评论、举报；被回复和故事被评论时通知 |
| 相关推荐 | 同一问题的其他回答 → 同一作者 → 读过这篇的人还在读（近 30 天共同阅读）→ 同题材热门 → 全站热门；跳过已读完的故事 |
| 提问 | AI 把一句话改写成 3 个问法；发布前用相似度查重；提问者自动坐等 |
| 排行 | 日榜、周榜、编辑推荐、口碑榜（贝叶斯平均 + 读完率，有门槛） |
| 创作 | 按坐等人数排序的选题；上传作品（粘贴 / .txt / .md / .docx）→ AI 推荐标题、问题、付费点 → 查重 → 声明 → 提交审核 |
| 作者 | 阅读页显示作者头像、昵称、签名和关注按钮；点头像进入作者主页（阅读量、粉丝、关注数，作品按热度 / 最新排序，提问列表）；关注后作者发新故事会通知，发现页有“关注”信息流 |
| 我的 | 编辑昵称和签名、我的提问和坐等、书架、关注列表、投稿状态、通知 |
| AI 漫剧改编 | 作品达到标准（阅读、读完率、评分人数、平均分、上线天数，可用环境变量调整）或收到编辑邀请后，作者可申请；AI 按四要素（冲突可见、当众性、反转落差、信息差）和合规定性评估改编潜力；编辑审核 → 制作中 → 上线（填漫剧链接）；编辑按月录入净收入，作者按申请时锁定的比例分成（默认 20%），在“我的 → 漫剧”查看明细；读者在原作页看到漫剧入口 |
| 编辑后台 | 审核队列（通过 / 需要修改 / 不通过）、本周编辑推荐、举报处理、故事下架 |
| 合规 | 13 岁以上注册、用户协议 / 隐私政策 / DMCA 页面（草稿）、链接和联系方式过滤、频率限制 |

暂不包含：真实支付、经历 Agent、协作写作、标题工坊（见原型）。

## 技术栈

Next.js 16（App Router、Server Actions）· PostgreSQL 16（`pg_trgm` 做相似度）· Prisma 6 · Claude API（`@anthropic-ai/sdk`）· mammoth（读取 .docx）。

没有配置 `ANTHROPIC_API_KEY` 时，AI 功能会退回到规则建议，整站照常可用。

## 本地开发

```bash
cp .env.example .env            # 填 DATABASE_URL，可选 ANTHROPIC_API_KEY
npm install
npx prisma migrate deploy
ADMIN_EMAIL=you@company.com ADMIN_PASSWORD='至少12位的密码' SEED_DEMO=1 npm run db:seed
npm run import:library -- /path/to/lib   # 可选：导入授权故事库（index.json + c*.json）
npm run dev
```

> 修改表结构后运行 `npx prisma migrate dev --create-only --name 名称` 生成迁移，检查 SQL 后再 `npx prisma migrate deploy`。

## 测试

```bash
npm run typecheck
npm test                         # 单元测试：榜单公式、付费点、上传解析、时区、内容过滤
npm run build && npm start       # 另开终端：
node tests/e2e.mjs               # 端到端：注册→阅读→段评→打分→提问→上传→审核→通知→榜单→举报
```

端到端测试会注册多个账号，同一 IP 每小时最多注册 10 次；重复运行前可在测试库执行 `DELETE FROM "RateLimit";`。端到端测试需要先运行种子脚本（使用 `admin@hooked.test` / `admin-password-123` 作为编辑账号，并导入授权故事库），只在测试库上运行。

## 部署（单台服务器）

```bash
cp .env.example .env    # 必填：SITE_URL、ADMIN_EMAIL、ADMIN_PASSWORD、POSTGRES_PASSWORD；建议填 ANTHROPIC_API_KEY
docker compose up -d --build
docker compose run --rm -v /path/to/lib:/lib migrate npx tsx scripts/import-library.ts /lib   # 导入授权库
```

前面需要一层 HTTPS 反向代理（Nginx / Caddy / 云负载均衡），并把 `X-Forwarded-For` 传进来（用于登录和注册的频率限制）。健康检查：`GET /api/health`。

也可以部署到任何支持 Node 的平台（Vercel、Render、Fly.io、AWS），配好 `DATABASE_URL` 后先执行 `npx prisma migrate deploy` 再启动。

## 上线前清单

- [ ] 确认漫剧分成比例和申请门槛（`ADAPT_*` 环境变量），法务审核 `app/legal/adaptation` 并准备正式改编协议
- [ ] 法务审核 `app/legal/*` 三个页面，填好公司名和联系邮箱（环境变量）
- [ ] “Hooked” 商标冲突处理（美国已有同名阅读 App）
- [ ] 确认授权故事库的授权范围覆盖美国线上发布
- [ ] 配置 `ANTHROPIC_API_KEY`，用真实作品抽查 AI 分析质量
- [ ] 数据库每日备份
- [ ] 视情况配置 `MODERATION_BLOCKLIST`，安排编辑每天处理审核队列和举报
