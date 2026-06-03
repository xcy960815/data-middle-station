export const RESOURCE_TYPES = ['analyze', 'dashboard', 'datasource', 'dataset', 'folder', 'scheduled_email'] as const

export type ResourceType = (typeof RESOURCE_TYPES)[number]

export const RESOURCE_PERMISSION_TYPES = ['none', 'view', 'edit', 'manage'] as const

export type ResourcePermissionType = (typeof RESOURCE_PERMISSION_TYPES)[number]

export const ANALYZE_PERMISSION_TYPES = RESOURCE_PERMISSION_TYPES

export type AnalyzePermissionType = ResourcePermissionType

export const CHART_TYPE_MAP = {
  table: 'table',
  line: 'line',
  pie: 'pie',
  interval: 'interval'
} as const

export type ChartType = (typeof CHART_TYPE_MAP)[keyof typeof CHART_TYPE_MAP]

export const FILTER_AGGREGATION_MAP = {
  原始值: 'raw',
  计数: 'count',
  计数去重: 'countDistinct',
  总计: 'sum',
  平均: 'avg',
  最大值: 'max',
  最小值: 'min'
} as const

export type FilterAggregationType = (typeof FILTER_AGGREGATION_MAP)[keyof typeof FILTER_AGGREGATION_MAP]

export const FILTER_TYPE_MAP = {
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

export type FilterType = (typeof FILTER_TYPE_MAP)[keyof typeof FILTER_TYPE_MAP]

export const ORDER_TYPE_MAP = {
  升序: 'asc',
  降序: 'desc'
} as const

export type OrderType = (typeof ORDER_TYPE_MAP)[keyof typeof ORDER_TYPE_MAP]

export const ORDER_AGGREGATION_MAP = {
  原始值: 'raw',
  计数: 'count',
  总计: 'sum',
  平均: 'avg',
  最大值: 'max',
  最小值: 'min'
} as const

export type OrderAggregationType = (typeof ORDER_AGGREGATION_MAP)[keyof typeof ORDER_AGGREGATION_MAP]
