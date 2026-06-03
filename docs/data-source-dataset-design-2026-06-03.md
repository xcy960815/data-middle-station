# 数据源管理与数据集设计（2026-06-03）

## 背景

当前项目的分析和看板已经具备配置、历史版本、权限和图表渲染能力。分析页已支持在数据集和物理表之间切换；看板可以展示基于数据集创建的分析，但血缘和影响分析还没有完全围绕数据集建模。数据源管理与数据集模块用于补齐数据资产底座，让后续分析优先基于业务数据集，而不是散落的数据库表。

本版参考了 `/Users/opera/Downloads/vio` 中的数据集资产、字段配置和来源选择思路，但不直接复制其实现。`vio` 的数据源链路依赖外部 Meta 服务，当前项目第一版先落在本仓库已有的 MySQL 双库结构上。

## 第一版范围

### 数据源管理

已支持：

- 数据源列表、搜索、排序和分页
- 新增、编辑、禁用、删除数据源
- 同步内置业务库 `kanban_data` 的表和字段元数据
- 查看数据源下的表列表
- 查看指定表的字段名、字段类型、字段备注、可空和字段顺序

当前限制：

- 仅支持 MySQL 类型
- 仅支持同步当前项目配置的业务库 `kanban_data`
- 暂不在页面中保存数据库密码，避免过早引入连接密钥管理
- 暂未接入资源权限，后续应走全局资源权限模型

### 数据集 / 语义模型

已支持：

- 基于数据源中的单张物理表创建数据集
- 自动根据已同步字段生成初始字段配置
- 字段显示名、维度/指标角色、默认聚合方式、显示隐藏配置
- 数据集配置版本记录，每次保存字段配置生成新版本
- 数据集列表、搜索、排序和分页
- 数据集预览，基于可见字段从业务库查询样例数据
- 分析页数据源选择器已支持在“数据集”和“物理表”之间切换
- 分析配置会保存 `dataSourceMode`、`datasetId`、`datasetName`，刷新后可恢复数据集来源
- 看板组件加载分析配置时会沿用分析的数据集来源、字段语义和默认聚合配置

当前限制：

- 第一版只支持单表数据集
- 暂不支持 join、SQL 数据集、Excel、HTTP API 等来源
- 看板自身不单独选择数据集，数据集来源跟随被拖入的分析配置
- 血缘、影响分析仍未完整围绕数据集建模
- 暂未做数据集血缘和字段影响分析

## 代码链路

前端页面：

- `pages/data-source/index.vue`
- `pages/dataset/index.vue`
- `pages/analyze/components/column/index.vue`
- `components/selector/dataSource/index.vue`
- `pages/dashboard/[id].vue`
- `pages/dashboard/components/dashboard-widget-chart.vue`

服务端 API：

- `server/api/getDataSources.post.ts`
- `server/api/createDataSource.post.ts`
- `server/api/updateDataSource.post.ts`
- `server/api/deleteDataSource.delete.ts`
- `server/api/syncDataSourceSchema.post.ts`
- `server/api/getDataSourceTables.post.ts`
- `server/api/getDataSourceColumns.post.ts`
- `server/api/getDatasets.post.ts`
- `server/api/getDataset.post.ts`
- `server/api/createDataset.post.ts`
- `server/api/updateDataset.post.ts`
- `server/api/deleteDataset.delete.ts`
- `server/api/previewDataset.post.ts`

服务层：

- `server/service/dataSourceService.ts`
- `server/service/datasetService.ts`

数据访问层：

- `server/mapper/dataSourceMapper.ts`
- `server/mapper/datasetMapper.ts`
- `server/mapper/databaseMapper.ts`

数据库脚本：

- `sql/data_middle_station.sql`

分析配置落点：

- `analyze_config.data_source`：最终用于查询的物理表名。
- `analyze_config.common_chart_config.dataSourceMode`：`table` 或 `dataset`。
- `analyze_config.common_chart_config.datasetId`：选择数据集时记录数据集 ID。
- `analyze_config.common_chart_config.datasetName`：选择数据集时记录数据集名称，便于刷新后恢复展示。

看板配置落点：

- `dashboard_config.widgets_config[].analyzeId`：看板组件引用分析 ID。
- 看板加载组件数据时读取分析当前配置，因此数据集来源、字段显示名、字段角色和聚合方式都来自分析配置。

## 数据模型

新增主表：

- `data_source`：数据源基础信息
- `data_source_table`：同步后的表元数据
- `data_source_column`：同步后的字段元数据
- `dataset`：数据集基础信息
- `dataset_config`：数据集字段配置版本

`dataset_config.fields_config` 是数据集当前最核心的语义配置，字段项包含：

- `sourceColumnName`：物理字段名
- `fieldName`：稳定字段标识
- `displayName`：业务显示名
- `fieldType`：维度或指标
- `dataType`：物理字段类型
- `aggregationType`：默认聚合
- `visible`：是否对分析可见
- `sortOrder`：字段顺序

## 后续建议

优先级较高：

- 看板和邮件快照链路继续补充数据集来源的专项回归验证
- 图表字段选择继续强化数据集显示名和维度/指标角色表达
- 数据源、数据集接入统一资源权限
- 数据集删除前提示被哪些分析使用

中期扩展：

- SQL 数据集，只允许安全 `select` 查询
- 多表 join 数据集
- 指标目录与数据集指标复用
- 数据集配置历史切换和差异对比
- 数据源连接测试与密钥管理

## 实施原则

- 数据源负责连接和元数据同步，数据集负责业务语义，不在页面里混淆职责。
- 第一版不兼容不存在的历史数据，测试阶段优先保持模型干净。
- SQL 查询能力必须在服务端做白名单和参数化约束，不能把前端字段配置直接拼成无限制 SQL。
- Redis 仍保留在项目中，后续可用于分析结果缓存、看板组件缓存和刷新策略，不因本模块暂未使用而删除。
