import type { PropType } from 'vue'
import { createCanvasTableRuntimeState, type CanvasTableRuntimeState } from './runtime-state'

/**
 * 默认字体
 */
const defaultFontFamily = 'Arial, sans-serif'

export interface ColumnWidthChangePayload {
  columnName: string
  width: number
}

export interface ColumnOrderChangePayload {
  xAxisFields: CanvasTable.ColumnOption[]
  yAxisFields: CanvasTable.ColumnOption[]
}

export interface CellValueChangePayload {
  row: AnalyzeDataVo.AnalyzeData
  rowIndex: number
  columnName: string
  value: string | number
}

interface TableRuntimeHandlers {
  onColumnWidthChange?: (payload: ColumnWidthChangePayload) => void
  onColumnOrderChange?: (payload: ColumnOrderChangePayload) => void
  onCellValueChange?: (payload: CellValueChangePayload) => void
}

/**
 * 表格Props
 */
export const tableProps = {
  /**
   * 图表标题
   */
  title: String,

  /**
   * 数据
   */
  data: {
    type: Array as PropType<AnalyzeDataVo.AnalyzeData[]>,
    required: true,
    default: () => []
  },

  /**
   * 分组字段
   */
  xAxisFields: {
    type: Array as PropType<CanvasTable.ColumnOption[]>,
    required: true,
    default: () => []
  },

  /**
   * 值/度量字段
   */
  yAxisFields: {
    type: Array as PropType<CanvasTable.ColumnOption[]>,
    required: true,
    default: () => []
  },

  /**
   * 缓冲行数 - 减少缓冲行数以提升性能
   */
  bufferRows: { type: Number, default: 50 },
  /**
   * 最小自动列宽
   */
  minAutoColWidth: { type: Number, default: 100 },
  /**
   * 合并单元格方法
   * @param args 参数
   * @returns 合并单元格信息
   */
  spanMethod: {
    type: Function as PropType<
      (config: {
        row: AnalyzeDataVo.AnalyzeData
        column: CanvasTable.ColumnOption
        rowIndex: number
        colIndex: number
      }) => { rowspan: number; colspan: number } | [number, number] | null | undefined
    >,
    default: undefined
  },

  // ========== 样式相关 Props ==========
  /**
   * 图表宽度
   */
  chartWidth: { type: [Number, String], default: '100%' },
  /**
   * 图表高度
   */
  chartHeight: { type: [Number, String], default: '100%' },
  /**
   * 高亮单元格背景色
   */
  highlightCellBackground: { type: String, default: 'rgba(24, 144, 255, 1)' },
  /**
   * 行悬停高亮颜色（包含背景色和边框色）
   */
  highlightRowBackground: { type: String, default: 'rgba(64, 158, 255, 0.1)' },
  /**
   * 列悬停高亮颜色（包含背景色和边框色）
   */
  highlightColBackground: { type: String, default: 'rgba(64, 158, 255, 0.08)' },

  /**
   * 表头高度
   */
  headerRowHeight: { type: Number, default: 32 },
  /**
   * 列宽调整手柄宽度
   */
  resizerWidth: { type: Number, default: 4 },
  /**
   * 文本水平内边距
   */
  textPaddingHorizontal: { type: Number, default: 8 },
  /**
   * 表头背景色
   */
  headerBackground: { type: String, default: '#f7f7f9' },
  /**
   * 表头文本颜色
   */
  headerTextColor: { type: String, default: '#303133' },
  /**
   * 表头字体
   */
  headerFontFamily: { type: String, default: defaultFontFamily },
  /**
   * 表头字体大小
   */
  headerFontSize: { type: Number, default: 13 },

  /**
   * 表格行高度
   */
  bodyRowHeight: { type: Number, default: 30 },
  /**
   * 表格行背景色（奇数行）
   */
  bodyBackgroundOdd: { type: String, default: '#ffffff' },
  /**
   * 表格行背景色（偶数行）
   */
  bodyBackgroundEven: { type: String, default: '#fafafa' },
  /**
   * 表格行文本颜色
   */
  bodyTextColor: { type: String, default: '#303133' },
  /**
   * 表格行字体
   */
  bodyFontFamily: { type: String, default: defaultFontFamily },
  /**
   * 表格行字体大小
   */
  bodyFontSize: { type: Number, default: 13 },

  /**
   * 表格边框颜色
   */
  borderColor: { type: String, default: '#dcdfe6' },

  /**
   * 是否启用汇总
   */
  enableSummary: { type: Boolean, default: false },
  /**
   * 汇总高度
   */
  summaryRowHeight: { type: Number, default: 30 },
  /**
   * 汇总背景色
   */
  summaryBackground: { type: String, default: '#f7f7f9' },
  /**
   * 汇总文本颜色
   */
  summaryTextColor: { type: String, default: '#303133' },
  /**
   * 汇总字体
   */
  summaryFontFamily: { type: String, default: defaultFontFamily },
  /**
   * 汇总字体大小
   */
  summaryFontSize: { type: Number, default: 14 },

  /**
   * 滚动条大小
   */
  scrollbarSize: { type: Number, default: 16 },
  /**
   * 滚动条背景色
   */
  scrollbarBackground: { type: String, default: '#f1f1f1' },
  /**
   * 滚动条滑块颜色
   */
  scrollbarThumbBackground: { type: String, default: '#c1c1c1' },
  /**
   * 滚动条滑块悬停颜色
   */
  scrollbarThumbHoverBackground: { type: String, default: '#a8a8a8' },

  /**
   * 排序箭头颜色
   */
  sortActiveColor: { type: String, default: '#409EFF' },

  /**
   * 拖拽图标高度
   */
  dragIconHeight: { type: Number, default: 16 },

  /**
   * 拖拽图标宽度
   */
  dragIconWidth: { type: Number, default: 9 },

  /**
   * 拖拽图标圆点大小
   */
  dragIconDotSize: { type: Number, default: 3 }
}

