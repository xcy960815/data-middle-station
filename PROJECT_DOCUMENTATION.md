# 数据中台项目技术文档

## 项目概述

数据中台项目是一个基于 Nuxt 3 构建的现代化数据可视化和分析平台，旨在为企业提供统一的数据处理、分析和可视化服务。该项目采用全栈架构，结合了强大的前端展示能力和完整的后端数据处理服务。

### 版本信息

- **项目名称**: data-middle-station
- **版本**: 0.0.1
- **描述**: 使用 Nuxt3 + Element-Plus + Pinia + MySQL + PM2 搭建的数据中台

## 技术架构

### 核心技术栈

#### 前端技术

- **框架**: Nuxt 3.17.5 (基于 Vue 3)
- **UI框架**: Element Plus 2.11.1
- **状态管理**: Pinia 2.1.7
- **样式方案**: TailwindCSS 3.4.17 + Less 4.3.0
- **数据可视化**: ECharts 6.0.0
- **代码编辑器**: Monaco Editor 0.52.2
- **图标库**: @icon-park/vue-next 1.4.2
- **Canvas绘图**: Konva 9.3.22

#### 后端技术

- **运行时**: Node.js 20.19.0
- **框架**: Nuxt 3 服务端渲染
- **数据库**: MySQL 8.4.2
- **ORM/数据层**: 自定义 Mapper 模式
- **缓存**: Redis
- **进程管理**: PM2 6.0.6
- **实时通信**: Socket.IO 4.8.1
- **日志管理**: Winston 3.17.0
- **定时任务**: node-cron 3.0.3 + node-schedule 2.1.1
- **邮件服务**: Nodemailer 7.0.6

#### 开发工具

- **包管理器**: pnpm (推荐)
- **代码质量**: ESLint + Prettier
- **Git规范**: Husky + Commitlint
- **构建工具**: Vite (Nuxt 内置)
- **类型检查**: TypeScript

## 项目架构

### 目录结构

```
data-middle-station/
├── assets/                # 静态资源
│   └── styles/           # 样式文件
├── components/           # 可复用组件
│   ├── context-menu/     # 右键菜单组件
│   ├── custom-header/    # 自定义头部组件
│   ├── interval-chart/   # 柱状图组件
│   ├── line-chart/       # 折线图组件
│   ├── monaco-editor/    # 代码编辑器组件
│   ├── pie-chart/        # 饼图组件
│   ├── selecter/         # 选择器组件集
│   └── table-chart/      # 表格图表组件
├── composables/          # 组合式函数
├── layouts/              # 布局组件
├── middleware/           # 中间件
├── pages/                # 页面组件
│   ├── analyze/          # 数据分析页面
│   ├── dashboard/        # 仪表盘页面
│   ├── homepage/         # 首页
│   └── ...              # 其他功能页面
├── plugins/              # 插件
├── public/               # 公共静态资源
├── server/               # 服务端代码
│   ├── api/              # API 路由
│   ├── mapper/           # 数据访问层
│   ├── middleware/       # 服务端中间件
│   ├── plugins/          # 服务端插件
│   ├── service/          # 业务逻辑层
│   └── utils/            # 工具函数
├── stores/               # Pinia 状态管理
├── types/                # TypeScript 类型定义
└── utils/                # 工具函数
```

### 核心模块

#### 1. 数据分析模块 (`pages/analyze/`)

负责数据的查询、分析和可视化展示，是系统的核心功能模块。

**主要功能:**

- 数据源选择和字段配置
- 多维度数据分析
- 图表类型切换（表格、柱状图、折线图、饼图）
- 过滤条件和排序设置
- 实时数据更新和刷新

**核心组件:**

- `Column`: 字段选择器
- `Filter`: 过滤条件配置
- `Dimension`: 维度配置
- `Group`: 分组配置
- `Order`: 排序配置
- `Chart`: 图表渲染容器
- `ChartType`: 图表类型选择器

#### 2. 图表可视化组件

基于 ECharts 封装的图表组件库，支持多种图表类型。

**图表类型:**

