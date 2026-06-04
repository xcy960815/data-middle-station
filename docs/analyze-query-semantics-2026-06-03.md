# 分析页查询语义修复记录（2026-06-03）

## 背景

分析页当前通过拖拽字段配置“值”“分组”“筛选”“排序”，再由 `/api/getAnalyzeData` 动态生成 SQL 查询看板数据源。静态审查发现，页面交互已经接近 BI 分析心智，但服务端 SQL 生成仍混用了明细查询和聚合查询语义，导致分组图表结果可能不正确。

## 已修复问题

### 1. 值字段被错误放入 `GROUP BY`

页面中的“值”会作为图表的 Y 轴或指标字段，“分组”会作为 X 轴或分类字段。历史实现曾把值字段和分组字段合并后同时放进 `GROUP BY`；当前已改为分组字段进入 `GROUP BY`，值字段在聚合查询中进入聚合 `SELECT`。

这会把预期的：

```sql
select region, sum(sales) as sales
from orders
group by region
```

变成类似：

```sql
select sales, region
from orders
group by region, sales
```

结果会按原始指标值继续拆分，柱状图、折线图和饼图都可能展示错误聚合结果。

### 2. 筛选的聚合语义没有落到 SQL

筛选 UI 允许用户选择 `raw/count/countDistinct/sum/avg/max/min`。当前服务端已按查询模式拆分 `WHERE` 和 `HAVING`。

正确语义应拆分为：

- `raw` 筛选：明细行过滤，进入 `WHERE`。
- 聚合筛选：分组聚合后过滤，进入 `HAVING`。

例如“总计销售额大于 1000”应生成：

```sql
group by region
having sum(sales) > ?
```

而不是：

```sql
where sales > ?
```

### 3. 排序在聚合查询下需要限制字段角色

排序 UI 已支持聚合方式。当前服务端在有分组且排序聚合方式不是 `raw` 时生成聚合排序表达式；聚合查询中的 `raw` 排序只允许稳定用于分组字段。

### 4. 柱状图和折线图字段角色与页面传参不一致

页面把“分组”传为 `xAxisFields`，把“值”传为 `yAxisFields`。当前柱状图、折线图和饼图均按这个字段角色渲染。

### 5. 日期分组表达式需要统一

日期字段分组时，`SELECT`、`GROUP BY`、`ORDER BY` 复用同一条 SQL 表达式，避免展示粒度、分组粒度和排序粒度不一致。

## 已落地规则

当前查询语义规则：

1. 分组字段进入 `GROUP BY`。
2. 值字段进入聚合 `SELECT`，默认聚合规则：
   - 字段已有 `datasetAggregationType` 时优先使用。
   - 数值字段默认 `sum`。
   - 非数值字段默认 `count`。
3. `raw` 筛选进入 `WHERE`。
4. 聚合筛选进入 `HAVING`。
5. 聚合查询中：
   - 分组字段允许 `raw` 排序。
   - 指标字段排序使用聚合表达式。
6. 日期分组字段在 `SELECT`、`GROUP BY`、`ORDER BY` 中复用统一表达式。
7. 未显式配置聚合方式的指标筛选，复用值字段默认聚合推断，避免 `HAVING` 与指标默认聚合不一致。
8. 柱状图和折线图按 `xAxisFields = 分组`、`yAxisFields = 值` 渲染。
9. 表格图按分组是否存在区分查询模式：无分组为明细查询，有分组为聚合查询；页面不再展示“明细表格/聚合表格”模式标签。

## 表格模式规则

| 查询语义 | 条件              | SQL                       | 值聚合 UI |
| -------- | ----------------- | ------------------------- | --------- |
| 明细查询 | `dimensions` 为空 | 无 `GROUP BY`，值列不聚合 | 隐藏      |
| 聚合查询 | `dimensions` 非空 | `GROUP BY` + 值列聚合     | 显示      |

校验规则：表格图至少需要 1 个值字段。查询语义只由分组字段决定，和当前选择了多少值字段无关。无分组时即使值字段保存了 `datasetAggregationType`，查询仍按明细查询输出行级数据，不使用聚合表达式。

## 完成记录

1. 已完成：分析页“值/指标”内部命名已端到端调整为 `measures` / `MeasureOption` / `useMeasuresStore`，不再使用 `dimensions` 表示值字段。
2. 已完成：在“值”区域提供聚合方式选择，并保存到 chart config，避免完全依赖默认推断。
3. 已完成：区分表格图的明细查询和聚合查询。明细查询可以不分组、不聚合；聚合查询应复用本记录定义的查询语义。
4. 已完成：已补 `pnpm test:analyze-query` 快照测试，覆盖 `WHERE/GROUP BY/HAVING/ORDER BY` 的组合场景。
5. 已完成：为未配置分组字段但柱状图、折线图需要 X 轴的场景补充前端防护，避免空 X 轴配置进入渲染层。

