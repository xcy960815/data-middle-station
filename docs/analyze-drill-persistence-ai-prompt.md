# 任务：将上卷下钻状态持久化到 dimensions 数组

## 背景

阅读 `docs/analyze-drill-persistence-design.md`，里面有完整的需求说明和技术方案。

简单来说：当前上卷下钻的钻取状态（钻到哪一层、每一层选了什么值）只存在前端 dimensionStore 的内存中，刷新页面就丢失了。需要将其持久化，存入 `analyze_config` 表的 `dimensions` JSON 字段中，让所有用户共享钻取位置。

## 核心思路

在 `dimensionRule.drill` 上新增一个可选的 `value` 字段，记录用户在该维度选择的钻取值。有 value 表示已钻过该层，没有 value 表示未钻取。不再需要单独的 `drillCurrentLevel` 和 `drillPath` 状态 — 它们可以从 dimensions 数组派生。

## 补充设计约束

### 1. 路径需要规范化

持久化后的钻取路径要遵循连续路径语义：

- 只从启用钻取的维度链里读取 `drill.value`。
- 从第一层开始连续有 value 的维度才算路径；中间一旦断层，后续 value 都应忽略或清理。
- 最后一层维度不应保存 value，因为它没有下一层可继续下钻。最多只保存前 `drillDimensions.length - 1` 层的 value。
- `setDimensions`、`drillDown`、`rollUpTo`、`resetDrill` 至少有一个入口要保证 dimensions 处于规范化状态。

### 2. 更新钻取值时不要只按 `columnName` 找维度

当前 UI 会提示重复分组无效，但实现仍应避免把 `columnName` 当作唯一可靠定位方式。钻取更新、上卷和清理建议按“钻取层级”或原 `dimensions` 数组下标更新，避免重复字段、重排或自定义字段导致误更新。

### 3. 下游消费策略必须显式定义

编辑页保存/加载可以自然受益于 `useAnalyzeDraft` 和 `applyAnalyzeDetail`，但看板和邮件并不会自动理解 `dimensionRule.drill.value`。当前看板和邮件都是直接把 `chartConfig.dimensions` 传给查询接口，因此必须明确：

- 编辑页：应用持久化钻取位置，按 `drill.value` 派生当前查询维度和路径筛选。
- 看板：如果产品期望“随分析配置一起继承钻取位置”，看板查询也要复用同一套钻取派生逻辑。
- 邮件：如果产品期望“忽略钻取位置”，邮件渲染前要显式清理/忽略 `drill.value`；如果期望继承，也要复用同一套派生逻辑。

### 4. 可以抽取纯函数，但只抽真正复用的规则

如果只有编辑页使用，派生逻辑留在 `pages/analyze/useAnalyzeDrill.ts` 即可。当前设计已经涉及编辑页、看板、邮件三个消费者，建议新增一个不依赖 Vue/Pinia 的纯函数模块，例如 `shared/analyzeDrillState.ts`，集中处理：

- 判断一个维度是否参与钻取。
- 从 dimensions 派生 `drillPath / effectiveDrillLevel / currentDrillDimension / nextDrillDimension`。
- 从 `drillPath` 派生查询用的 raw filters。
- 规范化 dimensions 中的 `drill.value`，清掉断层和尾部无效 value。

## 需要改动的文件（按顺序）

### 0. `shared/analyzeDrillState.ts`（建议新增）

建议新增一个纯函数模块，避免编辑页、看板、邮件各自手写一套钻取派生规则。

建议暴露这些函数：

```ts
export function isAnalyzeDrillDimension(dimension: AnalyzeConfigDao.DimensionOption): boolean

export function deriveAnalyzeDrillState(dimensions: AnalyzeConfigDao.DimensionOption[]): {
  drillDimensions: AnalyzeConfigDao.DimensionOption[]
  drillPath: DimensionStore.DrillPathItem[]
  effectiveDrillLevel: number
  currentDrillDimension?: AnalyzeConfigDao.DimensionOption
  nextDrillDimension?: AnalyzeConfigDao.DimensionOption
}

export function buildAnalyzeDrillFilters(drillPath: DimensionStore.DrillPathItem[]): AnalyzeConfigDao.FilterOption[]

export function normalizeAnalyzeDrillDimensions(
  dimensions: AnalyzeConfigDao.DimensionOption[]
): AnalyzeConfigDao.DimensionOption[]
```