- **表格图表** (`table-chart`): 高性能虚拟滚动表格
- **柱状图** (`interval-chart`): 支持分组、堆叠、百分比显示
- **折线图** (`line-chart`): 支持平滑曲线、数据点显示、双轴
- **饼图** (`pie-chart`): 支持标签显示、颜色配置

#### 3. 状态管理 (`stores/`)

使用 Pinia 进行全局状态管理，模块化设计。

**主要 Store:**

- `analyze`: 分析配置状态
- `chart-config`: 图表配置
- `columns`: 字段配置
- `dimensions`: 维度配置
- `filters`: 过滤条件
- `groups`: 分组配置
- `orders`: 排序配置
- `user`: 用户信息

#### 4. 服务端API (`server/api/`)

提供完整的数据服务接口。

**主要API:**

- `getAnalyzes`: 获取分析列表
- `getAnalyze`: 获取单个分析配置
- `createAnalyze`: 创建分析
- `updateAnalyze`: 更新分析
- `getAnalyzeData`: 获取图表数据
- `sendChartEmail`: 发送图表邮件
- `scheduledEmails`: 定时邮件管理

## 核心功能特性

### 1. 数据可视化

- **多图表类型**: 支持表格、柱状图、折线图、饼图等多种可视化方式
- **实时渲染**: 基于配置变化实时更新图表显示
- **交互式操作**: 支持图表缩放、平移、数据筛选等交互功能
- **自定义配置**: 提供丰富的样式和显示选项配置

### 2. 数据分析

- **多维度分析**: 支持多字段维度组合分析
- **动态过滤**: 实时过滤条件设置和数据筛选
- **聚合计算**: 支持求和、计数、平均值等聚合函数
- **排序功能**: 多字段自定义排序

### 3. 数据源管理

- **动态数据源**: 支持多表数据源切换
- **字段映射**: 自动识别数据库字段类型和注释
- **实时查询**: 基于条件动态生成SQL查询

### 4. 邮件报告系统

- **图表邮件**: 支持将图表作为附件或内容发送
- **定时任务**: 支持定时和周期性邮件发送
- **模板配置**: 可自定义邮件模板和内容

### 5. 权限和安全

- **JWT认证**: 基于Token的用户身份验证
- **请求日志**: 完整的API请求日志记录
- **错误处理**: 统一的错误处理和响应机制

## 数据库设计

### 主要数据表

#### 1. analyze (分析表)

存储数据分析的基本信息。

```sql
CREATE TABLE `analyze` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `analyze_name` varchar(255) DEFAULT NULL COMMENT '分析名称',
  `view_count` int unsigned DEFAULT '0' COMMENT '访问次数',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `created_by` varchar(100) DEFAULT NULL COMMENT '创建人',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `updated_by` varchar(100) DEFAULT NULL COMMENT '更新人',
  `chart_config_id` bigint DEFAULT NULL COMMENT '图表配置ID',
  `analyze_desc` varchar(255) DEFAULT NULL COMMENT '分析描述',
  `is_deleted` tinyint(1) DEFAULT '0' COMMENT '是否删除：0-未删除，1-已删除',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB COMMENT='图表信息表';
```

#### 2. chart_config (图表配置表)

存储图表的详细配置信息。

```sql
CREATE TABLE `chart_config` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `data_source` varchar(100) DEFAULT NULL COMMENT '数据源表名',
  `columns` json DEFAULT NULL COMMENT '列配置(JSON格式)',
  `dimensions` json DEFAULT NULL COMMENT '维度配置(JSON格式)',
  `filters` json DEFAULT NULL COMMENT '过滤条件(JSON格式)',
  `groups` json DEFAULT NULL COMMENT '分组配置(JSON格式)',
  `orders` json DEFAULT NULL COMMENT '排序配置(JSON格式)',
  `common_chart_config` json DEFAULT NULL COMMENT '公共图表配置(JSON格式)',
  `private_chart_config` json DEFAULT NULL COMMENT '图表配置(JSON格式)',
  `chart_type` varchar(50) DEFAULT NULL COMMENT '图标类型',
  `is_deleted` tinyint(1) DEFAULT '0' COMMENT '是否删除：0-未删除，1-已删除',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB COMMENT='图表配置表';
```

