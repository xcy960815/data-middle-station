import type {
  AnalyzeFilterAggregationType,
  AnalyzeFilterOperator,
  AnalyzeMeasureAggregationType,
  AnalyzeOrderAggregationType,
  AnalyzeOrderDirection
} from '@/shared/analyzeConfigTypes'

/**
 * 值/度量字段规则。
 *
 * `aggregation` 表示值字段在聚合查询中的默认统计方式。
 */
export type AnalyzeMeasureFieldRule = {
  aggregation?: AnalyzeMeasureAggregationType
}

/**
 * 分组字段规则。
 *
 * `drill` 表示该分组字段在上卷下钻链路中的稳定配置。
 */
export type AnalyzeDimensionFieldRule = {
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
export type AnalyzeFilterFieldRule = {
  operator?: AnalyzeFilterOperator
  operand?: string
  aggregation?: AnalyzeFilterAggregationType
}

/**
 * 排序字段规则。
 *
 * `direction` 表示升降序，`aggregation` 表示排序作用于原始字段还是聚合表达式。
 */
export type AnalyzeOrderFieldRule = {
  direction: AnalyzeOrderDirection
  aggregation?: AnalyzeOrderAggregationType
}

/**
 * 创建默认值字段规则所需的字段信息。
 */
type AnalyzeMeasureFieldRuleSource = {
  columnType?: string
  fieldRole?: 'dimension' | 'metric'
}

/**
 * 判断字段类型是否属于数值类型。
 * @param {string} [columnType] 数据库字段类型。
 * @returns {boolean} 如果字段类型可按数值聚合则返回 true。
 */
const isNumericDatabaseColumnType = (columnType?: string) => {
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
 * @param {AnalyzeMeasureFieldRule} rule 原值字段规则。
 * @param {AnalyzeMeasureAggregationType} aggregation 新的值字段聚合方式。
 * @returns {AnalyzeMeasureFieldRule} 更新后的值字段规则。
 */
export const setAnalyzeMeasureFieldAggregation = (
  rule: AnalyzeMeasureFieldRule,
  aggregation: AnalyzeMeasureAggregationType
): AnalyzeMeasureFieldRule => ({
  ...rule,
  aggregation
})

/**
 * 创建默认值字段规则。
 *
 * metric 或数值字段默认求和，非数值字段默认计数。
 * @param {AnalyzeMeasureFieldRuleSource} field 用于判断默认聚合方式的字段信息。
 * @returns {AnalyzeMeasureFieldRule} 默认值字段规则。
 */
export const createDefaultAnalyzeMeasureFieldRule = (
  field: AnalyzeMeasureFieldRuleSource
): AnalyzeMeasureFieldRule => ({
  aggregation: field.fieldRole === 'metric' || isNumericDatabaseColumnType(field.columnType) ? 'sum' : 'count'
})

/**
 * 创建默认分组字段规则。
 *
 * 默认分组字段参与层级上卷下钻。
 * @returns {AnalyzeDimensionFieldRule} 默认分组字段规则。
 */
export const createDefaultAnalyzeDimensionFieldRule = (): AnalyzeDimensionFieldRule => ({
  drill: {
    enabled: true,
    role: 'level'
  }
})

/**
 * 创建默认筛选字段规则。
 *
 * 筛选默认作用于原始字段，操作数默认为空字符串，操作符由筛选面板打开时按字段类型补齐。
 * @returns {AnalyzeFilterFieldRule} 默认筛选字段规则。
 */
export const createDefaultAnalyzeFilterFieldRule = (): AnalyzeFilterFieldRule => ({
  aggregation: 'raw',
  operand: ''
})

/**
 * 克隆筛选字段规则。
 * @param {AnalyzeFilterFieldRule} rule 原筛选字段规则。
 * @returns {AnalyzeFilterFieldRule} 浅克隆后的筛选字段规则。
 */
export const cloneAnalyzeFilterFieldRule = (rule: AnalyzeFilterFieldRule): AnalyzeFilterFieldRule => ({ ...rule })

/**
 * 补齐筛选面板编辑所需的默认规则字段。
 * @param {AnalyzeFilterFieldRule} rule 原筛选字段规则。
 * @param {AnalyzeFilterOperator} [defaultOperator] 按字段类型推导出的默认筛选操作符。
 * @returns {AnalyzeFilterFieldRule} 已补齐聚合方式和操作符的筛选字段规则。
 */
export const prepareAnalyzeFilterFieldRuleForEdit = (
  rule: AnalyzeFilterFieldRule,
  defaultOperator?: AnalyzeFilterOperator
): AnalyzeFilterFieldRule => ({
  ...rule,
  aggregation: rule.aggregation || 'raw',
  operator: rule.operator || defaultOperator
})

/**
 * 设置筛选字段聚合方式。
 * @param {AnalyzeFilterFieldRule} rule 原筛选字段规则。
 * @param {AnalyzeFilterAggregationType} aggregation 新的筛选聚合方式。
 * @returns {AnalyzeFilterFieldRule} 更新后的筛选字段规则。
 */
export const setAnalyzeFilterFieldAggregation = (
  rule: AnalyzeFilterFieldRule,
  aggregation: AnalyzeFilterAggregationType
): AnalyzeFilterFieldRule => ({
  ...rule,
  aggregation
})

/**
 * 创建默认排序字段规则。
 *
 * 排序默认按原始值降序排列。
 * @returns {AnalyzeOrderFieldRule} 默认排序字段规则。
 */
export const createDefaultAnalyzeOrderFieldRule = (): AnalyzeOrderFieldRule => ({
  direction: 'desc',
  aggregation: 'raw'
})

/**
 * 切换排序方向。
 *
 * 切换方向时保持排序作用于原始字段。
 * @param {AnalyzeOrderFieldRule} rule 原排序字段规则。
 * @returns {AnalyzeOrderFieldRule} 切换方向后的排序字段规则。
 */
export const toggleAnalyzeOrderFieldDirection = (rule: AnalyzeOrderFieldRule): AnalyzeOrderFieldRule => ({
  ...rule,
  direction: rule.direction === 'desc' ? 'asc' : 'desc',
  aggregation: 'raw'
})

/**
 * 设置排序字段聚合方式。
 * @param {AnalyzeOrderFieldRule} rule 原排序字段规则。
 * @param {AnalyzeOrderAggregationType} aggregation 新的排序聚合方式。
 * @returns {AnalyzeOrderFieldRule} 更新后的排序字段规则。
 */
export const setAnalyzeOrderFieldAggregation = (
  rule: AnalyzeOrderFieldRule,
  aggregation: AnalyzeOrderAggregationType
): AnalyzeOrderFieldRule => ({
  ...rule,
  direction: rule.direction || 'desc',
  aggregation
})
