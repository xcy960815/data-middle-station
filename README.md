# 数据中台项目

这是一个基于 Nuxt 3 构建的数据中台项目，提供了数据可视化、分析和处理的功能。

## 技术栈

- **前端框架**: Nuxt 3
- **UI 框架**: Element Plus
- **状态管理**: Pinia
- **数据可视化**: ECharts
- **代码编辑器**: Monaco Editor
- **样式处理**: TailwindCSS + Less
- **数据库**: MySQL
- **实时通信**: Socket.IO
- **日志管理**: Winston

## 功能特性

- 分析页支持基于物理表或数据集配置查询、分组、值/指标、筛选和排序
- 支持表格、柱状图、折线图、饼图等可视化展示
- 看板支持拖拽分析组件、调整布局、保存历史版本，并可展示数据集来源的分析
- 数据源管理和单表数据集管理，支持字段语义配置、预览和版本记录
- 邮件报告和定时邮件任务，支持渲染分析图表快照
- 用户权限控制、请求日志和错误日志

## 环境要求

- Node.js >= 18.15.0
- pnpm >= 8.0.0 (推荐使用 pnpm 作为包管理器)

## 项目设置

1. 克隆项目

```bash
git clone [项目地址]
cd data-middle-station
```

2. 安装依赖

```bash
# 使用 pnpm（推荐）
pnpm install

# 或使用 npm
npm install

# 或使用 yarn
yarn install
```

3. 环境配置

项目使用两层环境变量：

- `env/.env.daily`、`env/.env.pre`、`env/.env.prod`：应用运行配置，供 `pnpm dev/build` 通过 `--dotenv` 读取。
- `.env.compose`：Docker Compose 部署配置，供 `docker compose --env-file .env.compose` 读取；Compose 会通过 `NUXT_SERVICE_*` 环境变量让应用直连内部 `redis`、`mysql-main`、`mysql-data` 服务。

这些本地环境文件不会提交到仓库，请始终从 `*.example` 模板复制后再填写真实值。

推荐从示例文件复制：

```bash
cp env/.env.daily.example env/.env.daily
cp env/.env.pre.example env/.env.pre
cp env/.env.prod.example env/.env.prod
cp .env.compose.example .env.compose
```

`env/.env.daily` 示例：

```env
NODE_ENV=daily
PORT=12581
# 应用标题
APP_NAME=数据分析平台
API_BASE=/api

# 数据库配置
SERVICE_DB_HOST=127.0.0.1
SERVICE_DB_PORT=3310
SERVICE_DB_USER=root
SERVICE_DB_PASSWORD=change_me
SERVICE_DB_NAME=data_middle_station
SERVICE_DB_TIMEZONE=+08:00
SERVICE_DB_DATE_STRINGS=true
SERVICE_DB_DECIMAL_NUMBERS=true

# Redis 配置
SERVICE_REDIS_HOST=127.0.0.1
SERVICE_REDIS_PORT=6383
SERVICE_REDIS_USERNAME=default
SERVICE_REDIS_PASSWORD=change_me
SERVICE_REDIS_DB=0
SERVICE_REDIS_BASE=dms-redis

# 日志配置
LOG_PATH=./logs
LOG_TIME_FORMAT=YYYY-MM-DD HH:mm:ss

# 认证和邮件
JWT_SECRET_KEY=replace_with_a_long_random_secret
JWT_EXPIRES_IN=24h
SMTP_HOST=smtp.example.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_REJECT_UNAUTHORIZED=true
SMTP_USER=your_email@example.com
SMTP_PASS=your_smtp_password
SMTP_FROM=your_email@example.com

# AI 错误分析
DEEPSEEK_API_KEY=
DEEPSEEK_API_URL=https://api.deepseek.com/chat/completions
DEEPSEEK_MODEL=deepseek-chat
```

## 开发

启动开发服务器：

```bash
# 使用 pnpm
pnpm run dev

# 或使用 npm
npm run dev

# 或使用 yarn
yarn dev
```

默认开发环境会读取 `env/.env.daily`，服务端口由该文件中的 `PORT` 控制。

## 构建和部署

构建生产版本：

```bash
# 使用 pnpm
pnpm run build

# 或使用 npm
npm run build

# 或使用 yarn
yarn build
```

如果通过 Docker Compose 部署，使用：

```bash
docker compose --env-file .env.compose -p dms-service -f docker-compose.yml up -d
```

Docker Compose 版本只对外暴露 Nuxt Web 端口，Redis 和两个 MySQL 服务仅在 `dms-network` 内部可访问。

预览生产构建：

```bash
# 使用 pnpm
pnpm run preview

# 或使用 npm
npm run preview

# 或使用 yarn
yarn preview
```

## 代码规范

项目使用以下工具确保代码质量：

- ESLint - 代码检查
- Prettier - 代码格式化
- Husky - Git hooks
- Commitlint - 提交信息规范
- Conventional Changelog - 自动生成更新日志

## 项目结构

```
data-middle-station/
├── .env.compose.example # Docker Compose 环境变量模板
├── assets/          # 静态资源
├── components/      # 组件
├── composables/     # 组合式函数
├── layouts/         # 布局组件
├── middleware/      # 中间件
├── pages/          # 页面
├── plugins/        # 插件
├── public/         # 公共资源
├── env/            # Nuxt 应用环境变量模板与本地配置
├── server/         # 服务端代码
├── stores/         # 状态管理
├── types/          # TypeScript 类型定义
└── utils/          # 工具函数
```

## 更多文档

- `docs/project-documentation.md` - 项目技术文档
- `docs/analyze-config-field-consolidation-review.md` - 分析配置字段收拢复盘与 Review 清单

## 版本管理

项目使用语义化版本控制，可以通过以下命令更新版本：

```bash
# 更新补丁版本
pnpm run version:patch

# 更新次要版本
pnpm run version:minor

# 更新主要版本
pnpm run version:major
```

## 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: add some amazing feature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 许可证

MIT License. 详见仓库根目录 `LICENSE` 文件。

## 联系方式

如有问题或建议，请通过 GitHub Issues 提交，或发送邮件至：xuchongyu668@gmail.com。