注意：

- 这个模块不要依赖 Vue computed，也不要调用 Pinia store。
- `normalizeAnalyzeDrillDimensions` 要清理断层 value 和最后一层 value。
- 如果实现阶段确认看板和邮件暂不消费钻取状态，可以先不抽 shared，把逻辑留在 `useAnalyzeDrill.ts`，但不要在多个文件复制同一套规则。

### 1. `shared/analyzeConfigFieldRules.ts`

给 `AnalyzeDimensionFieldRule` 的 `drill` 加一个 `value` 字段：

```ts
export type AnalyzeDimensionFieldRule = {
  drill?: {
    enabled?: boolean
    role?: 'level'
    value?: string | number | boolean | null // 新增
  }
}
```

### 2. `types/store/DimensionStore.d.ts`

- 从 `DimensionState` 中移除 `drillCurrentLevel` 和 `drillPath`
- 保留 `selectedDrillValue`（这是右键菜单的临时 UI 中间态，不持久化）
- 从 getters 中移除 `getDrillCurrentLevel` 和 `getDrillPath`
- 从 actions 中移除 `setDrillCurrentLevel` 和 `setDrillPath`
- 重新定义 `drillDown`、`rollUpTo`、`resetDrill` 的签名（见下方 store 改造）

### 3. `stores/dimensions.ts`

这是改动最大的文件。

重要：不要用 `columnName` 作为唯一定位依据来更新钻取值。推荐让 `drillDown` 接收钻取层级或原数组下标，再通过当前 dimensions 计算目标维度位置。

**移除的状态：**

- `drillCurrentLevel`
- `drillPath`

**移除的 getter：**

- `getDrillCurrentLevel`
- `getDrillPath`

**改造 actions：**

`drillDown(item)` → 改为接收钻取层级和值，直接修改该层维度的 `dimensionRule.drill.value`：

```ts
drillDown(level: number, value: DimensionStore.DrillPathItem['value']) {
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
```

`rollUpTo(level)` → 清空目标层级及之后所有钻取维度的 value：

```ts
rollUpTo(level: number) {
  const drillIndexes = getDrillDimensionIndexes(this.dimensions)
  for (let i = Math.max(0, level); i < drillIndexes.length; i++) {
    const index = drillIndexes[i]
    this.dimensions[index] = setDimensionDrillValue(this.dimensions[index], undefined)
  }
  this.dimensions = normalizeAnalyzeDrillDimensions(this.dimensions)
  this.selectedDrillValue = null
}
```

`resetDrill()` → 清空所有维度的 drill.value：

```ts
resetDrill() {
  let changed = false
  this.dimensions = this.dimensions.map(d => {
    if (d.dimensionRule?.drill?.value != null) {
      changed = true
      return { ...d, dimensionRule: { ...d.dimensionRule, drill: { ...d.dimensionRule.drill, value: undefined } } }
    }
    return d
  })
  this.selectedDrillValue = null
}
```

`resetDimensions()` 不变，它调用 `resetDrill()` 时会自动清空 value。

可在本文件内保留两个局部 helper，或复用 `shared/analyzeDrillState.ts`：

```ts
const setDimensionDrillValue = (
  dimension: DimensionStore.DimensionOption,
  value: DimensionStore.DrillPathItem['value'] | undefined
) => ({
  ...dimension,
  dimensionRule: {
    ...dimension.dimensionRule,
    drill: {
      ...dimension.dimensionRule?.drill,
      value
    }
  }
})
```

### 4. `pages/analyze/useAnalyzeDrill.ts`

将所有钻取相关的导出改为从 dimensions 派生的 computed：

