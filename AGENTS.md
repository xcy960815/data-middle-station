# Data Middle Station Agent Guide

本仓库的 `AGENTS.md` 用来给 AI 代理和开发者提供稳定的执行规则。目标不是重复 README，而是让后续代理在接手这个 Nuxt 3 全栈项目时，能先读对材料、按正确链路分析、只改必要范围，并用一致的方法完成验证与交付。

适用场景：

1. 新增或修改页面、组件、Store、Server API。
2. 排查分析页、邮件调度、数据库查询、鉴权或日志问题。
3. 调整 Docker / PM2 / 环境变量相关配置。
4. 编写项目文档、运维脚本或排障记录。

## Usage Goals

这份指南应帮助代理完成这些任务：

1. 快速判断需求属于前端页面、服务端接口、数据查询、调度任务还是部署运维。
2. 沿着 `pages/components -> stores/composables -> server/api -> service -> mapper -> sql` 的真实链路定位代码。
3. 识别当前改动是否会影响分析页、邮件发送、定时任务、登录鉴权或数据源查询。
4. 只修改与目标需求直接相关的文件，避免碰生成目录、备份目录和无关模块。
5. 在没有测试框架兜底的前提下，用 lint、构建、必要的手工验证补足信心。
6. 把可复用的结论写回 `docs/`，而不是只留在一次性对话里。

## Required Reading Order

开始任何实现或排障前，按下面顺序读取：

1. `README.md` — 先确认项目用途、环境变量分层、开发与部署入口。
2. `package.json` — 以实际 scripts 为准，不要只相信 README 中未必同步的命令。
3. `nuxt.config.ts` — 确认 SSR、runtimeConfig、Vite 分包、Nitro 路由缓存等全局约束。
4. 目标功能对应目录：
   - 页面需求先读 `pages/`、`layouts/`、`components/`
   - 状态问题先读 `stores/`
   - 服务端问题先读 `server/api/`、`server/service/`、`server/mapper/`
5. 通用服务端基础设施：
   - `server/plugins/mysql.ts`
   - `server/plugins/redis.ts`
   - `server/middleware/`
   - `server/utils/`
6. 相关专项文档：
   - `docs/project-documentation.md` — 总体架构说明
   - `docs/analyze-config-field-consolidation-review.md` — 分析配置字段收拢复盘与 Review 清单
7. 涉及数据库时，再读 `sql/` 下对应脚本和相关 mapper/service。

如果需求落在分析页，额外优先读：

1. `pages/analyze/index.vue`
2. `pages/analyze/useAnalyzeDataHandler.ts`
3. `stores/analyze.ts`
4. `stores/chart-config.ts`
5. `stores/columns.ts`、`stores/measures.ts`、`stores/filters.ts`、`stores/dimensions.ts`、`stores/orders.ts`
6. `server/api/getAnalyzeData.post.ts`
7. `server/service/analyzeService.ts`
8. `server/service/chartDataService.ts`
9. `server/mapper/analyzeMapper.ts`、`server/mapper/chartDataMapper.ts`

## Recommended Task Prompt

向代理提需求时，建议使用这种形式：

```md
参考 AGENTS.md，修改 xxx 功能。

要求：

- 先确认实际代码链路和影响范围
- 只改 xxx 相关文件
- 以 package.json 的 scripts 为准做校验
- 如果涉及页面交互，补充最小可行的手工验证说明
- 如果发现可复用规则，写回 docs/
```

如果用户只说“参考 AGENTS.md 修改 xxx”，代理也应先完成本文件要求的阅读顺序，再开始改代码。

## Directory Guide

### `pages/` 和 `components/`

前端页面与可复用组件。分析页是核心业务区，`pages/analyze/components/` 下有大量图表配置子组件。

### `stores/`

Pinia 状态分层较细。分析页状态拆在多个 store 中，不要把所有逻辑重新堆回单个页面组件。

### `composables/` 和 `utils/`

放前端请求、节流防抖、图表渲染等复用逻辑。涉及跨页面行为时优先考虑是否已有 composable。

### `server/api/`

Nuxt 服务端接口入口。负责参数接收、调用 service、返回统一响应，不应堆积大段 SQL 或复杂业务流程。

### `server/service/`

业务逻辑层。负责组合查询、流程编排、异常处理，是服务端行为的主要落点。

### `server/mapper/`

数据访问层。这里更接近 SQL 和数据库表结构。修改查询前先确认 mapper 与 service 的职责边界。

### `server/plugins/`

服务端插件，包括 MySQL、Redis、Socket.IO、错误日志、定时邮件轮转等初始化逻辑。这里的改动通常影响全局。

### `docs/`

架构说明、项目评审、调度规则、线上排障记录。新增长期有效的经验时，优先补文档。

### `scripts/`

部署和排障脚本，例如镜像构建、连通性检查、日志查看、数据库导出。改脚本前先确认目标环境是否仍在使用。

### `env/`、`.env.compose*`

环境变量模板与部署变量。只能基于模板、键名和读取方式做修改，不要在仓库里写入真实密钥。

### `sql/`

