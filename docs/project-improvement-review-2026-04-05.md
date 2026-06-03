# 项目改进评审记录（2026-04-05）

## 背景

本记录基于 2026-04-05 对当前仓库的一次静态审阅与基础命令验证，视角同时包含：

- 重度使用用户：关注首页效率、分析页操作心智、查询反馈、长期使用成本
- 项目开发者：关注安全、可维护性、构建稳定性、性能与后续演进空间

本次记录的目标不是一次性解决全部问题，而是把当前最值得推进的问题落地为可跟踪的清单。

## 本次检查范围

- 项目文档与脚本
- 首页与分析页核心交互
- 服务端查询与分析配置链路
- 构建、Lint、产物体积的基础健康状态

## 总结

当前项目已经具备完整的数据分析、图表渲染、邮件发送和调度能力，功能面并不弱，但如果按“要长期重度使用、并持续迭代”的标准来看，仍有四类问题需要尽快收口：

1. 安全与缓存边界不够稳
2. 工程健康状态不足以支撑高频迭代
3. 高使用频率下的产品体验还不够顺手
4. 首页与构建产物在数据量和功能量继续增长后会放大性能问题

## 优先级建议

### P0

- 收口动态图表查询链路中的 SQL 拼接风险
- 取消对全部 `/api/**` 的统一缓存头
- 修复 `pnpm lint` 和 `pnpm build` 当前暴露的问题，先恢复“可持续交付”

### P1

- 修正 `view_count` 的语义污染
- 首页列表接口瘦身并支持分页、搜索、排序
- 分析页加入请求并发保护、脏状态提示和更清晰的保存策略

### P2

- 优化首页信息架构
- 减少 `IconPark`、`Monaco` 等大体积依赖对首屏和构建的影响
- 补齐更系统的测试和文档索引

## 详细问题清单

### 1. 图表查询链路存在较高 SQL 注入风险

- 优先级：P0
- 影响面：安全、数据正确性、日志泄露风险
- 现象：
  当前图表数据查询由服务端动态拼接 `select`、`where`、`group by`、`order by`、`limit` 和 `dataSource`，其中自定义表达式、筛选值和排序表达式直接进入 SQL 字符串。
- 证据：
  - `server/service/chartDataService.ts`
  - `server/mapper/baseMapper.ts`
- 风险说明：
  项目本身支持自定义表达式，这意味着查询能力越强，风险窗口越大。当前实现不仅有 SQL 注入风险，还会把完整 SQL 记入日志，进一步放大敏感信息暴露面。
- 建议动作：
  - 为列名、表名、聚合函数建立白名单
  - 普通筛选值改为参数化查询
  - 自定义表达式单独做受限解析，不直接透传
  - 日志中默认脱敏或降低完整 SQL 输出粒度

### 2. `/api/**` 统一缓存策略过宽

- 优先级：P0
- 影响面：鉴权接口、写操作接口、数据一致性
- 现象：
  当前 `routeRules` 为全部 `/api/**` 设置了 `Cache-Control: s-maxage=300`。
- 证据：
  - `nuxt.config.ts`
- 风险说明：
  如果未来前面接入 CDN、边缘缓存或代理层，这种配置可能导致带身份态的接口被错误缓存，也可能让写操作后的数据展示延迟更新。
- 建议动作：
  - 仅对明确的公共只读 GET 接口配置缓存
  - 对带鉴权接口、POST/DELETE/更新类接口显式禁用缓存

### 3. 工程健康状态不足，Lint 与构建当前并不稳定

- 优先级：P0
- 影响面：交付稳定性、开发效率、回归风险
- 验证结果：
  - `pnpm lint` 失败，发现 132 个 error、33 个 warning
  - `pnpm build` 最终失败，Nitro 构建阶段报 KaTeX 相关模块加载错误
- 证据：
  - `utils/markdown.ts`
  - 多个页面、插件与类型定义文件存在 `no-undef`、空块、未使用变量等问题
- 风险说明：
  这意味着项目虽然“部分场景能跑”，但还没有达到可靠构建、可靠收敛的状态。后续任何功能迭代都更容易叠加隐患。