```ts
const drillPath = computed(() => {
  const path: DimensionStore.DrillPathItem[] = []
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

const nextDrillDimension = computed(() => {
  return drillDimensions.value[effectiveDrillLevel.value + 1]
})
```

`drillFilters` computed 保持不变 — 它读的是 `drillPath`，现在 `drillPath` 是 computed 但结构一样。

如果新增了 `shared/analyzeDrillState.ts`，这里应该只负责把纯函数结果包装成 computed，不再重复写钻取层级判断。

### 5. `pages/analyze/useAnalyzeDataHandler.ts`

- 移除 `const activeDrillQueryKey` 和相关的 `getDrillQueryKey()` 逻辑（不再需要单独的钻取 key 追踪，因为钻取变化现在通过 dimensions 变化自然触发 `queryAnalyzeDataParams` 的 watch）
- 移除 `skipParamQueryForDrill` 相关逻辑
- 保留对 `queryAnalyzeDataParams` 的 watch（它会自动捕获 drill.value 变化引起的 computed 更新）
- 保留对维度列表变化的 watch（维度被删除时自动 rollUpTo），但适配新的数据结构
- 维度列表变化 watch 不要再读取 `dimensionStore.getDrillPath`；应基于 `deriveAnalyzeDrillState(dimensions)` 或 `drillPath` computed 判断已有 value 是否仍然连续有效
- 数据源或数据集变化时继续调用 `dimensionStore.resetDrill()`，它会清空 dimensions 中的 `drill.value`

### 6. `pages/analyze/useAnalyzeHandler.ts`

- `applyAnalyzeDetail` 中移除 `dimensionStore.resetDrill()` 调用 — 不再需要，因为 `setDimensions` 已经会把完整的 dimensions（含 drill.value）写入 store
- 注意：如果加载的配置中 dimensions 没有 drill.value（旧数据），行为等同于未钻取，无需特殊处理

### 7. `pages/analyze/components/dimension/index.vue`

- `handleDrillDownFromMenu` 改为传钻取层级和值：`dimensionStore.drillDown(effectiveDrillLevel.value, value)`
- `handleRollUpFromMenu` 改为直接传层级数字：`dimensionStore.rollUpTo(drillIndex)`
- 其余 UI 逻辑不变

### 8. 看板和邮件的消费策略

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

- 如果产品希望邮件也继承保存时的钻取位置，则邮件服务同样复用看板的派生逻辑。
- 不要让邮件“原样传 dimensions”后假装继承，因为 `AnalyzeQueryBuilder` 不会从 `drill.value` 自动生成路径筛选。

## 不要改的文件

- 数据库表结构（不需要加列）
- 分析配置保存/读取相关的后端 Mapper / Service / API（不需要改）
- `AnalyzeQueryBuilder` 不需要理解 `drill.value`，钻取路径应在调用查询前派生成 `dimensions + filters`
- DTO / VO 类型（不需要改）
- `useAnalyzeDraft.ts`（序列化 dimensions 时自动包含 drill.value）
- 图表组件（table-chart、interval-chart 等）
- 右键菜单组件 `components/selector/dimension/index.vue`（交互不变）

## 验证要点

1. 打开一个有多个钻取维度的分析，右键下钻到第二层，保存，刷新页面，确认恢复到钻取后的状态
2. 保存后打开历史版本，确认钻取状态随版本切换
3. 下钻后不保存直接离开页面，确认弹出"未保存改动"提示
4. 删除一个已钻取的维度，确认自动上卷到有效层级
5. 数据源切换，确认钻取状态被重置
6. 看板如果选择继承钻取位置，保存分析后刷新看板，确认 widget 查询和 xAxisFields 都停留在保存的钻取层级
7. 邮件如果选择忽略钻取位置，保存钻取状态后发送邮件，确认邮件图表仍使用完整维度配置而不是钻取后的路径
8. 构造异常 dimensions（中间层没有 value、末层有 value），确认加载或保存后会清理成连续有效路径
