import type {
  FilterAggregationType,
  FilterType,
  MeasureAggregationType,
  OrderAggregationType,
  OrderType
} from '@/shared/domainTypes'

/**
 * 值/度量字段规则。
 *
 * `aggregation` 表示值字段在聚合查询中的默认统计方式。
 */
export type MeasureRule = {
  aggregation?: MeasureAggregationType
}

/**
 * 分组字段规则。
 *
 * `drill` 表示该分组字段在上卷下钻链路中的稳定配置。
 */
export type DimensionRule = {
  drill?: {
    enabled?: boolean
    role?: 'level'
  }
}

/**
 * 筛选字段规则。
 *
 * `operator` 表示筛选操作符，`operand` 表示右侧操作数，`aggregation` 表示筛选作用于原始字段还是聚合表达式。
 */
export type FilterRule = {
  operator?: FilterType
  operand?: string
  aggregation?: FilterAggregationType
}

/**
 * 排序字段规则。
 *
 * `direction` 表示升降序，`aggregation` 表示排序作用于原始字段还是聚合表达式。
 */
export type OrderRule = {
  direction: OrderType
  aggregation?: OrderAggregationType
}

/**
 * 创建默认值字段规则所需的字段信息。
 */
type MeasureRuleSource = {
  columnType?: string
  fieldRole?: 'dimension' | 'metric'
}

/**
 * 判断字段类型是否属于数值类型。
 * @param {string} [columnType] 数据库字段类型。
 * @returns {boolean} 如果字段类型可按数值聚合则返回 true。
 */
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

/**
 * 设置值字段聚合方式。
 * @param {MeasureRule} rule 原值字段规则。
 * @param {MeasureAggregationType} aggregation 新的值字段聚合方式。
 * @returns {MeasureRule} 更新后的值字段规则。
 */
export const setMeasureRuleAggregation = (rule: MeasureRule, aggregation: MeasureAggregationType): MeasureRule => ({
  ...rule,
  aggregation
})

/**
 * 创建默认值字段规则。
 *
 * metric 或数值字段默认求和，非数值字段默认计数。
 * @param {MeasureRuleSource} field 用于判断默认聚合方式的字段信息。
 * @returns {MeasureRule} 默认值字段规则。
 */
export const createDefaultMeasureRule = (field: MeasureRuleSource): MeasureRule => ({
  aggregation: field.fieldRole === 'metric' || isNumericColumnType(field.columnType) ? 'sum' : 'count'
})

/**
 * 创建默认分组字段规则。
 *
 * 默认分组字段参与层级上卷下钻。
 * @returns {DimensionRule} 默认分组字段规则。
 */
export const createDefaultDimensionRule = (): DimensionRule => ({
  drill: {
    enabled: true,
    role: 'level'
  }
})

/**
 * 创建默认筛选字段规则。
 *
 * 筛选默认作用于原始字段，操作数默认为空字符串，操作符由筛选面板打开时按字段类型补齐。
 * @returns {FilterRule} 默认筛选字段规则。
 */
export const createDefaultFilterRule = (): FilterRule => ({
  aggregation: 'raw',
  operand: ''
})

/**
 * 克隆筛选字段规则。
 * @param {FilterRule} rule 原筛选字段规则。
 * @returns {FilterRule} 浅克隆后的筛选字段规则。
 */
export const createFilterRule = (rule: FilterRule): FilterRule => ({ ...rule })

/**
 * 补齐筛选面板编辑所需的默认规则字段。
 * @param {FilterRule} rule 原筛选字段规则。
 * @param {FilterType} [defaultOperator] 按字段类型推导出的默认筛选操作符。
 * @returns {FilterRule} 已补齐聚合方式和操作符的筛选字段规则。
 */
export const prepareFilterRule = (rule: FilterRule, defaultOperator?: FilterType): FilterRule => ({
  ...rule,
  aggregation: rule.aggregation || 'raw',
  operator: rule.operator || defaultOperator
})

/**
 * 设置筛选字段聚合方式。
 * @param {FilterRule} rule 原筛选字段规则。
 * @param {FilterAggregationType} aggregation 新的筛选聚合方式。
 * @returns {FilterRule} 更新后的筛选字段规则。
 */
export const setFilterRuleAggregation = (rule: FilterRule, aggregation: FilterAggregationType): FilterRule => ({
  ...rule,
  aggregation
})

/**
 * 创建默认排序字段规则。
 *
 * 排序默认按原始值降序排列。
 * @returns {OrderRule} 默认排序字段规则。
 */
export const createDefaultOrderRule = (): OrderRule => ({
  direction: 'desc',
  aggregation: 'raw'
})

/**
 * 切换排序方向。
 *
 * 切换方向时保持排序作用于原始字段。
 * @param {OrderRule} rule 原排序字段规则。
 * @returns {OrderRule} 切换方向后的排序字段规则。
 */
export const toggleOrderRuleDirection = (rule: OrderRule): OrderRule => ({
  ...rule,
  direction: rule.direction === 'desc' ? 'asc' : 'desc',
  aggregation: 'raw'
})

/**
 * 设置排序字段聚合方式。
 * @param {OrderRule} rule 原排序字段规则。
 * @param {OrderAggregationType} aggregation 新的排序聚合方式。
 * @returns {OrderRule} 更新后的排序字段规则。
 */
export const setOrderRuleAggregation = (rule: OrderRule, aggregation: OrderAggregationType): OrderRule => ({
  ...rule,
  direction: rule.direction || 'desc',
  aggregation
})