数据库初始化、导出或测试 SQL。涉及字段变更时，代码与 SQL 必须一起审视。

## Applicability

这份指南主要服务于当前数据中台项目，不是通用 Nuxt 模板。代理应优先遵守本仓库的实际约定：

1. 这是 Nuxt 3 SSR 项目，不是纯前端 SPA。
2. 前后端都在同一仓库，很多需求必须跨 `pages/` 和 `server/` 一起看。
3. 分析页是核心链路，性能、请求时序和配置一致性比“快速堆功能”更重要。
4. 邮件、调度、数据库和部署相关改动具有明显运维影响，不能只看单个文件。

## Maintenance Principles

1. 事实优先：以当前代码、`package.json`、`nuxt.config.ts`、`server/` 实现为准。
2. 范围优先：默认做最小必要改动，不顺手重构无关模块。
3. 链路优先：前端问题不要只看页面，服务端问题不要只看 API 文件。
4. 文档回写：排障结论、部署经验、专项规则应补到 `docs/`。
5. 不碰生成物：默认不要编辑 `.nuxt/`、`.output/`、`node_modules/`、`logs/`。
6. 精简优先：优化目标是减重复、降复杂度，不是滥建 `shared/` 或「看起来很通用」的抽象。只有 **2 个以上真实调用方** 才考虑抽取；**单点逻辑留在原文件**（例如 `analyzeQueryBuilder.ts` 的 SQL 映射与日期判断）。`shared/analyzeConfigFieldRules.ts` 只管分析配置字段规则对象，不接 SQL 构建细节。详见 `.cursor/rules/minimal-abstraction.mdc`。

## Execution Standard

对具体任务，不要上来直接改代码。最小执行顺序如下：

1. 先确认需求属于哪个功能域，以及最终用户可见行为是什么。
2. 找到真实入口文件，而不是只根据文件名猜。
3. 画出实际调用链：页面/组件、store、composable、API、service、mapper、SQL。
4. 识别约束：
   - 是否依赖 runtimeConfig
   - 是否依赖 MySQL / Redis / Socket.IO / 定时任务
   - 是否会影响 SSR、缓存、鉴权或构建体积
5. 确认改动范围后再实现。
6. 优先保持现有分层，不把 service 逻辑塞进 API，不把复杂副作用塞进页面模板。
7. 完成后做最小充分验证，并记录剩余风险。

## Validation Standard

本项目当前没有成体系的自动化测试，校验以这些方式为主：

1. `pnpm lint` 或 `pnpm lint:fix`
2. 必要时 `pnpm build`、`pnpm build:pre` 或 `pnpm build:prod`
3. 如果只改格式或局部文件，可补 `pnpm format:check`
4. 涉及页面交互时，至少说明手工验证路径
5. 涉及 API 时，至少验证入参、返回结构、异常分支
6. 涉及调度或邮件时，明确是否做了本地模拟、数据库任务验证或仅静态检查

如果 README、旧文档和实际 scripts 不一致，一律以 `package.json` 为准。

## Project Operations

### Development

- 默认开发命令：`pnpm dev`
- 多环境开发命令：`pnpm dev:pre`、`pnpm dev:prod`
- `--dotenv env/.env.*` 已写在 scripts 中，除非在排查环境加载问题，否则不要重复发明启动方式

### Build And Run

- daily: `pnpm build` + `pnpm start:daily`
- pre: `pnpm build:pre` + `pnpm start:pre`
- prod: `pnpm build:prod` + `pnpm start:prod`

### Deployment

项目同时支持 PM2 和 Docker Compose：

1. PM2 入口：`ecosystem.config.js`
2. Docker 入口：`docker-compose.yml`
3. 容器部署会把 Nuxt、Redis、`mysql-main`、`mysql-data` 放在 `dms-network` 内
4. 线上网络或 SMTP 问题要同时检查环境变量模板、Docker Compose 网络和服务端日志

### Database And Scheduler

1. 主业务数据和看板业务数据分属两个 MySQL 实例配置。
2. 高频调度需求不要直接改表结构或 cron 逻辑，要先确认现有任务表、service 和 scheduler 初始化链路。
3. 数据查询逻辑变更要同时检查 mapper、service、前端字段消费和 SQL 示例。

## Practical Rules

1. 修改分析页时，优先关注请求并发、中止控制、错误态和图表配置一致性。
2. 修改服务端查询时，优先关注 SQL 安全、分页/数据量、错误日志和返回结构兼容性。
3. 修改鉴权时，同时检查前端中间件、服务端中间件和 JWT 工具。
4. 修改运行配置时，同时检查 `README.md`、环境模板、`nuxt.config.ts`、`docker-compose.yml`、`ecosystem.config.js`。
5. 如果只是修一个局部 bug，不要顺手统一整个仓库风格或大面积移动文件。

## Delivery Standard

交付结果至少应包含：

1. 改了什么。
2. 为什么这么改。
3. 做了哪些验证。
4. 还有哪些未验证风险或依赖外部环境。

如果在实现过程中发现了仓库级规则、长期排障经验或新的执行约束，应同步补充到 `AGENTS.md` 或 `docs/` 对应文档中。