#### 3. scheduled_email_tasks (定时邮件任务表)

管理定时邮件发送任务。

```sql
CREATE TABLE `scheduled_email_tasks` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '任务ID',
  `task_name` varchar(255) NOT NULL COMMENT '任务名称',
  `schedule_time` datetime DEFAULT NULL COMMENT '计划执行时间',
  `task_type` enum('scheduled','recurring') NOT NULL DEFAULT 'scheduled' COMMENT '任务类型',
  `recurring_days` json DEFAULT NULL COMMENT '重复的星期几',
  `recurring_time` time DEFAULT NULL COMMENT '每日执行时间',
  `is_active` tinyint(1) NOT NULL DEFAULT '1' COMMENT '是否启用任务',
  `email_config` json NOT NULL COMMENT '邮件配置',
  `analyze_options` json NOT NULL COMMENT '图表数据',
  `status` enum('pending','running','completed','failed','cancelled') NOT NULL DEFAULT 'pending' COMMENT '任务状态',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB COMMENT='定时邮件任务表';
```

## 部署架构

### 环境配置

项目支持多环境部署：

#### 开发环境 (daily)

- 端口: 12581
- 用于日常开发和测试

#### 预发环境 (pre)

- 端口: 12582
- 用于预发布测试

#### 生产环境 (prod)

- 端口: 12583
- 生产环境部署

### PM2 配置

使用 PM2 进行进程管理，配置文件：`ecosystem.config.js`

```javascript
module.exports = {
  apps: [
    {
      name: 'DataMiddleStation',
      exec_mode: 'fork',
      instances: '1',
      script: '.output/server/index.mjs',
      autorestart: true,
      max_memory_restart: '1G',
      env_daily: {
        NODE_ENV: 'daily',
        PORT: '12581'
      },
      env_pre: {
        NODE_ENV: 'pre',
        PORT: '12582'
      },
      env_prod: {
        NODE_ENV: 'prod',
        PORT: '12583'
      }
    }
  ]
}
```

### Docker 支持

项目包含 Dockerfile 和 docker-compose 配置：

- `Dockerfile`: 应用容器化配置
- `dms-service-compose.yml`: 服务编排配置
- `dms-service-data-compose.yml`: 数据服务配置

### 多平台构建 (Multi-Platform Build)

项目支持构建多平台 Docker 镜像 (linux/amd64, linux/arm64)。

**前提条件:**

- 安装 Docker Desktop
- 启用 docker buildx

**使用方法:**

```bash
# 使用 npm script (推荐)
npm run docker:build:multi

# 或者直接运行脚本
./build-multi-arch.sh

# 构建并推送到仓库
./build-multi-arch.sh --push

# 指定标签和平台
./build-multi-arch.sh -t 1.0.0 -p linux/amd64
```

## 开发指南

### 快速开始

1. **环境准备**

   ```bash
   # 确保 Node.js >= 18.15.0
   node --version

   # 安装 pnpm
   npm install -g pnpm
   ```

2. **项目安装**

   ```bash
   # 克隆项目
   git clone [项目地址]
   cd data-middle-station

   # 安装依赖
   pnpm install
   ```

3. **环境配置**
   创建环境配置文件 `env/.env.daily`：

   ```env
   # 数据库配置
   SERVICE_DB_HOST=localhost
   SERVICE_DB_PORT=3306
   SERVICE_DB_USER=root
   SERVICE_DB_PASSWORD=password
   SERVICE_DB_NAME=data_middle_station

   # Redis配置
   SERVICE_REDIS_HOST=localhost
   SERVICE_REDIS_PORT=6379
   SERVICE_REDIS_PASSWORD=

   # JWT配置
   JWT_SECRET_KEY=your_secret_key
   JWT_EXPIRES_IN=7d

   # 邮件配置
   SMTP_HOST=smtp.example.com
   SMTP_PORT=587
   SMTP_USER=your_email@example.com
   SMTP_PASS=your_password
   ```

4. **数据库初始化**

   ```bash
   # 导入数据库结构
   mysql -u root -p data_middle_station < sql/data_middle_station.sql
   ```

