# DimensionRule 未来设计记录

## 背景

当前分析配置已经把分组字段收拢为 `DimensionOption`：

```ts
type DimensionOption = ColumnItem & {
  dimensionRule: DimensionRule
}
```

但当前 `dimensionRule` 默认仍是空对象：

```ts
type DimensionRule = {}
```

它目前只是为后续分组行为扩展预留结构，查询逻辑暂不消费该字段。

## 设计原则

`dimensionRule` 应描述“分组字段自身的稳定配置”，不应保存一次用户交互产生的临时运行态。

适合放进 `dimensionRule` 的内容：

- 字段是否参与下钻
- 字段在分组行为中的能力开关
- 日期字段的分组粒度
- 数值字段的分桶规则
- 层级维度的业务语义

不适合放进 `dimensionRule` 的内容：

- 当前钻到第几层
- 当前下钻路径
- 当前选中的下钻值
- 用户本次查询过程中的临时状态

这些运行态仍应保留在 `dimensionStore` 或专门的 composable 中。

## 上卷下钻

当前下钻能力主要依赖 `dimensions` 数组顺序和运行态：

- `dimensions` 顺序决定下钻层级顺序
- `drillCurrentLevel` 表示当前查询层级
- `drillPath` 保存已经选择的路径值
- `selectedDrillValue` 保存当前待下钻的值

未来可以把“是否参与下钻”这类稳定配置放入 `dimensionRule`：

```ts
type DimensionRule = {
  drill?: {
    enabled?: boolean
  }
}
```

示例：

```json
{
  "columnName": "province",
  "dimensionRule": {
    "drill": {
      "enabled": true
    }
  }
}
```

不建议把当前运行态放入 `dimensionRule`：

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

原因是这类字段描述的是用户当前交互过程，不是分析配置本身。保存到配置后会造成历史配置、看板复用和邮件渲染时语义混乱。

如果后续支持“某些分组不参与下钻”，可以由查询层根据 `dimensionRule.drill.enabled` 过滤有效下钻链路。若所有分组默认都参与下钻，则可以继续保持 `dimensionRule: {}`，不必为了配置而配置。

## 日期粒度分组

日期粒度分组用于把日期或时间字段按指定粒度聚合，而不是按完整时间戳分组。

可选设计：

```ts
type DimensionRule = {
  dateGranularity?: 'year' | 'quarter' | 'month' | 'week' | 'day' | 'hour'
}
```

示例：

```json
{
  "columnName": "create_time",
  "dimensionRule": {
    "dateGranularity": "month"
  }
}
```

查询语义示例：

- `create_time` 按月分组
- SQL 侧可转换为 `DATE_FORMAT(create_time, '%Y-%m')`
- 图表展示可显示为 `2026-06`

该能力适用于订单时间、创建时间、支付时间、访问时间等字段。

## 数值分桶

数值分桶用于把连续数值按区间聚合。

可选设计：

```ts
type DimensionRule = {
  bucket?: {
    size: number
    start?: number
    end?: number
  }
}
```

示例：

```json
{
  "columnName": "amount",
  "dimensionRule": {
    "bucket": {
      "size": 100
    }
  }
}
```

查询语义示例：

- `amount` 按 100 元一档分组
- 展示为 `0-99`、`100-199`、`200-299`

该能力适用于金额、年龄、分数、时长、次数等连续数值字段。

## 层级维度

层级维度用于表达字段背后的业务层级，例如地区、组织、品类。

可选设计：

```ts
type DimensionRule = {
  hierarchy?: {
    group: string
    level: string
  }
}
```

示例：

```json
{
  "columnName": "province",
  "dimensionRule": {
    "hierarchy": {
      "group": "region",
      "level": "province"
    }
  }
}
```

查询和交互语义示例：

- `region / country`
- `region / province`
- `region / city`

该能力适用于：

- 地区：国家、省、市、区县
- 组织：集团、事业部、部门、小组
- 品类：一级类目、二级类目、三级类目

## 后续落地建议

1. 先保持 `dimensionRule` 为空对象，不为当前没有消费的能力提前写入配置。
2. 当产品明确需要“某些分组不参与下钻”时，优先增加 `dimensionRule.drill.enabled`。
3. 日期粒度、数值分桶、层级维度应分别配套 UI、查询构造、返回字段命名和保存结构，不应只改类型。
4. `drillPath`、`drillCurrentLevel`、`selectedDrillValue` 仍作为运行态保留，不写入持久化配置。
5. 如果未来同时支持多种分组规则，查询构造器应集中解释 `dimensionRule`，不要把 SQL 语义散落在组件中。
