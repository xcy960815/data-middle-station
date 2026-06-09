# 分析页上卷下钻状态设计记录

> **状态：已废弃** — 本文档的结论已被 `analyze-drill-persistence-design.md` 取代。新需求明确要求将钻取状态持久化到 `dimensions` 数组中，详见新文档。

## 背景

当前正在做分析页 `dimension` 上卷下钻能力收拢。已有字段规则收拢方向是：

- `measures` 保存值字段数组，每个字段通过 `measureRule` 表达值字段行为。
- `dimensions` 保存分组字段数组，每个字段通过 `dimensionRule` 表达分组字段行为。
- `filters` 保存筛选字段数组，每个字段通过 `filterRule` 表达筛选行为。
- `orders` 保存排序字段数组，每个字段通过 `orderRule` 表达排序行为。

这四类分析配置都应保持数组结构，避免 `dimensions` 变成特殊结构，也避免为了上卷下钻单独破坏现有配置形态。

## 用户需求

希望上卷下钻能力和现有分析配置结构保持一致：

1. `dimensions`、`orders`、`filters`、`measures` 都是数组。
2. `dimensions` 中的每个字段只保存分组字段自己的稳定规则。
3. 用户执行下钻操作后，目前下钻路径没有保存到数据库，需要明确是否应该保存，以及应该保存在哪里。
4. 设计不能让分析配置、看板复用、邮件渲染的语义变混乱。

## 设计结论

分析定义和用户当前操作状态应分开保存。

`analyze_config` 只保存稳定分析配置：

- `dimensions`
- `measures`
- `filters`
- `orders`
- `chartType`
- `commonChartConfig`
- `privateChartConfig`

用户本次交互产生的下钻状态不应写入 `analyze_config.dimensions`，也不应混入 `analyze_config.filters`。

## Dimension 持久化结构

`dimensions` 继续保持数组，每个元素保存字段元信息和稳定分组规则：

```json
{
  "dimensions": [
    {
      "columnName": "province",
      "displayName": "省份",
      "dimensionRule": {
        "drill": {
          "enabled": true,
          "role": "level"
        }
      }
    },
    {
      "columnName": "city",
      "displayName": "城市",
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

这表示当前分析支持按 `province -> city` 的顺序下钻。它是分析能力配置，应保存到数据库。

## 不写入分析配置的运行态

下面这些状态描述的是某个用户当前操作到了哪里，不是分析定义本身：

- 当前钻到第几层。
- 当前下钻路径。
- 当前选中的下钻值。

不建议保存成：

```json
{
  "dimensionRule": {
    "drillCurrentLevel": 1,
    "drillPath": [
      {
        "columnName": "province",
        "value": "浙江"
      }
    ],
    "selectedDrillValue": "杭州"
  }
}
```

原因：

1. 保存到分析配置后，下一次打开分析会默认停在上一个用户的操作路径。
2. 看板复用该分析时，会继承编辑页的一次性钻取路径。
3. 邮件渲染时会误以为下钻路径是分析定义的一部分。
4. 历史版本会混入大量用户交互噪音，难以判断真实配置变化。

## 查询时的派生结构

前端查询接口仍然可以保持数组形态。

当用户位于第一层时，请求参数可以是：

```json
{
  "dimensions": [
    {
      "columnName": "province"
    }
  ],
  "filters": []
}
```

当用户从 `province=浙江` 下钻到 `city` 时，请求参数临时派生为：

```json
{
  "dimensions": [
    {
      "columnName": "city"
    }
  ],
  "filters": [
    {
      "columnName": "province",
      "filterRule": {
        "operator": "eq",
        "operand": "浙江",
        "aggregation": "raw"
      }
    }
  ]
}
```

这里的 `filters` 只是本次查询参数中的派生筛选，不写回 `analyze_config.filters`。

## 推荐运行态结构

当前可以继续保留在 `dimensionStore` 或 `useAnalyzeDrill` 中：

```ts
type AnalyzeDrillState = {
  currentLevel: number
  path: Array<{
    dimensionColumnName: string
    value: string | number | boolean | null
  }>
  selectedValue?: string | number | boolean | null
}
```

它可以用于页面交互、查询参数派生和上卷下钻按钮状态判断。

## 如果未来需要保存用户下钻位置

如果后续产品明确要求“记住某个用户上次钻到哪里”，建议单独保存为视图状态，而不是写入分析配置。

可选方案：

1. 前端本地缓存：适合只影响当前浏览器的体验。
2. 用户级视图状态表：适合跨设备恢复。

示例结构：

```json
{
  "analyzeId": 105,
  "userId": 1,
  "drillState": {
    "path": [
      {
        "dimensionColumnName": "province",
        "value": "浙江"
      }
    ]
  }
}
```

这类状态应被命名为 `viewState` 或 `drillState`，不要进入 `analyze_config`。

## 当前落地原则

1. `dimensions / measures / filters / orders` 都保持数组。
2. `dimensionRule.drill` 只保存字段是否参与下钻、字段角色等稳定配置。
3. 用户下钻路径只作为运行态参与查询参数派生，不写入分析配置历史。
4. 如果未来要持久化用户操作位置，单独设计用户级视图状态，不污染分析定义。
