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

/**
 * 解析分析字段的稳定列名，优先使用物理列名，其次使用数据集字段名。
 * @param {ColumnsStore.ColumnOptions} field 待解析的候选字段或分析字段。
 * @returns {string} 可用于跨区域去重和互斥判断的字段名。
 */
const getColumnName = (field: ColumnsStore.ColumnOptions) => field.columnName || field.datasetFieldName || ''

/**
 * 从候选字段中剥离只属于数据集推荐配置的运行时字段，生成可进入分析配置的基础字段。
 * @param {ColumnsStore.ColumnOptions} field 左侧候选字段。
 * @returns {Omit<ColumnsStore.ColumnOptions, 'datasetAggregationType'>} 分析配置字段基础对象。
 */
const createAnalyzeColumnOption = (field: ColumnsStore.ColumnOptions) => {
  const { datasetAggregationType: _datasetAggregationType, ...columnOption } = field
  return columnOption
}

/**
 * 同步分析字段展示名，优先使用字段注释，其次使用字段名。
 * @param {DisplayNameField} field 需要同步展示名的字段对象。
 * @returns {void}
 */
const syncAnalyzeFieldDisplayName = (field: DisplayNameField) => {
  field.displayName = field.columnComment || field.columnName || ''
}

/**
 * 按拖拽源索引和目标索引重排字段列表。
 * @template T 字段列表元素类型。
 * @param {T[]} fields 原始字段列表。
 * @param {number} sourceIndex 被拖拽字段的原始索引。
 * @param {number} targetIndex 字段落点对应的目标索引。
 * @returns {T[]} 重排后的新字段列表。
 */
const reorderFields = <T>(fields: T[], sourceIndex: number, targetIndex: number): T[] => {
  if (targetIndex === sourceIndex) return fields
  const nextFields = JSON.parse(JSON.stringify(fields)) as T[]
  const target = nextFields.splice(sourceIndex, 1)[0]
  nextFields.splice(targetIndex, 0, target)
  return nextFields
}

/**
 * 根据拖拽落点计算字段应插入到目标容器中的索引。
 * @param {string} selector 目标容器内可拖拽字段元素的 CSS 选择器。
 * @param {number} sourceIndex 被拖拽字段的原始索引。
 * @param {DragEvent} dragEvent 当前 drop 事件对象。
 * @param {'x' | 'y'} [axis='y'] 使用横向还是纵向坐标计算落点。
 * @returns {number} 目标插入索引。
 */
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

/**
 * 创建“值/度量”区域字段配置。
 * @param {ColumnsStore.ColumnOptions} field 左侧候选字段或其他区域拖入的字段。
 * @returns {MeasureStore.MeasureOption} 带默认度量规则和表格展示配置的值字段。
 */
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

/**
 * 创建“分组”区域字段配置。
 * @param {ColumnsStore.ColumnOptions} field 左侧候选字段或其他区域拖入的字段。
 * @returns {DimensionStore.DimensionOption} 带默认分组规则和表格展示配置的分组字段。
 */
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

/**
 * 创建“筛选”区域字段配置。
 * @param {ColumnsStore.ColumnOptions} field 左侧候选字段或其他区域拖入的字段。
 * @returns {FilterStore.FilterOption} 带默认筛选规则和展示名的筛选字段。
 */
export const createFilterOption = (field: ColumnsStore.ColumnOptions): FilterStore.FilterOption => {
  const filterOption = {
    ...createAnalyzeColumnOption(field),
    filterRule: createDefaultFilterRule()
  }
  syncAnalyzeFieldDisplayName(filterOption)
  return filterOption
}

/**
 * 创建“排序”区域字段配置。
 * @param {ColumnsStore.ColumnOptions} field 左侧候选字段或其他区域拖入的字段。
 * @returns {OrderStore.OrderOption} 带默认排序规则和展示名的排序字段。
 */
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
 * 将字段移动到“值/度量”区域。
 *
 * 值和分组是查询主角色，同一个字段只能落在其中一个主角色里；移动到值时会从分组和值区域中移除同字段旧配置。
 * @param {ColumnsStore.ColumnOptions} field 被拖入值区域的字段。
 * @param {AnalyzeFieldTransferSource} source 字段来源区域和来源索引。
 * @returns {void}
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
 * 将字段移动到“分组”区域。
 *
 * 值和分组是查询主角色，同一个字段只能落在其中一个主角色里；移动到分组时会从值和分组区域中移除同字段旧配置。
 * @param {ColumnsStore.ColumnOptions} field 被拖入分组区域的字段。
 * @param {AnalyzeFieldTransferSource} source 字段来源区域和来源索引。
 * @returns {void}
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

/**
 * 将字段添加到“筛选”区域。
 *
 * 筛选是附加规则，不与值/分组互斥；同字段是否重复由筛选区域自身交互和查询语义处理。
 * @param {ColumnsStore.ColumnOptions} field 被拖入筛选区域的字段。
 * @returns {void}
 */
export const addFieldToFilters = (field: ColumnsStore.ColumnOptions) => {
  const filterStore = useFiltersStore()
  filterStore.addFilters([createFilterOption(field)])
}

/**
 * 将字段添加到“排序”区域。
 *
 * 排序是附加规则，不与值/分组互斥；排序 SQL 语义由查询构造器统一解释。
 * @param {ColumnsStore.ColumnOptions} field 被拖入排序区域的字段。
 * @returns {void}
 */
export const addFieldToOrders = (field: ColumnsStore.ColumnOptions) => {
  const orderStore = useOrdersStore()
  orderStore.addOrders([createOrderOption(field)])
}

/**
 * 重排“值/度量”区域字段。
 * @param {number} sourceIndex 被拖拽值字段的原始索引。
 * @param {number} targetIndex 值字段落点对应的目标索引。
 * @returns {void}
 */
export const reorderMeasures = (sourceIndex: number, targetIndex: number) => {
  const measureStore = useMeasuresStore()
  measureStore.setMeasures(reorderFields(measureStore.getMeasures, sourceIndex, targetIndex))
}

/**
 * 重排“分组”区域字段。
 * @param {number} sourceIndex 被拖拽分组字段的原始索引。
 * @param {number} targetIndex 分组字段落点对应的目标索引。
 * @returns {void}
 */
export const reorderDimensions = (sourceIndex: number, targetIndex: number) => {
  const dimensionStore = useDimensionsStore()
  dimensionStore.setDimensions(reorderFields(dimensionStore.getDimensions, sourceIndex, targetIndex))
}

/**
 * 重排“筛选”区域字段。
 * @param {number} sourceIndex 被拖拽筛选字段的原始索引。
 * @param {number} targetIndex 筛选字段落点对应的目标索引。
 * @returns {void}
 */
export const reorderFilters = (sourceIndex: number, targetIndex: number) => {
  const filterStore = useFiltersStore()
  filterStore.setFilters(reorderFields(filterStore.getFilters, sourceIndex, targetIndex))
}

/**
 * 重排“排序”区域字段。
 * @param {number} sourceIndex 被拖拽排序字段的原始索引。
 * @param {number} targetIndex 排序字段落点对应的目标索引。
 * @returns {void}
 */
export const reorderOrders = (sourceIndex: number, targetIndex: number) => {
  const orderStore = useOrdersStore()
  orderStore.setOrders(reorderFields(orderStore.getOrders, sourceIndex, targetIndex))
}
