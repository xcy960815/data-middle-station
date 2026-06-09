# 上卷下钻状态持久化设计

> 本文档是对 `analyze-drill-state-design.md` 的迭代更新。原文档的结论是"钻取状态不写入分析配置"，该结论基于当时的需求假设。当前需求已明确变更，本文档记录新的设计决策和技术方案。

## 需求变更

### 原始需求（已废弃）

原文档认为钻取状态属于用户交互产生的运行态，不应写入分析配置，理由包括：

1. 不同用户打开同一分析会看到上一个用户的钻取路径。
2. 看板复用时可能继承编辑页的一次性钻取路径。
3. 邮件渲染可能误将钻取路径当作分析定义。
4. 历史版本会混入用户交互噪音。

### 当前需求

产品明确要求：**上卷下钻状态需要持久化到数据库**，所有用户共享同一个钻取位置。具体约束：

1. **持久化范围**：所有用户共享。保存后任何用户打开该分析，都从保存时的钻取位置开始。
2. **保存时机**：跟随现有保存按钮（工具栏"保存"或 Cmd+S），钻取状态与图表配置一起提交。
3. **存储位置**：存入 `analyze_config` 的 `dimensions` 数组中，与 orders、filters、measures 的数组风格保持一致。

### 对原文档顾虑的回应

1. "不同用户看到上一个用户的路径" — 当前需求就是所有用户共享，这是期望行为而非缺陷。
2. "看板复用" — 看板引用分析时，钻取状态随分析配置一起被引用，属于预期行为。
3. "邮件渲染" — 邮件渲染侧只需忽略 `drill.value` 字段即可，不影响现有逻辑。
4. "历史版本噪音" — 钻取状态是分析配置的一部分，它的变化本身就是一种有意义的配置变更，应被版本记录。

## 设计决策

### 核心原则：钻取值是维度规则的持久化属性

项目中所有分析配置字段都遵循同一范式 — 每个字段携带自己的规则：

| 字段类型   | 规则字段        | 规则内容        |
| ---------- | --------------- | --------------- |
| measures   | `measureRule`   | 聚合方式        |
| filters    | `filterRule`    | 操作符 + 操作数 |
| orders     | `orderRule`     | 方向 + 聚合方式 |
| dimensions | `dimensionRule` | drill 配置      |

钻取值（用户在某层维度选了什么值）本质上就是该维度字段"被选中了什么值"，它是字段自身的行为属性，和 `filterRule.operand`（筛选的操作数）是同一层级的概念。因此应存入 `dimensionRule.drill.value`，而不是引入独立的 `drill_state` 结构。

### 存储结构

在现有 `dimensionRule.drill` 上新增 `value` 字段：

```json
{
  "dimensions": [
    {
      "columnName": "province",
      "displayName": "省份",
      "dimensionRule": {
        "drill": {
          "enabled": true,
          "role": "level",
          "value": "浙江"
        }
      }
    },
    {
      "columnName": "city",
      "displayName": "城市",
      "dimensionRule": {
        "drill": {
          "enabled": true,
          "role": "level",
          "value": "杭州"
        }
      }
    },
    {
      "columnName": "district",
      "displayName": "区县",
      "dimensionRule": {
        "drill": {
          "enabled": true,
          "role": "level"
        }
      }
    }
  ]
}
```

语义：

- `drill.enabled = true` 且 `drill.role = "level"`：该维度参与钻取层级链。
- `drill.value` 有值：用户已钻过该层，并选择了这个值。
- `drill.value` 为 null/undefined：该层还未被钻取。
- 当前层级 = 从第一个钻取维度开始，连续有 value 的个数（本例中为 2，province 和 city）。
- 不需要单独存储 `drillCurrentLevel`，路径长度即是层级。

### 不引入新表或新列

不需要新增数据库列。钻取状态直接随 `dimensions` JSON 字段存入现有的 `analyze_config` 表，跟随配置版本一起创建和加载。

### 不持久化的运行态

`selectedDrillValue`（右键菜单中选了值但还没点下钻的临时中间态）仍然只存在于前端内存中，不写入数据库。