export interface CanvasTableParams {
  /**
   * 图表标题
   */
  title: string
  /**
   * 数据
   */
  data: Array<AnalyzeDataVo.AnalyzeData>
  /**
   * 分组字段
   */
  xAxisFields: Array<CanvasTable.ColumnOption>
  /**
   * 值/度量字段
   */
  yAxisFields: Array<CanvasTable.ColumnOption>
  /**
   * 是否启用汇总
   */
  enableSummary: boolean
  /**
   * 缓冲行数
   */
  bufferRows: number
  /**
   * 最小自动列宽
   */
  minAutoColWidth: number
  /**
   * 高亮单元格背景色
   */
  highlightCellBackground: string
  /**
   * 行悬停高亮颜色（包含背景色和边框色）
   */
  highlightRowBackground: string
  /**
   * 列悬停高亮颜色（包含背景色和边框色）
   */
  highlightColBackground: string
  /**
   * 表头高度
   */
  headerRowHeight: number
  /**
   * 列宽调整手柄宽度
   */
  resizerWidth: number
  /**
   * 文本水平内边距
   */
  textPaddingHorizontal: number
  /**
   * 表头背景色
   */
  headerBackground: string
  /**
   * 表头文本颜色
   */
  headerTextColor: string
  /**
   * 表头字体
   */
  headerFontFamily: string
  /**
   * 表头字体大小
   */
  headerFontSize: number
  /**
   * 表格行高度
   */
  bodyRowHeight: number
  /**
   * 表格行背景色（奇数行）
   */
  bodyBackgroundOdd: string
  /**
   * 表格行背景色（偶数行）
   */
  bodyBackgroundEven: string
  /**
   * 表格行文本颜色
   */
  bodyTextColor: string
  /**
   * 表格行字体
   */
  bodyFontFamily: string
  /**
   * 表格行字体大小
   */
  bodyFontSize: number
  /**
   * 表格边框颜色
   */
  borderColor: string
  /**
   * 汇总高度
   */
  summaryRowHeight: number
  /**
   * 汇总背景色
   */
  summaryBackground: string
  /**
   * 汇总文本颜色
   */
  summaryTextColor: string
  /**
   * 汇总字体
   */
  summaryFontFamily: string
  /**
   * 汇总字体大小
   */
  summaryFontSize: number
  /**
   * 滚动条大小
   */
  scrollbarSize: number
  /**
   * 滚动条背景色
   */
  scrollbarBackground: string
  /**
   * 滚动条滑块颜色
   */
  scrollbarThumbBackground: string
  /**
   * 滚动条滑块悬停颜色
   */
  scrollbarThumbHoverBackground: string
  /**
   * 排序箭头颜色
   */
  sortActiveColor: string
  /**
   * 拖拽图标高度
   * 默认值 14
   */
  dragIconHeight: number
  /**
   * 拖拽图标宽度
   * 默认值 9
   */
  dragIconWidth: number
  /**
   * 拖拽图标圆点大小
   */
  dragIconDotSize: number
  /**
   * 合并单元格方法
   */
  spanMethod?: (config: {
    row: AnalyzeDataVo.AnalyzeData
    column: CanvasTable.ColumnOption
    rowIndex: number
    colIndex: number
  }) => { rowspan: number; colspan: number } | [number, number] | null | undefined
}

