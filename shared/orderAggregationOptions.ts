type OrderAggregationType = AnalyzeConfigDao.OrderAggregationsType

type OrderAggregationOption = {
  label: string
  value: OrderAggregationType
}

const ORDER_AGGREGATION_OPTIONS: OrderAggregationOption[] = [
  { label: '原始值', value: 'raw' },
  { label: '计数', value: 'count' },
  { label: '计数(去重)', value: 'countDistinct' },
  { label: '总计', value: 'sum' },
  { label: '平均', value: 'avg' },
  { label: '最大值', value: 'max' },
  { label: '最小值', value: 'min' }
]

const NUMERIC_COLUMN_TYPES = [
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

const DATE_COLUMN_TYPES = ['date', 'time', 'year']

export const getOrderAggregationOptions = (columnType = '', includeRaw = true): OrderAggregationOption[] => {
  const normalizedColumnType = columnType.toLowerCase()
  const baseValues: OrderAggregationType[] = includeRaw ? ['raw', 'count', 'countDistinct'] : ['count', 'countDistinct']

  if (NUMERIC_COLUMN_TYPES.some((type) => normalizedColumnType.includes(type))) {
    return ORDER_AGGREGATION_OPTIONS.filter((item) => includeRaw || item.value !== 'raw')
  }

  if (DATE_COLUMN_TYPES.some((type) => normalizedColumnType.includes(type))) {
    return ORDER_AGGREGATION_OPTIONS.filter((item) => [...baseValues, 'max', 'min'].includes(item.value))
  }

  return ORDER_AGGREGATION_OPTIONS.filter((item) => baseValues.includes(item.value))
}

export const getOrderAggregationLabel = (aggregationType?: OrderAggregationType) => {
  return ORDER_AGGREGATION_OPTIONS.find((item) => item.value === aggregationType)?.label || '原始值'
}