## 迁移记录

1. 已完成：前端防护已抽公共 `validateAnalyzeChartConfig`，并接入分析页查询、看板组件和邮件渲染链路；柱状图、折线图 `render*` 也已补空 X 轴兜底，避免只在 `useAnalyzeDataHandler` 一处校验。
2. 已完成：值聚合 UI 已在“值”区域提供聚合方式选择，保存字段为 `measures[].datasetAggregationType`，并和 `AnalyzeQueryBuilder` 已支持的字段配置对齐；无分组时隐藏聚合入口，避免明细表格场景误导。自定义列表达式默认按当前类型推断为计数，可在有分组时手动改聚合。
3. 已完成：表格图查询语义已由 `AnalyzeQueryBuilder` 按是否存在分组统一处理；前端已移除“明细表格/聚合表格”模式标签。
4. 已完成：命名清理已从折中注释方案推进为硬改名，分析配置字段、DTO、store、组件目录和 SQL 初始化脚本统一使用 `measures`。
5. 已补迁移脚本：
   - `sql/20260603_rename_analyze_config_dimensions_to_measures.sql`
   - `sql/20260603_replace_dimension_path_values_to_measure.sql`

## 字段命名改造完成记录：`groups` -> `dimensions`

已完成“分组”链路从 `groups` 到 `dimensions` 的 BI 语义改造，当前字段角色命名为 `dimensions = 分组/维度`、`measures = 值/指标`。

### 1. 改造目标

- 页面中文仍叫“分组”，降低用户认知变化；代码和配置字段改为 `dimensions`。
- `GroupStore` / `GroupOption` / `useGroupsStore` 已改为 `DimensionStore` / `DimensionOption` / `useDimensionsStore`，此处的 `Dimension` 表示分组维度，不再表示值字段。
- `AnalyzeDataQuery.groups`、`chartConfig.groups`、`analyze_config.groups` 已改为 `dimensions`。
- 数据集字段类型中的 `dimension` 保持不变，它和本次改名后的分析分组语义对齐。
- 图表组件参数 `xAxisFields` / `yAxisFields` 可以暂时保留，避免同时重命名图表坐标轴 API。

### 2. 落地记录

1. 已完成：类型和 Store 改为 `types/store/DimensionStore.d.ts`、`stores/dimensions.ts`、`StoreNames.DIMENSIONS`，拖拽来源类型改为 `dimensions`。
2. 已完成：DTO/DAO/VO 中的分组字段改为 `dimensions` / `DimensionOption`。
3. 已完成：`AnalyzeQueryBuilder`、`validateAnalyzeChartConfig` 等公共逻辑改为读取 `dimensions`。
4. 已完成：分析页分组组件、字段拖拽、保存草稿、历史版本切换、图表渲染传参统一接入 `dimensions`。
5. 已完成：看板 widget 数据加载、`DashboardWidgetChart` 校验、邮件快照渲染统一使用 `chartConfig.dimensions`。
6. 已完成：`analyze_config.groups` 字段改名为 `dimensions`，补迁移脚本 `sql/20260604_rename_analyze_config_groups_to_dimensions.sql`。
7. 已完成：更新 `pnpm test:analyze-query` 快照输入、README、AGENTS 和本记录。

### 3. 需要重点避免的问题

- 不要把已经完成的 `measures` 改回旧 `dimensions`；本轮 `dimensions` 只代表分组/维度。
- 不要替换数据集字段类型枚举里的 `dimension`，它本来就是维度语义。
- 不要全局替换自然语言里的 SQL `GROUP BY` 或页面中文“分组”；中文可继续保留。
- 如果数据库不考虑兼容旧数据，也仍要保留迁移脚本，方便明确初始化脚本和旧库清洗步骤。

### 4. 验证清单

- 持续保留 `pnpm test:analyze-query` 作为分析查询语义回归入口。
- 改完后重点验证：分析页拖分组、拖值、保存草稿、刷新、历史版本切换。
- 验证看板：拖入带分组维度的分析、刷新组件、切换看板版本。
- 验证邮件：至少一个柱状图或折线图快照能用 `dimensions + measures` 渲染。
- 扫描旧命名：`groups`、`GroupStore`、`useGroupsStore`、`GroupOption` 只允许出现在迁移说明或必要兼容脚本中。