## 补充设计约束

### 1. 路径需要规范化

持久化后的钻取路径要遵循连续路径语义：

- 只从启用钻取的维度链里读取 `drill.value`。
- 从第一层开始连续有 value 的维度才算路径；中间一旦断层，后续 value 都应忽略或清理。
- 最后一层维度不应保存 value，因为它没有下一层可继续下钻。最多只保存前 `drillDimensions.length - 1` 层的 value。
- `setDimensions`、`drillDown`、`rollUpTo`、`resetDrill` 至少有一个入口要保证 dimensions 处于规范化状态。

### 2. 更新钻取值时不要只按 `columnName` 找维度

当前 UI 会提示重复分组无效，但实现仍应避免把 `columnName` 当作唯一可靠定位方式。钻取更新、上卷和清理建议按"钻取层级"或原 `dimensions` 数组下标更新，避免重复字段、重排或自定义字段导致误更新。

### 3. 下游消费策略必须显式定义

编辑页保存/加载可以自然受益于 `useAnalyzeDraft` 和 `applyAnalyzeDetail`，但看板和邮件并不会自动理解 `dimensionRule.drill.value`。当前看板和邮件都是直接把 `chartConfig.dimensions` 传给查询接口，因此必须明确：

- **编辑页**：应用持久化钻取位置，按 `drill.value` 派生当前查询维度和路径筛选。
- **看板**：如果产品期望"随分析配置一起继承钻取位置"，看板查询也要复用同一套钻取派生逻辑。
- **邮件**：如果产品期望"忽略钻取位置"，邮件渲染前要显式清理/忽略 `drill.value`；如果期望继承，也要复用同一套派生逻辑。

### 4. 可以抽取纯函数，但只抽真正复用的规则

如果只有编辑页使用，派生逻辑留在 `pages/analyze/useAnalyzeDrill.ts` 即可。当前设计已经涉及编辑页、看板、邮件三个消费者，建议新增一个不依赖 Vue/Pinia 的纯函数模块 `shared/analyzeDrillState.ts`，集中处理：

- 判断一个维度是否参与钻取。
- 从 dimensions 派生 `drillPath / effectiveDrillLevel / currentDrillDimension / nextDrillDimension`。
- 从 `drillPath` 派生查询用的 raw filters。
- 规范化 dimensions 中的 `drill.value`，清掉断层和尾部无效 value。

## 技术方案

### 一、纯函数模块（建议新增）

**`shared/analyzeDrillState.ts`** — 不依赖 Vue/Pinia 的纯函数模块，供编辑页、看板、邮件复用：

```ts
// 判断维度是否参与钻取
export function isAnalyzeDrillDimension(dimension): boolean

// 从 dimensions 派生钻取状态
export function deriveAnalyzeDrillState(dimensions): {
  drillDimensions
  drillPath
  effectiveDrillLevel
  currentDrillDimension
  nextDrillDimension
}

// 从 drillPath 派生查询用的 raw filters
export function buildAnalyzeDrillFilters(drillPath): FilterOption[]

// 规范化 dimensions 中的 drill.value，清掉断层和尾部无效 value
export function normalizeAnalyzeDrillDimensions(dimensions): DimensionOption[]
```

如果实现阶段确认看板和邮件暂不消费钻取状态，可以先不抽 shared，把逻辑留在 `useAnalyzeDrill.ts`，但不要在多个文件复制同一套规则。

### 二、类型定义

**`shared/analyzeConfigFieldRules.ts`** — `AnalyzeDimensionFieldRule.drill` 增加 `value`：

```ts
export type AnalyzeDimensionFieldRule = {
  drill?: {
    enabled?: boolean
    role?: 'level'
    value?: string | number | boolean | null
  }
}
```

**`types/store/DimensionStore.d.ts`** — 精简 state，移除独立的钻取状态：

```ts
type DimensionState = {
  dimensions: DimensionOption[]
  // 移除：drillCurrentLevel, drillPath
  selectedDrillValue: DrillPathItem['value'] // 保留：临时 UI 中间态
}
```

