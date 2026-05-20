# remotion-ad-video-skill

[English](README.md)

给一个 URL，用 AI coding agent + Remotion 生成可编辑、可复现的广告视频工程。
不需要接入视频生成 AI。

本项目基于 [Remotion](https://github.com/remotion-dev/remotion)，也就是用
React 以代码方式创建视频的框架。

这个项目是一个通用的 agent skill 和工具包，适用于商品链接、应用商店链接、落地页或产品 brief。Agent 负责理解链接、规划广告创意、整理素材和生成 Remotion 工程；Remotion 负责用 React 代码稳定渲染视频。你不需要 Sora、Runway、Pika、Kling 或其他视频生成模型。

## 演示视频

https://github.com/user-attachments/assets/5dbe2ade-fe7f-419f-8349-d73045320cd2

https://github.com/user-attachments/assets/8e3605dc-f776-4f62-b763-f618f6d7f8d8

## 为什么做这个

很多 AI 视频工作流是把 prompt 发给视频模型，然后等待结果。这个 skill 走的是另一条路：

```text
URL -> 来源分类 -> ad-brief.json -> 素材 -> 分镜 -> Remotion 代码 -> 草稿视频
```

这样生成的结果是可编辑、可复用、可测试、可审计的。尤其适合广告场景，因为广告需要明确产品、CTA、卖点、尺寸、素材版权和可验证声明。

## 核心能力

- 从 URL 到广告视频工程，覆盖电商商品、移动游戏、社交/内容 App、SaaS/API 产品、本地服务和通用 App。
- 强制生成 `ad-brief.json`，在写分镜和代码前固定来源类型、创意路线、尺寸、音频模式、素材需求、假设和阻塞项。
- 根据链接类型生成预调研问题，确认目标用户、前 2 秒 hook、证明点、素材和声音方案。
- 草稿广告默认使用可听见的生成音效；只有你选择 silent-safe 时才默认静音。
- 创意 QA 会推动更夸张的广告排版：大字 hook、单一主视觉、强裁切和更低文字密度。
- 电商素材抓取有 fail-closed 规则：抓不到可信主图就停止，让用户提供图片，不做假的商品广告。
- Remotion 快速测试流程：先低分辨率 still，再 preview，再半尺寸 draft MP4，最后才 full-size final。
- 自带合成 URL demo，不使用第三方品牌素材，也不使用视频生成 AI。

## 目录结构

```text
skills/remotion-ad-video/
  SKILL.md                         通用 agent skill 入口
  agents/openai.yaml               可选 OpenAI/Codex 展示元数据
  references/                      工作流合同和行业玩法规则
  assets/remotion-template/        可复用 Remotion 模板
  scripts/build_asset_manifest.mjs skill 内部素材清单工具

scripts/
  classify-ad-source.mjs           URL 分类和 ad-brief 生成
  create-open-source-snapshot.mjs  白名单脱敏发布快照
  harvest-ecommerce-assets.mjs     电商商品图片抓取工具
  fast-ad-lab.mjs                  共享 Remotion 草稿渲染工具
  validate-skill.mjs               本地结构和工作流校验

examples/synthetic-url-ad/
  ad-brief.json                    安全的假 URL brief
  src/                             纯 CSS Remotion demo，无外部媒体
```

## 适用哪些 Agent

这个 skill 的核心是通用工作流，不绑定某一个 agent。

- Codex / OpenAI 兼容 skill loader 可以直接安装 `skills/remotion-ad-video/`。
- Claude Code、Cursor、Windsurf 或其他代码型 agent 可以把 `skills/remotion-ad-video/SKILL.md` 当作 playbook 使用，并调用 `scripts/` 里的 Node 工具。
- 确定性部分都是普通 Node 脚本和 Remotion 模板，不依赖某个 agent runtime。

## 环境要求

- Node.js 20+
- npm 或其他 Node 包管理器
- Chrome 或 Chromium，用于浏览器辅助的电商素材抓取
- Remotion 商业使用需要你自行确认 license
- 生产广告需要拥有可用素材、Logo、音乐、音效、旁白和广告声明的使用权

## 让 AI Agent 安装

你不需要手动安装。打开你的代码型 AI agent，让它帮你安装。

复制这段话给 agent：

```text
请把这个仓库里的 remotion-ad-video skill 安装到我当前 agent 可用的 skills 目录。
如果支持软链接就用软链接；否则复制 skills/remotion-ad-video。
安装完成后告诉我如何 reload 或重启 agent，让 skill 生效。
```

对于 Codex/OpenAI 兼容的 agent，agent 应该把
`skills/remotion-ad-video/` 安装到本地 skills 目录，然后提示你刷新 skill 列表。

## 快速开始

在你的 AI agent 里直接使用。给 agent 一个商品、App 或落地页 URL，让它生成广告视频工程：

```text
调用 remotion-ad-video skill，为这个产品生成一个 15 秒广告视频：
https://example.com/products/focus-lamp
```

如果你的 agent 支持 OpenAI/Codex 风格的 skill 触发，也可以写：

```text
Use $remotion-ad-video to create a 15s vertical ad video for:
https://example.com/products/focus-lamp
```

Agent 应该完成：

1. 识别 URL 类型并创建 `ad-brief.json`。
2. 默认先询问和链接匹配的创意预调研问题。
   如果 agent 支持可点选 UI，应优先用点选方式确认尺寸、创意方向和声音方案；
   如果不支持，就只用同样的三个选项文本提问，不要先抛出 1-6 长问题列表。
3. 抓取可用素材，或者在素材失败时让用户提供。
4. 提出广告创意方向，并选择最强的一版。
5. 创建或更新 Remotion 工程。
6. 先渲染低分辨率 still，再考虑 MP4。
7. 汇报素材版权、广告声明和产品信息缺口。

普通使用时，让 agent 去运行脚本、创建 Remotion 工程、渲染草稿即可。你不需要自己运行校验命令。

## 合成 URL Demo

仓库包含一个安全 demo：`examples/synthetic-url-ad/`。

它使用假商品 URL：

```text
https://example.com/products/focus-lamp
```

这个 demo 包含：

- `ad-brief.json`：由 URL 推断出的电商广告 brief。
- `storyboard.md`：15 秒广告分镜。
- `src/`：纯 CSS Remotion 广告视频代码。
- 不包含第三方品牌素材。
- 不包含视频生成 AI 产物。

让你的 agent 运行这个 demo：

```text
请使用 remotion-ad-video skill 跑一下 synthetic URL demo。
如需安装 examples/synthetic-url-ad 的本地依赖，请直接安装。
先渲染一张 still，确认画面没问题后，再渲染 demo 视频。
```

## 快速渲染流程

需要快速迭代时，让 agent 使用快速渲染流程。规则很简单：

1. 先渲染低分辨率 still。
2. 只有需要看动作节奏时，才渲染低分辨率 preview。
3. 普通 review 用半尺寸 draft MP4。
4. 只有你确认草稿后，才渲染 full-size。

复制这段话给 agent：

```text
请使用 Remotion 广告快速渲染流程：先渲染低分辨率 still；
stills 没问题后再渲染半尺寸 draft MP4。
在我确认草稿前，不要渲染 full-size 视频。
```

## 推荐 Agent Prompt

```text
Use $remotion-ad-video to turn this product or app link into a 15s ad.
Create ad-brief.json first, ask link-adapted creative preflight questions,
harvest usable assets, propose three concepts, implement the strongest one in
Remotion, render low-resolution stills before any MP4, and report rights or
asset gaps.
```

如果你想跳过问答跑最快默认流程，需要明确告诉 agent。此时可以使用推断默认值，但必须把默认值写进 `ad-brief.json`。

## 输出产物

一次正常广告生成通常会得到：

- `ad-brief.json`：来源类型、目标、CTA、创意路线、尺寸、音频模式、假设、未解决问题和阻塞项。
- `public/<brand>/`：用户批准或页面抓取到的素材。
- `src/default-props.json`：Remotion 场景、尺寸、CTA、素材、声明和音频配置。
- `examples/<ad>/out/draft/`：草稿 still。
- `examples/<ad>/out/`：可选 preview、draft MP4 和 final MP4。

## 安全和版权

- 本项目不授予任何第三方商品图、截图、Logo、音乐、声音、评论或商店素材的使用权。
- 不要渲染未验证数字声明、监管声明、客户数据、私有 URL、API key、token 或内部 payload。
- 如果电商抓取被阻止，或者主图不可信，必须停止并让用户提供商品图片。
- 如果承诺有声音，必须实际提供可听的、权利清晰的音频；否则标记为 silent draft。
- 商业使用 Remotion 时，请自行确认 Remotion license。

## 维护者校验和发布

下面这些命令是给维护者和贡献者用的，普通使用者不需要执行。

运行校验：

```bash
npm run validate
```

生成脱敏发布快照：

```bash
npm run snapshot
```

发布时建议使用 `dist/open-source-snapshot/`，不要直接上传工作目录。快照会排除 `.remotion/`、`node_modules/`、渲染输出、抓取素材、本地任务记录、env 文件和未审核示例。

## 维护者发布清单

这个清单只给准备公开发布的维护者使用，普通用户不需要执行。

- 使用脱敏快照，不要上传整个工作目录：

```bash
node scripts/create-open-source-snapshot.mjs
```

- 发布前确认 `LICENSE` 存在。
- 不要发布 `node_modules`、Remotion `out`、缓存、草稿 MP4 或生成截图。
- 发布 `examples/*/public/` 前必须审核素材授权；默认 `.gitignore` 会排除这些目录。
- 不要发布本地 agent 任务记录，例如 `docs/tasks/` 或 `docs/PROGRESS.md`。
- 不要发布无授权第三方抓取素材。
- 替换示例或文档里的私有产品链接、客户名、token、本机绝对路径和一次性 ID。
- 只保留完全合成或明确有再分发授权的示例。
- 发布前运行维护者校验命令。
- 如果 API 和工作流还会变化，优先发布 pre-1.0 版本。

## 限制

- 这是 skill 和工作流包，不是托管渲染服务。
- 分类器是确定性启发式规则，生产前仍需要 agent 或人工确认上下文。
- 电商页面可能反爬。正确 fallback 是让用户提供图片，而不是编造商品视觉。
- 广告质量仍然取决于 brief、素材质量和迭代。

## 贡献

- 工作流变化时，更新或新增 reference 文件。
- 重复且脆弱的步骤优先做成确定性脚本。
- 提交前运行 `npm run validate`。
- 不要提交生成视频、依赖目录、密钥或无授权第三方素材。