const createDefaultTableParams = (): CanvasTableParams => ({
  title: '',
  data: [],
  xAxisFields: [],
  yAxisFields: [],
  enableSummary: false,
  bufferRows: 50,
  minAutoColWidth: 100,
  highlightCellBackground: 'rgba(24, 144, 255, 1)',
  highlightRowBackground: 'rgba(64, 158, 255, 0.1)',
  highlightColBackground: 'rgba(64, 158, 255, 0.08)',
  headerRowHeight: 32,
  resizerWidth: 4,
  textPaddingHorizontal: 8,
  headerBackground: '#f7f7f9',
  headerTextColor: '#303133',
  headerFontFamily: defaultFontFamily,
  headerFontSize: 13,
  bodyRowHeight: 30,
  bodyBackgroundOdd: '#ffffff',
  bodyBackgroundEven: '#fafafa',
  bodyTextColor: '#303133',
  bodyFontFamily: defaultFontFamily,
  bodyFontSize: 13,
  borderColor: '#dcdfe6',
  summaryRowHeight: 30,
  summaryBackground: '#f7f7f9',
  summaryTextColor: '#303133',
  summaryFontFamily: defaultFontFamily,
  summaryFontSize: 14,
  scrollbarSize: 16,
  scrollbarBackground: '#f1f1f1',
  scrollbarThumbBackground: '#c1c1c1',
  scrollbarThumbHoverBackground: '#a8a8a8',
  sortActiveColor: '#409EFF',
  dragIconHeight: 16,
  dragIconWidth: 9,
  dragIconDotSize: 3,
  spanMethod: undefined
})

const cloneColumns = <T extends CanvasTable.ColumnOption>(columns: T[]): T[] => columns.map((column) => ({ ...column }))

const SOURCE_ROW_INDEX_KEY = '__dmsTableSourceRowIndex__'

const cloneRows = (rows: AnalyzeDataVo.AnalyzeData[]): AnalyzeDataVo.AnalyzeData[] =>
  rows.map((row, rowIndex) => {
    const clonedRow = { ...row }
    Object.defineProperty(clonedRow, SOURCE_ROW_INDEX_KEY, {
      value: rowIndex,
      enumerable: false,
      configurable: true
    })
    return clonedRow
  })

export const getSourceRowIndex = (row: AnalyzeDataVo.AnalyzeData): number => {
  const sourceRowIndex = (row as Record<string, unknown>)[SOURCE_ROW_INDEX_KEY]
  return typeof sourceRowIndex === 'number' ? sourceRowIndex : -1
}

export interface CanvasTableContext {
  params: CanvasTableParams
  processedRows: {
    value: Array<AnalyzeDataVo.AnalyzeData>
  }
  runtimeHandlers: TableRuntimeHandlers
  runtimeState: CanvasTableRuntimeState
}