- 建议动作：
  - 先修复 `httpRequest`、`useChartDownload`、`CanvasTable`、`IndexDB`、`TableSticky` 等 `no-undef`
  - 修复 KaTeX 的服务端构建引用问题
  - 将 `lint` 和 `build` 纳入合并前必过检查

### 4. `view_count` 统计语义被污染

- 优先级：P1
- 影响面：运营数据、首页排序、用户认知
- 现象：
  获取分析详情时会直接执行访问次数自增，而编辑、创建后回读、删除前查询等非真实访问行为也会触发它。
- 证据：
  - `server/mapper/analyzeMapper.ts`
  - `pages/analyze/index.vue`
  - `server/service/analyzeService.ts`
- 风险说明：
  这会让首页展示的“访问次数”逐渐失真，越是高频维护和编辑的分析，越看不出真实使用热度。
- 建议动作：
  - 将“读取详情”和“记录访问”拆成两个接口或两个服务动作
  - 只在真实打开分析页面且完成展示时统计一次访问

### 5. 首页还不够像重度用户的工作台

- 优先级：P1
- 影响面：找分析、切换分析、日常效率
- 现象：
  当前首页主要以卡片平铺为主，缺少搜索、筛选、排序、最近访问、我创建的、收藏、标签、更新时间等高频能力。
- 证据：
  - `pages/analyze/index.vue`
  - `pages/analyze/components/analyze-card.vue`
- 风险说明：
  分析数量一旦上来，首页会从“直观”快速退化为“难找”。这类问题在早期不明显，但会随着沉淀的数据量迅速变痛。
- 建议动作：
  - 首页增加搜索框和基础筛选
  - 支持按最近访问、最近更新、访问次数排序
  - 卡片上展示更新时间、图表类型、简短描述
  - 后续考虑收藏、标签和分组视图

### 6. 首页列表接口返回过重，后续会拖慢首页

- 优先级：P1
- 影响面：首页性能、数据库负载、接口语义清晰度
- 现象：
  `getAnalyzes` 会为每个分析补完整 `chartConfig`，但首页卡片实际并未使用这部分数据。
- 证据：
  - `server/service/analyzeService.ts`
  - `server/api/getAnalyzes.post.ts`
  - `pages/analyze/index.vue`
- 风险说明：
  列表页加载了详情页才需要的字段，分析数量越多，首页越容易被不必要的数据拖慢。
- 建议动作：
  - 为首页单独定义轻量 DTO
  - 支持分页查询
  - 明确“列表接口”和“详情接口”的返回边界

### 7. 分析页保存心智不统一

- 优先级：P1
- 影响面：高频编辑体验
- 现象：
  图表配置保存需要额外确认弹窗，甚至 `Ctrl/Cmd+S` 也会弹确认；但分析名称和描述又是即时保存。
- 证据：
  - `pages/analyze/components/bar/index.vue`
  - `pages/analyze/components/chart-name/index.vue`
- 风险说明：
  对重度用户而言，这会形成混乱的心智模型：哪些改动是本地态，哪些会立刻生效，哪些需要确认，并不清晰。
- 建议动作：
  - 加入脏状态提示
  - 区分“自动保存草稿”和“手动保存正式版本”
  - 简化 `Ctrl/Cmd+S` 路径，减少重复确认

### 8. 分析查询缺少并发保护和结果时序控制

- 优先级：P1
- 影响面：图表正确性、交互反馈稳定性
- 现象：
  查询参数变化会触发防抖请求，但没有取消旧请求，也没有“仅接受最后一次响应”的保护。
- 证据：
  - `pages/analyze/useAnalyzeDataHandler.ts`
- 风险说明：
  在用户连续修改筛选条件、分组条件时，旧响应可能覆盖新响应，表现为图表偶发闪回或展示过期结果。
- 建议动作：
  - 为请求引入 request id 或 abort 机制
  - 只允许最后一次请求更新 store
  - 明确 loading、error、empty 状态切换逻辑

### 9. 构建产物体积偏大，首屏与交互成本会继续升高