actions 相应精简，移除 `setDrillCurrentLevel`、`setDrillPath`，重新定义 `drillDown`、`rollUpTo`、`resetDrill`。

### 三、dimensionStore 改造

移除两个独立状态（`drillCurrentLevel`、`drillPath` 及对应 getter），改为从 dimensions 派生。

重要：不要用 `columnName` 作为唯一定位依据来更新钻取值。推荐让 `drillDown` 接收钻取层级或原数组下标，再通过当前 dimensions 计算目标维度位置。

```ts
// 改造后的 actions：
drillDown(level: number, value: DrillPathItem['value']) {
  const drillIndexes = getDrillDimensionIndexes(this.dimensions)
  const targetIndex = drillIndexes[level]
  if (typeof targetIndex === 'undefined') return

  this.dimensions[targetIndex] = setDimensionDrillValue(this.dimensions[targetIndex], value)
  // 清掉后续层级的旧 value，避免切换路径后残留过期路径
  for (let i = level + 1; i < drillIndexes.length; i++) {
    this.dimensions[drillIndexes[i]] = setDimensionDrillValue(this.dimensions[drillIndexes[i]], undefined)
  }
  this.dimensions = normalizeAnalyzeDrillDimensions(this.dimensions)
  this.selectedDrillValue = null
}

rollUpTo(level: number) {
  const drillIndexes = getDrillDimensionIndexes(this.dimensions)
  for (let i = Math.max(0, level); i < drillIndexes.length; i++) {
    this.dimensions[drillIndexes[i]] = setDimensionDrillValue(this.dimensions[drillIndexes[i]], undefined)
  }
  this.dimensions = normalizeAnalyzeDrillDimensions(this.dimensions)
  this.selectedDrillValue = null
}

resetDrill() {
  this.dimensions = this.dimensions.map(d => {
    if (d.dimensionRule?.drill?.value != null) {
      return { ...d, dimensionRule: { ...d.dimensionRule, drill: { ...d.dimensionRule.drill, value: undefined } } }
    }
    return d
  })
  this.selectedDrillValue = null
}
```

### 四、useAnalyzeDrill 改造

`drillPath`、`currentDrillDimension`、`effectiveDrillLevel` 改为从 dimensions 数组派生的 computed：

```ts
const drillPath = computed(() => {
  const path: DrillPathItem[] = []
  for (const dim of drillDimensions.value) {
    const value = dim.dimensionRule?.drill?.value
    if (value == null) break
    path.push({ dimension: dim, value })
  }
  return path
})

const effectiveDrillLevel = computed(() => drillPath.value.length)

const currentDrillDimension = computed(() => {
  return drillDimensions.value[effectiveDrillLevel.value]
})
```

如果新增了 `shared/analyzeDrillState.ts`，这里应该只负责把纯函数结果包装成 computed，不再重复写钻取层级判断。

### 五、查询参数派生

`useAnalyzeDataHandler.queryAnalyzeDataParams` 的逻辑不变，只是数据来源从 store 的独立状态改为 computed 派生值：

```ts
const dimensions =
  isDrillQueryEnabled.value && currentDrillDimension.value
    ? [currentDrillDimension.value]
    : dimensionStore.getDimensions

const filters = [...baseFilters, ...(isDrillQueryEnabled.value ? drillFilters.value : [])]
```

`drillFilters` 仍然由 `useAnalyzeDrill` 从 `drillPath` computed 生成，逻辑不变。

### 六、保存和加载

**保存**：`useAnalyzeDraft.buildAnalyzeDraftPayload()` 无需特殊处理。它序列化 dimensions 时自然包含 `dimensionRule.drill.value`，和现有的 measures/filters/orders 序列化方式完全一致。脏检查（`serializeAnalyzeDraft` 快照比对）也自动生效。

**加载**：`useAnalyzeHandler.applyAnalyzeDetail()` 中 `dimensionStore.setDimensions(chartConfig?.dimensions || [])` 已经会把完整的 dimensions（含 drill.value）写入 store。不再需要单独的钻取状态恢复逻辑。

### 七、维度删除时的路径有效性

