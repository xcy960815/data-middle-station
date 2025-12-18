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

- 数据可视化展示
- 实时数据更新
- 数据编辑和管理
- 用户权限控制
- 日志记录和监控
- 定时任务处理

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
   创建 `.env` 文件并配置必要的环境变量：

```env
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=your_database

# 其他配置
...
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

开发服务器将在 `http://localhost:3000` 启动。

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
├── assets/          # 静态资源
├── components/      # 组件
├── composables/     # 组合式函数
├── layouts/         # 布局组件
├── middleware/      # 中间件
├── pages/          # 页面
├── plugins/        # 插件
├── public/         # 公共资源
├── server/         # 服务端代码
├── stores/         # 状态管理
├── types/          # TypeScript 类型定义
└── utils/          # 工具函数
```

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

[添加许可证信息]

## 联系方式

[添加联系方式]
