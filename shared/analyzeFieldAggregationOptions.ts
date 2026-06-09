import {
  ANALYZE_NUMERIC_DATABASE_COLUMN_TYPE_KEYWORDS,
  type AnalyzeFilterAggregationType,
  type AnalyzeOrderAggregationType
} from '@/shared/analyzeConfigTypes'

/**
 * @desc 分析字段聚合选项，用于筛选和排序面板。
 */
type AnalyzeFieldAggregationOption = {
  label: string
  value: AnalyzeFilterAggregationType | AnalyzeOrderAggregationType
}

/**
 * @desc 分析字段聚合方式下拉选项。
 */
const ANALYZE_FIELD_AGGREGATION_OPTIONS: AnalyzeFieldAggregationOption[] = [
  { label: '原始值', value: 'raw' },
  { label: '计数', value: 'count' },
  { label: '计数(去重)', value: 'countDistinct' },
  { label: '总计', value: 'sum' },
  { label: '平均', value: 'avg' },
  { label: '最大值', value: 'max' },
  { label: '最小值', value: 'min' }
]

/**
 * @desc 可按日期字段处理的数据库字段类型关键词。
 */
const DATE_DATABASE_COLUMN_TYPE_KEYWORDS = ['date', 'time', 'year']

/**
 * @desc 根据数据库字段类型返回可选聚合方式。
 * @param {string} [columnType=''] 数据库字段类型。
 * @param {boolean} [includeRaw=true] 是否包含原始值选项。
 * @returns {AnalyzeFieldAggregationOption[]} 可用于下拉选择的聚合方式选项。
 */
export const getAnalyzeFieldAggregationOptions = (
  columnType = '',
  includeRaw = true
): AnalyzeFieldAggregationOption[] => {
  const normalizedColumnType = columnType.toLowerCase()
  const baseValues: Array<AnalyzeFilterAggregationType | AnalyzeOrderAggregationType> = includeRaw
    ? ['raw', 'count', 'countDistinct']
    : ['count', 'countDistinct']

  if (ANALYZE_NUMERIC_DATABASE_COLUMN_TYPE_KEYWORDS.some((type) => normalizedColumnType.includes(type))) {
    return ANALYZE_FIELD_AGGREGATION_OPTIONS.filter((item) => includeRaw || item.value !== 'raw')
  }

  if (DATE_DATABASE_COLUMN_TYPE_KEYWORDS.some((type) => normalizedColumnType.includes(type))) {
    return ANALYZE_FIELD_AGGREGATION_OPTIONS.filter((item) => [...baseValues, 'max', 'min'].includes(item.value))
  }

  return ANALYZE_FIELD_AGGREGATION_OPTIONS.filter((item) => baseValues.includes(item.value))
}

/**
 * @desc 获取分析字段聚合方式的展示文案。
 * @param {AnalyzeFilterAggregationType | AnalyzeOrderAggregationType} [aggregationType] 聚合方式值。
 * @returns {string} 聚合方式中文文案。
 */
export const getAnalyzeFieldAggregationLabel = (
  aggregationType?: AnalyzeFilterAggregationType | AnalyzeOrderAggregationType
) => {
  return ANALYZE_FIELD_AGGREGATION_OPTIONS.find((item) => item.value === aggregationType)?.label || '原始值'
}