`useAnalyzeDataHandler` 中现有的 watch 逻辑保留，但不再读取 `dimensionStore.getDrillPath`；应基于 `deriveAnalyzeDrillState(dimensions)` 或 `drillPath` computed 判断已有 value 是否仍然连续有效。数据源或数据集变化时继续调用 `dimensionStore.resetDrill()`，它会清空 dimensions 中的 `drill.value`。

```ts
watch(
  () => drillDimensions.value.map((item) => item.columnName),
  (dimensionNames) => {
    // 如果钻取维度列表变化，检查已有 value 的维度是否还有效
    // 如果某层维度被删除，自动清空该层及之后的 value（即 rollUpTo）
  }
)
```

### 八、看板和邮件的消费策略

当前看板和邮件并不会自动按 `drill.value` 查询：

- 看板在 `pages/dashboard/composables/useDashboard.ts` 的 `buildWidgetAnalyzeDataParams` 中直接使用 `chartConfig.dimensions`。
- 邮件在 `server/features/email/service/chartSnapshotService.ts` 中直接使用 `chartConfig.dimensions`。

需要按产品口径选择并实现：

**看板继承钻取位置：**

- 在看板构造查询参数时复用 `deriveAnalyzeDrillState` 和 `buildAnalyzeDrillFilters`。
- 查询维度使用 `currentDrillDimension ? [currentDrillDimension] : chartConfig.dimensions`。
- 查询 filters 追加由 drillPath 派生出的 raw filters。
- widget 展示用的 xAxisFields 也应使用当前查询维度，避免数据和坐标轴字段不一致。

**邮件忽略钻取位置：**

- 邮件渲染前先用 `normalizeAnalyzeDrillDimensions` 或专门 helper 清掉所有 `drill.value`。
- 查询和渲染都使用清理后的 dimensions。

**邮件继承钻取位置：**

- 如果产品期望邮件继承保存时的钻取位置，邮件服务同样复用看板的派生逻辑。
- 不要让邮件"原样传 dimensions"后假装继承，因为 `AnalyzeQueryBuilder` 不会从 `drill.value` 自动生成路径筛选。

## 改动文件清单

| 文件                                                    | 改动内容                                                                                                                                          |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `shared/analyzeDrillState.ts`                           | 新增纯函数模块：钻取维度判断、路径派生、filters 派生、dimensions 规范化                                                                           |
| `shared/analyzeConfigFieldRules.ts`                     | `AnalyzeDimensionFieldRule.drill` 类型增加 `value` 字段                                                                                           |
| `types/store/DimensionStore.d.ts`                       | 移除 `drillCurrentLevel`、`drillPath` 状态和相关 getter/action 类型，重新定义 `drillDown`/`rollUpTo`/`resetDrill` 的签名                          |
| `stores/dimensions.ts`                                  | 移除 `drillCurrentLevel`/`drillPath` 状态和对应 getter/action；`drillDown`/`rollUpTo`/`resetDrill` 改为按层级下标操作 `dimensionRule.drill.value` |
| `pages/analyze/useAnalyzeDrill.ts`                      | `drillPath`/`currentDrillDimension`/`effectiveDrillLevel` 改为从 dimensions 派生的 computed，复用 shared 纯函数                                   |
| `pages/analyze/useAnalyzeDataHandler.ts`                | 移除对独立 `drillPath` 的 watch 和 `activeDrillQueryKey`/`skipParamQueryForDrill` 逻辑；维度列表 watch 改为基于 computed 判断有效性               |
| `pages/analyze/useAnalyzeHandler.ts`                    | `applyAnalyzeDetail` 中移除单独的 `dimensionStore.resetDrill()` 调用（不再需要，dimensions 自带 value）                                           |
| `pages/analyze/components/dimension/index.vue`          | `handleDrillDownFromMenu` 改为传层级和值；`handleRollUpFromMenu` 传层级数字                                                                       |
| `pages/dashboard/composables/useDashboard.ts`           | 如果看板继承钻取位置，需复用 `deriveAnalyzeDrillState` 和 `buildAnalyzeDrillFilters`                                                              |
| `server/features/email/service/chartSnapshotService.ts` | 如果邮件忽略钻取位置，渲染前清掉 `drill.value`；如果继承，复用派生逻辑                                                                            |

