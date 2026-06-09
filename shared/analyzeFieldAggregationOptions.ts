import type { AnalyzeFilterAggregationType, AnalyzeOrderAggregationType } from '@/shared/analyzeConfigTypes'

type AnalyzeFieldAggregationOption = {
  label: string
  value: AnalyzeFilterAggregationType | AnalyzeOrderAggregationType
}

const ANALYZE_FIELD_AGGREGATION_OPTIONS: AnalyzeFieldAggregationOption[] = [
  { label: '原始值', value: 'raw' },
  { label: '计数', value: 'count' },
  { label: '计数(去重)', value: 'countDistinct' },
  { label: '总计', value: 'sum' },
  { label: '平均', value: 'avg' },
  { label: '最大值', value: 'max' },
  { label: '最小值', value: 'min' }
]

const NUMERIC_DATABASE_COLUMN_TYPE_KEYWORDS = [
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
]

const DATE_DATABASE_COLUMN_TYPE_KEYWORDS = ['date', 'time', 'year']

export const getAnalyzeFieldAggregationOptions = (
  columnType = '',
  includeRaw = true
): AnalyzeFieldAggregationOption[] => {
  const normalizedColumnType = columnType.toLowerCase()
  const baseValues: Array<AnalyzeFilterAggregationType | AnalyzeOrderAggregationType> = includeRaw
    ? ['raw', 'count', 'countDistinct']
    : ['count', 'countDistinct']

  if (NUMERIC_DATABASE_COLUMN_TYPE_KEYWORDS.some((type) => normalizedColumnType.includes(type))) {
    return ANALYZE_FIELD_AGGREGATION_OPTIONS.filter((item) => includeRaw || item.value !== 'raw')
  }

  if (DATE_DATABASE_COLUMN_TYPE_KEYWORDS.some((type) => normalizedColumnType.includes(type))) {
    return ANALYZE_FIELD_AGGREGATION_OPTIONS.filter((item) => [...baseValues, 'max', 'min'].includes(item.value))
  }

  return ANALYZE_FIELD_AGGREGATION_OPTIONS.filter((item) => baseValues.includes(item.value))
}

export const getAnalyzeFieldAggregationLabel = (
  aggregationType?: AnalyzeFilterAggregationType | AnalyzeOrderAggregationType
) => {
  return ANALYZE_FIELD_AGGREGATION_OPTIONS.find((item) => item.value === aggregationType)?.label || '原始值'
}
