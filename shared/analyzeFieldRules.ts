import type {
  FilterAggregationType,
  FilterType,
  MeasureAggregationType,
  OrderAggregationType,
  OrderType
} from '@/shared/domainTypes'

export type MeasureRule = {
  aggregation?: MeasureAggregationType
}

export type DimensionRule = {}

export type FilterRule = {
  operator?: FilterType
  operand?: string
  aggregation?: FilterAggregationType
}

export type OrderRule = {
  direction: OrderType
  aggregation?: OrderAggregationType
}

type MeasureRuleSource = {
  columnType?: string
  datasetFieldType?: 'dimension' | 'metric'
  datasetAggregationType?: MeasureAggregationType
}

const isNumericColumnType = (columnType?: string) => {
  const normalizedColumnType = columnType?.toLowerCase() || ''
  return [
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
  ].some((type) => normalizedColumnType.includes(type))
}

export const setMeasureRuleAggregation = (rule: MeasureRule, aggregation: MeasureAggregationType): MeasureRule => ({
  ...rule,
  aggregation
})

/**
 * 创建一个默认的 值 的规则
 * @param {MeasureRuleSource} field
 * @returns {MeasureRule}
 */
export const createDefaultMeasureRule = (field: MeasureRuleSource): MeasureRule => ({
  aggregation:
    field.datasetAggregationType ||
    (field.datasetFieldType === 'metric' || isNumericColumnType(field.columnType) ? 'sum' : 'count')
})

/**
 * 创建一个默认的 分组 的规则
 * @returns
 */
export const createDefaultDimensionRule = (): DimensionRule => ({})

/**
 * 创建一个默认过滤规则
 * @returns {FilterRule}
 */
export const createDefaultFilterRule = (): FilterRule => ({
  aggregation: 'raw',
  operand: ''
})

export const createFilterRule = (rule: FilterRule): FilterRule => ({ ...rule })

export const prepareFilterRule = (rule: FilterRule, defaultOperator?: FilterType): FilterRule => ({
  ...rule,
  aggregation: rule.aggregation || 'raw',
  operator: rule.operator || defaultOperator
})

export const setFilterRuleAggregation = (rule: FilterRule, aggregation: FilterAggregationType): FilterRule => ({
  ...rule,
  aggregation
})

/**
 * 创建默认的排序规则配置
 * @returns {OrderRule}
 */
export const createDefaultOrderRule = (): OrderRule => ({
  direction: 'desc',
  aggregation: 'raw'
})

export const toggleOrderRuleDirection = (rule: OrderRule): OrderRule => ({
  ...rule,
  direction: rule.direction === 'desc' ? 'asc' : 'desc',
  aggregation: 'raw'
})

export const setOrderRuleAggregation = (rule: OrderRule, aggregation: OrderAggregationType): OrderRule => ({
  ...rule,
  direction: rule.direction || 'desc',
  aggregation
})