- 优先级：P2
- 影响面：首屏、弱网体验、构建时间
- 现象：
  当前产物中 `icon-park`、`monaco-editor`、`echarts` 等 chunk 体积已经较大，其中 `IconPark` 在多个页面直接从 `@icon-park/vue-next/es/all` 整包引入。
- 证据：
  - `pages/analyze/index.vue`
  - `pages/analyze/components/analyze-card.vue`
  - `pages/analyze/components/measure/index.vue`
  - `nuxt.config.ts`
- 风险说明：
  这类问题不会立刻阻塞开发，但会不断推高首页、分析页和构建流程的成本。
- 建议动作：
  - 将图标改为按需引入
  - 进一步延迟加载 Monaco 相关能力
  - 继续拆分只在特定页面才需要的大依赖

### 10. 项目文档与实际状态存在脱节

- 优先级：P2
- 影响面：新同学接手、排障、环境搭建
- 现象：
  `README.md` 与 `docs/project-documentation.md` 能介绍项目，但还没有一份持续维护的“当前已知问题/改进计划”文档。
- 证据：
  - `README.md`
  - `docs/project-documentation.md`
- 建议动作：
  - 保持本文件持续更新
  - 未来将已处理项标记为完成，并记录对应 PR 或提交

## 推荐推进顺序

### 第一阶段

- 修复 SQL 动态拼接的高风险入口
- 收紧 API 缓存策略
- 清理构建和 Lint 阻塞项，让 CI 可用

### 第二阶段

- 重构首页列表接口
- 修正访问统计逻辑
- 给分析页请求与保存链路补状态管理

### 第三阶段

- 首页升级为工作台形态
- 系统性做包体积优化
- 补齐自动化测试与文档索引

## 类型契约收口记录（2026-05-31）

本轮已完成 Analyze / AnalyzeConfig、ScheduledEmail、Permission / UserInfo 的类型契约收口，核心目标是让数据库形态、接口入参、接口响应和服务层参数各自有明确边界，避免 `Options` 这类历史命名在不同层之间继续复用。

### 已完成范围

- Analyze / AnalyzeConfig：DTO 收口为 `Request` / `Payload`，VO 收口为 `Response` / `Item`，删除仅用于左手倒右手的透传别名。
- ScheduledEmail：任务创建、任务更新、列表查询、调度器消费对象统一为明确的请求、响应或任务类型。
- Permission / UserInfo：权限和用户信息响应类型从 `Options` 收口为 `Response`，权限更新入参收口为 `Request`。

### 后续迁移原则

- DAO 不再新增或保留 `Options` 命名；mapper 入参使用 `xxxParams` 或 `query`，数据库记录可按语义使用 `Record` / `Item` / `Entity`。
- DTO 只表达前端/API 入参，命名只使用 `Request` / `Payload`。
- VO 只表达接口响应，命名只使用 `Response` / `Item`。
- service 方法入参命名为 `xxxRequest`。
- mapper 方法入参命名为 `xxxParams` / `query`。
- `createdBy`、`updatedBy`、`createTime`、`updateTime` 等审计字段由 service 内部根据当前用户和服务端时间补齐，不从 controller 或前端透传。
- API handler 只负责读取/校验请求、调用 service、返回统一响应，不组装 DAO 审计参数。

### 后续待迁移模块

- Database
- SendEmail
- ScheduledEmailLog
- Login / UserInfo store 相关类型

## 后续维护方式建议

- 新增问题时，直接在本文件追加条目
- 已解决的问题，补充“解决时间 / 对应提交 / 影响范围”
- 如果后续问题越来越多，可以拆成：
  - `docs/roadmap.md`
  - `docs/known-issues.md`
  - `docs/performance-plan.md`

## 本次记录涉及的主要文件

- `server/service/chartDataService.ts`
- `server/mapper/baseMapper.ts`
- `server/mapper/analyzeMapper.ts`
- `server/service/analyzeService.ts`
- `pages/analyze/index.vue`
- `pages/analyze/components/analyze-card.vue`
- `pages/analyze/components/bar/index.vue`
- `pages/analyze/components/chart-name/index.vue`
- `pages/analyze/useAnalyzeDataHandler.ts`
- `nuxt.config.ts`
- `utils/markdown.ts`
