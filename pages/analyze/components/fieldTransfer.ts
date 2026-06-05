import { createDefaultDimensionGrouping } from '@/shared/dimensionGrouping'

type AnalyzeFieldRole = 'measures' | 'dimensions'

type AnalyzeFieldTransferSource = {
  from: AnalyzeFieldRole | 'columns'
  index: number
}

const getColumnName = (field: ColumnsStore.ColumnOptions) => field.columnName || field.datasetFieldName || ''

const createAnalyzeColumnOption = (field: ColumnsStore.ColumnOptions) => {
  const { datasetAggregationType: _datasetAggregationType, ...columnOption } = field
  return columnOption
}

export const isNumericColumnType = (columnType?: string) => {
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

export const resolveDefaultMeasureAggregationType = (
  field: Pick<ColumnsStore.ColumnOptions, 'columnType' | 'datasetFieldType'>
): AnalyzeConfigDao.MeasureAggregationType => {
  if (field.datasetFieldType === 'metric' || isNumericColumnType(field.columnType)) {
    return 'sum'
  }
  return 'count'
}

export const createMeasureOption = (field: ColumnsStore.ColumnOptions): MeasureStore.MeasureOption => {
  return {
    ...createAnalyzeColumnOption(field),
    measure: {
      aggregation: field.datasetAggregationType || resolveDefaultMeasureAggregationType(field)
    },
    fixed: null,
    align: null,
    width: null,
    showOverflowTooltip: false,
    filterable: false,
    sortable: false
  }
}

export const createDimensionOption = (field: ColumnsStore.ColumnOptions): DimensionStore.DimensionOption => {
  return {
    ...createAnalyzeColumnOption(field),
    grouping: createDefaultDimensionGrouping(),
    fixed: null,
    align: null,
    width: null,
    showOverflowTooltip: false,
    filterable: false,
    sortable: false
  }
}

export const moveFieldToMeasures = (field: ColumnsStore.ColumnOptions, source: AnalyzeFieldTransferSource) => {
  const measureStore = useMeasuresStore()
  const dimensionStore = useDimensionsStore()
  const columnName = getColumnName(field)

  dimensionStore.setDimensions(
    dimensionStore.getDimensions.filter((dimension, index) => {
      if (source.from === 'dimensions') return index !== source.index
      return getColumnName(dimension) !== columnName
    })
  )

  measureStore.setMeasures(
    measureStore.getMeasures.filter((measure, index) => {
      if (source.from === 'measures') return index !== source.index
      return getColumnName(measure) !== columnName
    })
  )

  measureStore.addMeasures([createMeasureOption(field)])
}

export const moveFieldToDimensions = (field: ColumnsStore.ColumnOptions, source: AnalyzeFieldTransferSource) => {
  const measureStore = useMeasuresStore()
  const dimensionStore = useDimensionsStore()
  const columnName = getColumnName(field)

  measureStore.setMeasures(
    measureStore.getMeasures.filter((measure, index) => {
      if (source.from === 'measures') return index !== source.index
      return getColumnName(measure) !== columnName
    })
  )

  dimensionStore.setDimensions(
    dimensionStore.getDimensions.filter((dimension, index) => {
      if (source.from === 'dimensions') return index !== source.index
      return getColumnName(dimension) !== columnName
    })
  )

  dimensionStore.addDimensions([createDimensionOption(field)])
}
