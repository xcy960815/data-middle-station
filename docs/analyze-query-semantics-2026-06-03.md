# 分析页查询语义修复记录（2026-06-03）

## 背景

分析页当前通过拖拽字段配置“值”“分组”“筛选”“排序”，再由 `/api/getAnalyzeData` 动态生成 SQL 查询看板数据源。静态审查发现，页面交互已经接近 BI 分析心智，但服务端 SQL 生成仍混用了明细查询和聚合查询语义，导致分组图表结果可能不正确。

## 已修复问题

### 1. 值字段被错误放入 `GROUP BY`

页面中的“值”会作为图表的 Y 轴或指标字段，“分组”会作为 X 轴或分类字段。历史实现曾把值字段和分组字段合并后同时放进 `GROUP BY`；当前已改为分组字段进入 `GROUP BY`，值字段在聚合模式下进入聚合 `SELECT`。

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
9. 表格图按分组是否存在区分查询模式：无分组为明细表格，有分组为聚合表格。前端通过 `getTableQueryMode` 统一校验文案和模式标签。

## 表格模式规则

| 模式     | 条件          | SQL                       | 值聚合 UI |
| -------- | ------------- | ------------------------- | --------- |
| 明细表格 | `groups` 为空 | 无 `GROUP BY`，值列不聚合 | 隐藏      |
| 聚合表格 | `groups` 非空 | `GROUP BY` + 值列聚合     | 显示      |

校验规则：两种模式均至少需要 1 个值字段。表格模式只由分组字段决定，和当前选择了多少值字段无关。无分组时即使值字段保存了 `datasetAggregationType`，查询仍按明细表格输出行级数据，不使用聚合表达式。

## 完成记录

1. 已完成：分析页“值/指标”内部命名已端到端调整为 `measures` / `MeasureOption` / `useMeasuresStore`，不再使用 `dimensions` 表示值字段。
2. 已完成：在“值”区域提供聚合方式选择，并保存到 chart config，避免完全依赖默认推断。
3. 已完成：区分表格图的“明细模式”和“聚合模式”。明细模式可以不分组、不聚合；聚合模式应复用本记录定义的查询语义。
4. 已完成：已补 `pnpm test:analyze-query` 快照测试，覆盖 `WHERE/GROUP BY/HAVING/ORDER BY` 的组合场景。
5. 已完成：为未配置分组字段但柱状图、折线图需要 X 轴的场景补充前端防护，避免空 X 轴配置进入渲染层。

## 迁移记录

1. 已完成：前端防护已抽公共 `validateAnalyzeChartConfig`，并接入分析页查询、看板组件和邮件渲染链路；柱状图、折线图 `render*` 也已补空 X 轴兜底，避免只在 `useAnalyzeDataHandler` 一处校验。
2. 已完成：值聚合 UI 已在“值”区域提供聚合方式选择，保存字段为 `measures[].datasetAggregationType`，并和 `AnalyzeQueryBuilder` 已支持的字段配置对齐；无分组时隐藏聚合入口，避免明细表格场景误导。自定义列表达式默认按当前类型推断为计数，可在有分组时手动改聚合。
3. 已完成：表格模式表达已用 `getTableQueryMode` 统一判断，无分组显示明细表格，有分组显示聚合表格。
4. 已完成：命名清理已从折中注释方案推进为硬改名，分析配置字段、DTO、store、组件目录和 SQL 初始化脚本统一使用 `measures`。
5. 已补迁移脚本：
   - `sql/20260603_rename_analyze_config_dimensions_to_measures.sql`
   - `sql/20260603_replace_dimension_path_values_to_measure.sql`