export const createCanvasTableContext = (): CanvasTableContext => ({
  params: createDefaultTableParams(),
  processedRows: {
    value: []
  },
  runtimeHandlers: {},
  runtimeState: createCanvasTableRuntimeState()
})

let currentContext: CanvasTableContext | null = null

export const setCurrentTableContext = (context: CanvasTableContext) => {
  currentContext = context
}

export const runWithTableContext = <T>(context: CanvasTableContext, handler: () => T): T => {
  const previousContext = currentContext
  currentContext = context
  try {
    return handler()
  } finally {
    currentContext = previousContext
  }
}

export const bindCurrentTableContext = <Args extends unknown[], T>(handler: (...args: Args) => T) => {
  const context = getCurrentTableContext()
  return (...args: Args): T => runWithTableContext(context, () => handler(...args))
}

export const getCurrentTableContext = () => {
  if (!currentContext) {
    throw new Error('CanvasTableContext 尚未绑定，请先调用 setCurrentTableContext。')
  }

  return currentContext
}

export const getTableParams = () => getCurrentTableContext().params

export const getProcessedRows = () => getCurrentTableContext().processedRows

export const getRuntimeState = () => getCurrentTableContext().runtimeState

export const resetCurrentTableContext = (context?: CanvasTableContext | null) => {
  if (!context || currentContext === context) {
    currentContext = null
  }
}

export const setTableRuntimeHandlers = (handlers: TableRuntimeHandlers) => {
  const context = getCurrentTableContext()
  context.runtimeHandlers.onColumnWidthChange = handlers.onColumnWidthChange
  context.runtimeHandlers.onColumnOrderChange = handlers.onColumnOrderChange
  context.runtimeHandlers.onCellValueChange = handlers.onCellValueChange
}

export const resetTableRuntimeHandlers = () => {
  const context = getCurrentTableContext()
  context.runtimeHandlers.onColumnWidthChange = undefined
  context.runtimeHandlers.onColumnOrderChange = undefined
  context.runtimeHandlers.onCellValueChange = undefined
}

export const applyTableParams = (nextParams: Partial<CanvasTableParams>) => {
  const params = getTableParams()
  Object.assign(params, nextParams)
  if (nextParams.data) params.data = cloneRows(nextParams.data)
  if (nextParams.xAxisFields) params.xAxisFields = cloneColumns(nextParams.xAxisFields)
  if (nextParams.yAxisFields) params.yAxisFields = cloneColumns(nextParams.yAxisFields)
}

export const updateTableColumnWidth = (columnName: string, width: number) => {
  const params = getTableParams()
  const applyWidth = (column: CanvasTable.ColumnOption) =>
    column.columnName === columnName ? { ...column, width } : column
  params.xAxisFields = params.xAxisFields.map((column) => applyWidth(column) as CanvasTable.ColumnOption)
  params.yAxisFields = params.yAxisFields.map((column) => applyWidth(column) as CanvasTable.ColumnOption)
  getCurrentTableContext().runtimeHandlers.onColumnWidthChange?.({ columnName, width })
}

export const updateTableColumnOrder = (
  xAxisFields: CanvasTable.ColumnOption[],
  yAxisFields: CanvasTable.ColumnOption[]
) => {
  const params = getTableParams()
  params.xAxisFields = cloneColumns(xAxisFields)
  params.yAxisFields = cloneColumns(yAxisFields)
  getCurrentTableContext().runtimeHandlers.onColumnOrderChange?.({
    xAxisFields: cloneColumns(xAxisFields),
    yAxisFields: cloneColumns(yAxisFields)
  })
}

export const notifyCellValueChange = (payload: CellValueChangePayload) => {
  getCurrentTableContext().runtimeHandlers.onCellValueChange?.(payload)
}

/**
 * @desc 重置当前表格参数，释放上一次渲染持有的数据引用。
 */
export const resetTableParams = () => {
  Object.assign(getTableParams(), createDefaultTableParams())
  resetTableRuntimeHandlers()
}
