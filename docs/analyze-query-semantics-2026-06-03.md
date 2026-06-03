# 分析页查询语义修复记录（2026-06-03）

## 背景

分析页当前通过拖拽字段配置“值”“分组”“筛选”“排序”，再由 `/api/getAnalyzeData` 动态生成 SQL 查询看板数据源。静态审查发现，页面交互已经接近 BI 分析心智，但服务端 SQL 生成仍混用了明细查询和聚合查询语义，导致分组图表结果可能不正确。

## 当前问题

### 1. 值字段被错误放入 `GROUP BY`

页面中的“值”会作为图表的 Y 轴或指标字段，“分组”会作为 X 轴或分类字段。但当前服务端把 `dimensions` 和 `groups` 合并后同时放进 `SELECT`，又在存在分组时把值字段也放进 `GROUP BY`。

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

筛选 UI 已允许用户选择 `raw/count/countDistinct/sum/avg/max/min`，但服务端目前只生成普通 `WHERE` 条件。

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

排序 UI 已支持聚合方式，服务端在有分组且排序聚合方式不是 `raw` 时会生成聚合排序表达式，这个方向是合理的。但聚合查询中的 `raw` 排序只能稳定用于分组字段；如果对未分组的指标字段做原始值排序，可能在 MySQL `only_full_group_by` 下报错，或得到不稳定结果。

### 4. 柱状图和折线图字段角色与页面传参不一致

页面把“分组”传为 `xAxisFields`，把“值”传为 `yAxisFields`。饼图按这个语义使用字段，但柱状图和折线图的公共处理逻辑把 `yAxisFields` 最后一个字段当作 X 轴，其余字段当作指标，和页面交互心智不一致。

### 5. 日期分组表达式需要统一

日期字段分组时，`SELECT`、`GROUP BY`、`ORDER BY` 必须使用同一条 SQL 表达式。否则可能出现展示字段被格式化，但实际分组或排序仍按原始字段执行，导致 MySQL `only_full_group_by` 风险或结果顺序和展示粒度不一致。

## 修复目标

本次先做最小一致性修复，不引入新的复杂 UI：

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

## 后续建议

1. 将内部命名逐步从 `dimensions` 调整为更准确的 `measures` 或在类型层补充语义注释，避免“维度”实际表示“值”的长期混乱。
2. 在“值”区域提供聚合方式选择，并保存到 chart config，避免完全依赖默认推断。
3. 区分表格图的“明细模式”和“聚合模式”。明细模式可以不分组、不聚合；聚合模式应复用本记录定义的查询语义。
4. 为动态 SQL 生成补充单元测试或快照测试，覆盖 `WHERE/GROUP BY/HAVING/ORDER BY` 的组合场景。
5. 为未配置分组字段但柱状图、折线图需要 X 轴的场景补充前端防护，避免空 X 轴配置进入渲染层。
