export const ANALYZE_CHART_TYPE_MAP = {
  table: 'table',
  line: 'line',
  pie: 'pie',
  interval: 'interval'
} as const

export type AnalyzeChartType = (typeof ANALYZE_CHART_TYPE_MAP)[keyof typeof ANALYZE_CHART_TYPE_MAP]

export const ANALYZE_FILTER_AGGREGATION_MAP = {
  原始值: 'raw',
  计数: 'count',
  计数去重: 'countDistinct',
  总计: 'sum',
  平均: 'avg',
  最大值: 'max',
  最小值: 'min'
} as const

export type AnalyzeFilterAggregationType =
  (typeof ANALYZE_FILTER_AGGREGATION_MAP)[keyof typeof ANALYZE_FILTER_AGGREGATION_MAP]

export const ANALYZE_FILTER_OPERATOR_MAP = {
  等于: 'eq',
  不等于: 'neq',
  大于: 'gt',
  大于等于: 'gte',
  小于: 'lt',
  小于等于: 'lte',
  包含: 'like',
  不包含: 'notLike',
  为空: 'isNull',
  不为空: 'isNotNull'
} as const

export type AnalyzeFilterOperator = (typeof ANALYZE_FILTER_OPERATOR_MAP)[keyof typeof ANALYZE_FILTER_OPERATOR_MAP]

export const ANALYZE_ORDER_DIRECTION_MAP = {
  升序: 'asc',
  降序: 'desc'
} as const

export type AnalyzeOrderDirection = (typeof ANALYZE_ORDER_DIRECTION_MAP)[keyof typeof ANALYZE_ORDER_DIRECTION_MAP]

export const ANALYZE_MEASURE_AGGREGATION_MAP = {
  计数: 'count',
  计数去重: 'countDistinct',
  总计: 'sum',
  平均: 'avg',
  最大值: 'max',
  最小值: 'min'
} as const

export type AnalyzeMeasureAggregationType =
  (typeof ANALYZE_MEASURE_AGGREGATION_MAP)[keyof typeof ANALYZE_MEASURE_AGGREGATION_MAP]

export const ANALYZE_ORDER_AGGREGATION_MAP = {
  原始值: 'raw',
  计数: 'count',
  计数去重: 'countDistinct',
  总计: 'sum',
  平均: 'avg',
  最大值: 'max',
  最小值: 'min'
} as const

export type AnalyzeOrderAggregationType =
  (typeof ANALYZE_ORDER_AGGREGATION_MAP)[keyof typeof ANALYZE_ORDER_AGGREGATION_MAP]