5. **启动开发服务器**

   ```bash
   # 开发模式
   pnpm dev

   # 指定环境
   pnpm dev:pre   # 预发环境
   pnpm dev:prod  # 生产环境
   ```

### 构建部署

```bash
# 构建项目
pnpm build

# 启动生产服务器
pnpm start:prod

# 使用 PM2 管理
pnpm start:daily   # 启动日常环境
pnpm start:pre     # 启动预发环境
pnpm start:prod    # 启动生产环境

# 停止服务
pnpm stop

# 重启服务
pnpm restart:prod
```

### 代码规范

项目采用严格的代码规范：

```bash
# 代码检查
pnpm lint

# 代码格式化
pnpm format

# 修复 lint 问题
pnpm lint:fix
```

### 提交规范

使用 Conventional Commits 规范：

```bash
# 功能开发
git commit -m "feat: 添加新的图表类型支持"

# 修复问题
git commit -m "fix: 修复数据查询性能问题"

# 文档更新
git commit -m "docs: 更新API文档"
```

## API 文档

### 分析管理 API

#### 获取分析列表

```
POST /api/getAnalyzes
Content-Type: application/json

Response:
{
  "code": 200,
  "data": [
    {
      "id": 1,
      "analyzeName": "销售数据看板",
      "analyzeDesc": "销售数据看板的描述",
      "viewCount": 780,
      "createTime": "2025-05-30 02:19:10",
      "updatedBy": "system"
    }
  ],
  "message": "success"
}
```

#### 获取分析详情

```
POST /api/getAnalyze
Content-Type: application/json

{
  "analyzeId": 1
}

Response:
{
  "code": 200,
  "data": {
    "id": 1,
    "analyzeName": "销售数据看板",
    "chartConfig": {
      "chartType": "interval",
      "dataSource": "operationAnalysis",
      "dimensions": [...],
      "groups": [...],
      "filters": [...]
    }
  }
}
```

#### 创建分析

```
POST /api/createAnalyze
Content-Type: application/json

{
  "analyzeName": "新的分析",
  "analyzeDesc": "分析描述",
  "chartConfig": {
    "chartType": "table",
    "dataSource": "tableName",
    "dimensions": [],
    "groups": [],
    "filters": []
  }
}
```

### 数据查询 API

#### 获取图表数据

```
POST /api/getAnalyzeData
Content-Type: application/json

{
  "dataSource": "operationAnalysis",
  "dimensions": [
    {
      "columnName": "new_users",
      "columnType": "number",
      "displayName": "新增用户数"
    }
  ],
  "groups": [
    {
      "columnName": "region",
      "columnType": "string",
      "displayName": "地区"
    }
  ],
  "filters": [],
  "orders": [],
  "commonChartConfig": {
    "limit": 1000
  }
}

Response:
{
  "code": 200,
  "data": [
    {
      "region": "北京",
      "new_users": 1200
    },
    {
      "region": "上海",
      "new_users": 980
    }
  ]
}
```

### 邮件服务 API

#### 发送图表邮件

```
POST /api/sendChartEmail
Content-Type: application/json

{
  "emailConfig": {
    "to": "user@example.com",
    "subject": "数据分析报告",
    "additionalContent": "附加说明"
  },
  "analyzeOptions": {
    "analyzeId": 1,
    "chartType": "table",
    "analyzeName": "销售数据看板"
  }
}
```

## 性能优化

### 前端优化

1. **代码分割**
   - 按路由进行代码分割
   - 第三方库单独打包
   - 动态导入优化

2. **资源优化**
   - 图片压缩和格式优化
   - CSS/JS 压缩
   - 静态资源缓存

3. **渲染优化**
   - 虚拟滚动表格
   - 图表按需渲染
   - 组件懒加载

### 后端优化

1. **数据库优化**
   - 索引优化
   - 查询语句优化
   - 连接池配置

2. **缓存策略**
   - Redis 缓存热点数据
   - API 响应缓存
   - 静态资源缓存

3. **服务优化**
   - PM2 进程管理
   - 内存使用优化
   - 日志轮转

## 监控和日志

### 日志系统

