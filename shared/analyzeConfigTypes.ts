/**
 * @desc 筛选字段支持的聚合方式常量映射。
 */
export const ANALYZE_FILTER_AGGREGATION_MAP = {
  原始值: 'raw',
  计数: 'count',
  计数去重: 'countDistinct',
  总计: 'sum',
  平均: 'avg',
  最大值: 'max',
  最小值: 'min'
} as const

/**
 * @desc 筛选字段聚合方式。
 */
export type AnalyzeFilterAggregationType =
  (typeof ANALYZE_FILTER_AGGREGATION_MAP)[keyof typeof ANALYZE_FILTER_AGGREGATION_MAP]

/**
 * @desc 筛选字段支持的操作符常量映射。
 */
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

/**
 * @desc 筛选字段操作符。
 */
export type AnalyzeFilterOperator = (typeof ANALYZE_FILTER_OPERATOR_MAP)[keyof typeof ANALYZE_FILTER_OPERATOR_MAP]

/**
 * @desc 排序方向常量映射。
 */
export const ANALYZE_ORDER_DIRECTION_MAP = {
  升序: 'asc',
  降序: 'desc'
} as const

/**
 * @desc 排序方向。
 */
export type AnalyzeOrderDirection = (typeof ANALYZE_ORDER_DIRECTION_MAP)[keyof typeof ANALYZE_ORDER_DIRECTION_MAP]

/**
 * @desc 值/度量字段支持的聚合方式常量映射。
 */
export const ANALYZE_MEASURE_AGGREGATION_MAP = {
  计数: 'count',
  计数去重: 'countDistinct',
  总计: 'sum',
  平均: 'avg',
  最大值: 'max',
  最小值: 'min'
} as const

/**
 * @desc 值/度量字段聚合方式。
 */
export type AnalyzeMeasureAggregationType =
  (typeof ANALYZE_MEASURE_AGGREGATION_MAP)[keyof typeof ANALYZE_MEASURE_AGGREGATION_MAP]

/**
 * @desc 排序字段支持的聚合方式常量映射。
 */
export const ANALYZE_ORDER_AGGREGATION_MAP = {
  原始值: 'raw',
  计数: 'count',
  计数去重: 'countDistinct',
  总计: 'sum',
  平均: 'avg',
  最大值: 'max',
  最小值: 'min'
} as const

/**
 * @desc 排序字段聚合方式。
 */
export type AnalyzeOrderAggregationType =
  (typeof ANALYZE_ORDER_AGGREGATION_MAP)[keyof typeof ANALYZE_ORDER_AGGREGATION_MAP]

/**
 * @desc 可按数值字段处理的数据库字段类型关键词。
 */
export const ANALYZE_NUMERIC_DATABASE_COLUMN_TYPE_KEYWORDS = [
  'int',
  'integer',
  'float',
  'double',
  'decimal',
  'numeric',
  'real',
  'tinyint',
  'smallint',
  'bigint',
  'number'
] as const
