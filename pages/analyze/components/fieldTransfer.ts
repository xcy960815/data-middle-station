import {
  createDefaultDimensionRule,
  createDefaultFilterRule,
  createDefaultMeasureRule,
  createDefaultOrderRule
} from '@/shared/analyzeFieldRules'

type AnalyzeFieldTransferSource = Pick<DragData, 'from' | 'index'>

type DisplayNameField = {
  displayName?: string
  columnComment?: string
  columnName?: string
}

const getColumnName = (field: ColumnsStore.ColumnOptions) => field.columnName || field.datasetFieldName || ''

const createAnalyzeColumnOption = (field: ColumnsStore.ColumnOptions) => {
  const { datasetAggregationType: _datasetAggregationType, ...columnOption } = field
  return columnOption
}

const syncAnalyzeFieldDisplayName = (field: DisplayNameField) => {
  field.displayName = field.columnComment || field.columnName || ''
}

const reorderFields = <T>(fields: T[], sourceIndex: number, targetIndex: number): T[] => {
  if (targetIndex === sourceIndex) return fields
  const nextFields = JSON.parse(JSON.stringify(fields)) as T[]
  const target = nextFields.splice(sourceIndex, 1)[0]
  nextFields.splice(targetIndex, 0, target)
  return nextFields
}

export const getAnalyzeFieldDropTargetIndex = (
  selector: string,
  sourceIndex: number,
  dragEvent: DragEvent,
  axis: 'x' | 'y' = 'y'
): number => {
  const dropCoordinate = axis === 'x' ? dragEvent.clientX : dragEvent.clientY
  const middleCoordinates = Array.from(document.querySelectorAll(selector)).map((element) => {
    const rect = element.getBoundingClientRect()
    return axis === 'x' ? (rect.left + rect.right) / 2 : (rect.top + rect.bottom) / 2
  })
  middleCoordinates.splice(sourceIndex, 1)
  const targetIndex = middleCoordinates.findIndex((coordinate) => dropCoordinate < coordinate)
  return targetIndex === -1 ? middleCoordinates.length : targetIndex
}

export const createMeasureOption = (field: ColumnsStore.ColumnOptions): MeasureStore.MeasureOption => {
  return {
    ...createAnalyzeColumnOption(field),
    measureRule: createDefaultMeasureRule(field),
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
    dimensionRule: createDefaultDimensionRule(),
    fixed: null,
    align: null,
    width: null,
    showOverflowTooltip: false,
    filterable: false,
    sortable: false
  }
}

export const createFilterOption = (field: ColumnsStore.ColumnOptions): FilterStore.FilterOption => {
  const filterOption = {
    ...createAnalyzeColumnOption(field),
    filterRule: createDefaultFilterRule()
  }
  syncAnalyzeFieldDisplayName(filterOption)
  return filterOption
}

export const createOrderOption = (field: ColumnsStore.ColumnOptions): OrderStore.OrderOption => {
  const orderOption = {
    ...createAnalyzeColumnOption(field),
    orderRule: createDefaultOrderRule()
  }
  syncAnalyzeFieldDisplayName(orderOption)
  return orderOption
}

export const syncFilterOptionDisplayName = syncAnalyzeFieldDisplayName

export const syncOrderOptionDisplayName = syncAnalyzeFieldDisplayName

/**
 * 值和分组是查询主角色，同一个字段只能落在其中一个主角色里。
 */
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

/**
 * 值和分组是查询主角色，同一个字段只能落在其中一个主角色里。
 */
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

export const addFieldToFilters = (field: ColumnsStore.ColumnOptions) => {
  const filterStore = useFiltersStore()
  filterStore.addFilters([createFilterOption(field)])
}

export const addFieldToOrders = (field: ColumnsStore.ColumnOptions) => {
  const orderStore = useOrdersStore()
  orderStore.addOrders([createOrderOption(field)])
}

export const reorderMeasures = (sourceIndex: number, targetIndex: number) => {
  const measureStore = useMeasuresStore()
  measureStore.setMeasures(reorderFields(measureStore.getMeasures, sourceIndex, targetIndex))
}

export const reorderDimensions = (sourceIndex: number, targetIndex: number) => {
  const dimensionStore = useDimensionsStore()
  dimensionStore.setDimensions(reorderFields(dimensionStore.getDimensions, sourceIndex, targetIndex))
}

export const reorderFilters = (sourceIndex: number, targetIndex: number) => {
  const filterStore = useFiltersStore()
  filterStore.setFilters(reorderFields(filterStore.getFilters, sourceIndex, targetIndex))
}

export const reorderOrders = (sourceIndex: number, targetIndex: number) => {
  const orderStore = useOrdersStore()
  orderStore.setOrders(reorderFields(orderStore.getOrders, sourceIndex, targetIndex))
}