使用 Winston 进行日志管理：

- **错误日志**: `logs/pm2/error.log`
- **启动日志**: `logs/pm2/startup.log`
- **API请求日志**: 记录所有API请求信息
- **系统日志**: 系统运行状态和异常信息

### 监控指标

- **应用性能**: 响应时间、吞吐量
- **资源使用**: CPU、内存使用率
- **数据库性能**: 查询耗时、连接数
- **错误率**: API错误率、系统异常

## 安全措施

### 认证授权

- JWT Token 认证
- 用户权限控制
- API 访问限制

### 数据安全

- SQL 注入防护
- XSS 攻击防护
- CSRF 保护
- 数据传输加密

### 系统安全

- 环境变量配置
- 敏感信息加密
- 访问日志记录

## 常见问题

### 开发问题

**Q: 如何添加新的图表类型？**
A:

1. 在 `components/` 下创建新的图表组件
2. 在 `composables/useChartRender.ts` 中添加渲染逻辑
3. 更新图表类型映射和配置

**Q: 如何添加新的数据源？**
A:

1. 确保数据库中存在对应表
2. 在 `server/api/getDatabaseTables.ts` 中添加表查询逻辑
3. 配置字段映射关系

**Q: 如何自定义图表样式？**
A:

1. 修改 `stores/chart-config.ts` 中的配置选项
2. 在对应图表组件中添加样式处理逻辑
3. 更新 TypeScript 类型定义

### 部署问题

**Q: PM2 启动失败怎么办？**
A:

1. 检查 Node.js 版本是否满足要求
2. 确认构建产物存在：`.output/server/index.mjs`
3. 检查端口是否被占用
4. 查看 PM2 错误日志

**Q: 数据库连接失败？**
A:

1. 检查数据库配置是否正确
2. 确认数据库服务状态
3. 验证网络连接
4. 检查用户权限

## 扩展指南

### 添加新功能模块

1. **创建页面组件**

   ```bash
   # 在 pages/ 下创建新页面
   mkdir pages/new-feature
   touch pages/new-feature/index.vue
   ```

2. **添加API接口**

   ```bash
   # 在 server/api/ 下创建API
   touch server/api/newFeature.post.ts
   ```

3. **创建业务逻辑**

   ```bash
   # 添加服务层
   touch server/service/newFeatureService.ts

   # 添加数据访问层
   touch server/mapper/newFeatureMapper.ts
   ```

4. **状态管理**

   ```bash
   # 添加 Pinia store
   touch stores/new-feature.ts

   # 添加类型定义
   touch types/store/NewFeature.d.ts
   ```

### 自定义组件开发

1. **创建组件**

   ```vue
   <!-- components/custom-component/index.vue -->
   <template>
     <div class="custom-component">
       <!-- 组件内容 -->
     </div>
   </template>

   <script setup lang="ts">
   // 组件逻辑
   </script>

   <style scoped>
   /* 组件样式 */
   </style>
   ```

2. **添加类型定义**
   ```typescript
   // types/components/CustomComponent.d.ts
   declare namespace CustomComponent {
     interface Props {
       // 属性定义
     }
   }
   ```

## 更新日志

### v0.0.1 (当前版本)

- 🎉 初始版本发布
- ✨ 支持多种图表类型（表格、柱状图、折线图、饼图）
- ✨ 完整的数据分析功能
- ✨ 邮件报告系统
- ✨ 定时任务支持
- 📱 响应式设计
- 🔐 用户认证系统

## 贡献指南

### 贡献流程

1. **Fork 项目**
2. **创建特性分支**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **提交更改**
   ```bash
   git commit -m 'feat: add amazing feature'
   ```
4. **推送分支**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **创建 Pull Request**

### 代码审查标准

- 代码符合项目规范
- 包含必要的测试
- 文档更新完整
- 性能影响评估
- 安全风险评估

## 联系方式

如有问题或建议，请通过以下方式联系：

- **项目仓库**: [项目地址]
- **问题反馈**: [Issues页面]
- **讨论交流**: [Discussions页面]

---

**最后更新**: 2025年10月13日
**文档版本**: v1.0.0