不需要改动：数据库表结构、后端 Mapper、后端 Service、DTO/VO 类型、`AnalyzeQueryBuilder`（钻取路径应在调用查询前派生成 dimensions + filters）、`useAnalyzeDraft.ts`（序列化 dimensions 时自动包含 drill.value）、图表组件、右键菜单组件。

## 数据流

```
保存：
  用户点击下钻 → dimensionStore.drillDown() 写入 dimensionRule.drill.value
    → serializeAnalyzeDraft() 检测到 dimensions 变化 → editorDirty = true
    → 用户点保存 → buildAnalyzeDraftPayload() 序列化 dimensions（含 drill.value）
    → POST /api/updateAnalyze → createAnalyzeConfigVersion → 写入 analyze_config.dimensions

加载：
  GET /api/getAnalyze → 返回 dimensions（含 drill.value）
    → applyAnalyzeDetail() → dimensionStore.setDimensions(data.dimensions)
    → useAnalyzeDrill 的 computed 自动从 dimensions 派生 drillPath / currentDrillDimension
    → useAnalyzeDataHandler 的 watch 检测到 queryAnalyzeDataParams 变化
    → 自动发起查询 → 图表渲染钻取后的数据
```

## 实施问答

### 现有逻辑能保持不变吗？

外部交互逻辑（右键菜单、下钻、上卷、查询参数派生）对用户来说完全不变。但内部实现需要一层重构 — 因为钻取状态的"主位置"变了。

**当前**：钻取状态存在 dimensionStore 的独立属性里（`drillPath`、`drillCurrentLevel`），`useAnalyzeDrill` 从这些属性读取。

**改后**：钻取状态存在每个 dimension 对象的 `dimensionRule.drill.value` 里，`useAnalyzeDrill` 从 dimensions 数组派生 computed。

具体要改的核心逻辑集中在三块：`dimensionStore` 的 action 实现（`drillDown`/`rollUpTo`/`resetDrill`）、`useAnalyzeDrill` 的 computed 派生、`useAnalyzeDataHandler` 里监听钻取路径变化的 watch。其他部分（UI 组件、查询构建、保存/加载管道）基本不动。

整体改动集中在 store 和 composable 层，约 6 个文件。如果看板/邮件也同步实现消费策略，额外涉及 2 个文件。

### 需要清洗数据库吗？

**不需要。**

`drill.value` 是新增的可选字段。现有的 `analyze_config.dimensions` 数据中没有这个字段，加载时 `drill.value` 为 undefined，代码会将其视为"未钻取"处理 — 这与当前行为完全一致（打开分析时从第一层开始）。

### 现有数据的 drill.enabled 状态

现有 SQL 数据中，大部分维度的钻取配置为 `"drill": { "role": "level", "enabled": false }`，即不参与钻取。如果想让某个已有分析启用钻取功能，需要将对应维度的 `enabled` 改为 `true`。这个改动无需批量刷数据库 — 用户在前端维度面板启用钻取后保存即可，新配置会随下一次保存写入数据库。

## 验证要点

1. 打开一个有多个钻取维度的分析，右键下钻到第二层，保存，刷新页面，确认恢复到钻取后的状态
2. 保存后打开历史版本，确认钻取状态随版本切换
3. 下钻后不保存直接离开页面，确认弹出"未保存改动"提示
4. 删除一个已钻取的维度，确认自动上卷到有效层级
5. 数据源切换，确认钻取状态被重置
6. 看板如果选择继承钻取位置，保存分析后刷新看板，确认 widget 查询和 xAxisFields 都停留在保存的钻取层级
7. 邮件如果选择忽略钻取位置，保存钻取状态后发送邮件，确认邮件图表仍使用完整维度配置而不是钻取后的路径
8. 构造异常 dimensions（中间层没有 value、末层有 value），确认加载或保存后会清理成连续有效路径
