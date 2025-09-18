import Konva from 'konva'
import { computed, reactive, ref } from 'vue'
import { chartProps } from './props'

export type Prettify<T> = {
  [K in keyof T]: T[K]
} & {}

export interface PositionMap {
  x: number
  y: number
  width: number
  height: number
  rowIndex: number
  colIndex: number
}

/**
 * 对象池 属性
 */
export interface KonvaNodePools {
  /**
   * 单元格矩形
   */
  cellRects: Konva.Rect[]
  /**
   * 单元格文本
   */
  cellTexts: Konva.Text[]
}

/**
 * 数字列 汇总方式
 */
export const numberOptions = [
  { label: '不展示', value: 'nodisplay' },
  { label: '最大', value: 'max' },
  { label: '最小', value: 'min' },
  { label: '平均', value: 'avg' },
  { label: '求和', value: 'sum' }
]

/**
 * 文本列 汇总方式
 */
export const textOptions = [
  { label: '不展示', value: 'nodisplay' },
  { label: '已填写', value: 'filled' },
  { label: '未填写', value: 'nofilled' }
]

/**
 * 按钮颜色
 */
export const paletteOptions: Record<string, { fill: string; stroke: string; text: string }> = {
  primary: { fill: '#409EFF', stroke: '#2b74c7', text: '#fff' },
  success: { fill: '#67C23A', stroke: '#4ea427', text: '#fff' },
  warning: { fill: '#E6A23C', stroke: '#c9882f', text: '#fff' },
  danger: { fill: '#F56C6C', stroke: '#d15858', text: '#fff' },
  default: { fill: '#73767a', stroke: '#5b5e62', text: '#fff' }
}

interface TableVars {
  rowHighlightRects: Konva.Rect[] | null
  colHighlightRects: Konva.Rect[] | null
  leftBodyPools: KonvaNodePools
  centerBodyPools: KonvaNodePools
  rightBodyPools: KonvaNodePools
  stage: Konva.Stage | null
  scrollbarLayer: Konva.Layer | null

  headerLayer: Konva.Layer | null
  bodyLayer: Konva.Layer | null
  fixedBodyLayer: Konva.Layer | null
  summaryLayer: Konva.Layer | null

  leftHeaderGroup: Konva.Group | null
  centerBodyClipGroup: Konva.Group | null
  centerHeaderGroup: Konva.Group | null
  rightHeaderGroup: Konva.Group | null

  leftBodyGroup: Konva.Group | null
  centerBodyGroup: Konva.Group | null
  rightBodyGroup: Konva.Group | null

  leftSummaryGroup: Konva.Group | null
  centerSummaryGroup: Konva.Group | null
  rightSummaryGroup: Konva.Group | null
  verticalScrollbarGroup: Konva.Group | null
  horizontalScrollbarGroup: Konva.Group | null
  verticalScrollbarThumbRect: Konva.Rect | null
  horizontalScrollbarThumbRect: Konva.Rect | null
  highlightRect: Konva.Rect | null
  /**
   * 对外暴露的重建分组函数指针，避免模块间循环依赖
   */
  rebuildGroupsFn?: (() => void) | null
  stageScrollY: number
  stageScrollX: number
  columnWidthOverrides: Record<string, number>
  // 列宽拖拽相关变量
  isResizingColumn: boolean
  // resizingColumnName: string | null
  // resizeStartX: number
  // resizeStartWidth: number
  // resizeNeighborColumnName: string | null
  // resizeNeighborStartWidth: number
  isDraggingVerticalThumb: boolean
  isDraggingHorizontalThumb: boolean
  dragStartY: number
  dragStartX: number
  dragStartScrollY: number
  dragStartScrollX: number
  visibleRowStart: number
  visibleRowEnd: number
  visibleRowCount: number
  headerPositionMapList: PositionMap[]
  bodyPositionMapList: PositionMap[]
  summaryPositionMapList: PositionMap[]
}

/**
 * 表格全局状态变量
 */
const tableVars: TableVars = {
  /**
   * 行高亮矩形
   */
  rowHighlightRects: null,
  /**
   * 列高亮矩形
   */
  colHighlightRects: null,
  /**
   * 左侧主体组对象池
   */
  leftBodyPools: {
    cellRects: [],
    cellTexts: []
  },
  /**
   * 中间主体组对象池
   */
  centerBodyPools: {
    cellRects: [],
    cellTexts: []
  },
  /**
   * 右侧主体组对象池
   */
  rightBodyPools: {
    cellRects: [],
    cellTexts: []
  },
  // ========== Konva 对象 ==========
  /**
   * Stage 实例
   */
  stage: null,

  /**
   * 滚动条层（滚动条）
   */
  scrollbarLayer: null,

  /**
   * 中间区域剪辑组（中间区域）
   */
  centerBodyClipGroup: null,

  /**
   * 表头层（固定表头）
   */
  headerLayer: null,

  /**
   * 表格层（主体）
   */
  bodyLayer: null,

  /**
   * 汇总层（汇总）
   */
  summaryLayer: null,

  /**
   * 固定表body层（固定表body）
   */
  fixedBodyLayer: null,

  /**
   * 左侧表头组（左侧表头）
   */
  leftHeaderGroup: null,

  /**
   * 中间表头组（中间表头）
   */
  centerHeaderGroup: null,

  /**
   * 右侧表头组（右侧表头）
   */
  rightHeaderGroup: null,

  /**
   * 左侧主体组（左侧主体）
   */
  leftBodyGroup: null,

  /**
   * 中间主体组（中间主体）
   */
  centerBodyGroup: null,

  /**
   * 右侧主体组
   */
  rightBodyGroup: null,

  /**
   * 左侧汇总组（左侧汇总）
   */
  leftSummaryGroup: null,

  /**
   * 中间汇总组（中间汇总）
   */
  centerSummaryGroup: null,

  /**
   * 右侧汇总组（右侧汇总）
   */
  rightSummaryGroup: null,

  /**
   * 垂直滚动条组
   */
  verticalScrollbarGroup: null,

  /**
   * 水平滚动条组
   */
  horizontalScrollbarGroup: null,

  /**
   * 垂直滚动条滑块
   */
  verticalScrollbarThumbRect: null,

  /**
   * 水平滚动条滑块
   */
  horizontalScrollbarThumbRect: null,

  /**
   * 高亮矩形
   */
  highlightRect: null,

  // ========== 滚动相关 ==========
  /**
   * 垂直滚动多少像素
   */
  stageScrollY: 0,

  /**
   * 水平滚动多少像素
   */
  stageScrollX: 0,

  // ========== 列宽拖拽相关状态 ==========
  /**
   * 列宽拖拽相关状态
   */
  columnWidthOverrides: {},

  /**
   * 列宽拖拽状态
   */
  isResizingColumn: false,

  /**
   * 列宽拖拽列名 - 已注释掉
   */
  // resizingColumnName: null,

  /**
   * 列宽拖拽起始 X 坐标 - 已注释掉
   */
  // resizeStartX: 0,

  /**
   * 列宽拖拽起始宽度 - 已注释掉
   */
  // resizeStartWidth: 0,

  /**
   * 列宽拖拽邻居列名 - 已注释掉
   */
  // resizeNeighborColumnName: null,

  /**
   * 列宽拖拽邻居起始宽度 - 已注释掉
   */
  // resizeNeighborStartWidth: 0,

  // ========== 滚动条拖拽相关 ==========
  /**
   * 是否正在垂直拖动滚动条
   */
  isDraggingVerticalThumb: false,

  /**
   * 是否正在水平拖动滚动条
   */
  isDraggingHorizontalThumb: false,

  /**
   * 垂直滚动条拖拽起始 Y 坐标
   */
  dragStartY: 0,

  /**
   * 水平滚动条拖拽起始 X 坐标
   */
  dragStartX: 0,

  /**
   * 垂直滚动条拖拽起始滚动位置 Y
   */
  dragStartScrollY: 0,

  /**
   * 水平滚动条拖拽起始滚动位置 X
   */
  dragStartScrollX: 0,

  // ========== 虚拟滚动相关 ==========
  /**
   * 可视区域起始行索引
   */
  visibleRowStart: 0,

  /**
   * 可视区域结束行索引
   */
  visibleRowEnd: 0,

  /**
   * 上下缓冲行数
   */
  visibleRowCount: 0,

  // ========== 位置映射列表 ==========
  headerPositionMapList: [],
  bodyPositionMapList: [],
  summaryPositionMapList: []
}

export interface SortColumn {
  columnName: string
  order: 'asc' | 'desc'
}

/**
 * 排序状态 - 单独的响应式变量
 */
const sortColumns = ref<SortColumn[]>([])

/**
 * 过滤状态：列名 -> 选中的离散值集合 - 单独的响应式变量
 */
const filterState = reactive<Record<string, Set<string>>>({})

/**
 * 汇总行选择状态：列名 -> 选中的规则 - 单独的响应式变量
 */
const summaryState = reactive<Record<string, string>>({})

/**
 * 表格数据
 */
const tableData = ref<Array<ChartDataVo.ChartData>>([])

/**
 * 表格列
 */
const tableColumns = ref<Array<GroupStore.GroupOption | DimensionStore.DimensionOption>>([])

interface VariableHandlderProps {
  props: Prettify<Readonly<ExtractPropTypes<typeof chartProps>>>
}

/**
 * 创建表格状态管理器
 */
export const variableHandlder = ({ props }: VariableHandlderProps) => {
  /**
   * 表格容器样式
   */
  const tableContainerStyle = computed(() => {
    const height = typeof props.chartHeight === 'number' ? `${props.chartHeight}px` : (props.chartHeight ?? '460px')
    const width = typeof props.chartWidth === 'number' ? `${props.chartWidth}px` : (props.chartWidth ?? '100%')
    return {
      height,
      width,
      background: '#fff'
    }
  })
  /**
   * 处理表格列
   * @param xAxisFields x轴字段
   * @param yAxisFields y轴字段
   * @returns {void}
   */
  const handleTableColumns = (
    xAxisFields: Array<GroupStore.GroupOption>,
    yAxisFields: Array<DimensionStore.DimensionOption>
  ) => {
    const leftColsx = xAxisFields.filter((c) => c.fixed === 'left')
    const rightColsx = xAxisFields.filter((c) => c.fixed === 'right')
    const centerColsx = xAxisFields.filter((c) => !c.fixed)
    const leftColsy = yAxisFields.filter((c) => c.fixed === 'left')
    const rightColsy = yAxisFields.filter((c) => c.fixed === 'right')
    const centerColsy = yAxisFields.filter((c) => !c.fixed)
    tableColumns.value = leftColsx
      .concat(centerColsx)
      .concat(rightColsx)
      .concat(leftColsy)
      .concat(centerColsy)
      .concat(rightColsy)
  }
  /**
   * 原始数据存储 - 不被排序或过滤修改
   */
  const originalData = ref<Array<ChartDataVo.ChartData>>([])

  /**
   * 处理表格数据
   * @param data 表格数据
   * @returns {void}
   */
  const handleTableData = (data: Array<ChartDataVo.ChartData>) => {
    // 保存原始数据
    originalData.value = data.filter((row) => row && typeof row === 'object')

    // 开始处理数据
    let processedData = [...originalData.value]

    // 应用过滤
    const filterKeys = Object.keys(filterState).filter((k) => filterState[k] && filterState[k].size > 0)
    if (filterKeys.length) {
      processedData = processedData.filter((row) => {
        for (const k of filterKeys) {
          const set = filterState[k]
          const val = row[k]
          if (!set.has(String(val ?? ''))) return false
        }
        return true
      })
    }

    // 应用排序
    if (sortColumns.value.length) {
      const toNum = (v: string | number | null | undefined) => {
        const n = Number(v)
        return Number.isFinite(n) ? n : null
      }
      const getVal = (row: ChartDataVo.ChartData, key: string): string | number | undefined => {
        const val = row[key]
        if (typeof val === 'string' || typeof val === 'number') return val
        return undefined
      }
      processedData.sort((a, b) => {
        for (const s of sortColumns.value) {
          const key = s.columnName
          const av = getVal(a, key)
          const bv = getVal(b, key)
          const an = toNum(av)
          const bn = toNum(bv)
          let cmp = 0
          if (an !== null && bn !== null) cmp = an - bn
          else cmp = String(av ?? '').localeCompare(String(bv ?? ''))
          if (cmp !== 0) return s.order === 'asc' ? cmp : -cmp
        }
        return 0
      })
    }

    // 更新最终数据
    tableData.value = processedData
  }
  /**
   * 重置表格变量
   * @returns {void}
   */
  const resetTableVars = () => {
    // 重置 Konva 对象
    tableVars.stage = null
    tableVars.scrollbarLayer = null
    tableVars.headerLayer = null
    tableVars.bodyLayer = null
    tableVars.summaryLayer = null
    tableVars.fixedBodyLayer = null
    tableVars.leftHeaderGroup = null
    tableVars.centerHeaderGroup = null
    tableVars.rightHeaderGroup = null
    tableVars.leftBodyGroup = null
    tableVars.centerBodyGroup = null
    tableVars.rightBodyGroup = null
    tableVars.leftSummaryGroup = null
    tableVars.centerSummaryGroup = null
    tableVars.rightSummaryGroup = null
    tableVars.verticalScrollbarGroup = null
    tableVars.horizontalScrollbarGroup = null
    tableVars.verticalScrollbarThumbRect = null
    tableVars.horizontalScrollbarThumbRect = null
    tableVars.highlightRect = null

    // 重置滚动相关
    tableVars.stageScrollY = 0
    tableVars.stageScrollX = 0

    // 重置列宽拖拽相关 - 已注释掉
    tableVars.columnWidthOverrides = {}

    tableVars.isResizingColumn = false
    // tableVars.resizingColumnName = null
    // tableVars.resizeStartX = 0
    // tableVars.resizeStartWidth = 0
    // tableVars.resizeNeighborColumnName = null
    // tableVars.resizeNeighborStartWidth = 0

    // 重置滚动条拖拽相关
    tableVars.isDraggingVerticalThumb = false
    tableVars.isDraggingHorizontalThumb = false
    tableVars.dragStartY = 0
    tableVars.dragStartX = 0
    tableVars.dragStartScrollY = 0
    tableVars.dragStartScrollX = 0

    // 重置虚拟滚动相关
    tableVars.visibleRowStart = 0
    tableVars.visibleRowEnd = 0
    tableVars.visibleRowCount = 0

    // 重置位置映射列表
    tableVars.headerPositionMapList.length = 0
    tableVars.bodyPositionMapList.length = 0
    tableVars.summaryPositionMapList.length = 0

    // 重置排序相关
    sortColumns.value.length = 0

    // 重置过滤和汇总相关
    Object.keys(filterState).forEach((key) => delete filterState[key])
    Object.keys(summaryState).forEach((key) => delete summaryState[key])
  }

  /**
   * 处理表头排序点击
   * @param {string} columnName 列名
   * @returns {void}
   */
  const handleHeaderSort = (columnName: string) => {
    const existingIndex = sortColumns.value.findIndex((s) => s.columnName === columnName)

    if (existingIndex >= 0) {
      // 如果已经存在，切换排序方向
      const current = sortColumns.value[existingIndex]
      if (current.order === 'asc') {
        current.order = 'desc'
      } else {
        // 移除排序
        sortColumns.value.splice(existingIndex, 1)
      }
    } else {
      // 新增排序（默认降序）
      sortColumns.value.push({
        columnName,
        order: 'desc'
      })
    }

    // 重新处理数据 - 使用原始数据重新排序
    handleTableData(originalData.value)
  }

  /**
   * 获取列的排序状态
   * @param {string} columnName 列名
   * @returns {'asc' | 'desc' | null} 排序状态
   */
  const getColumnSortOrder = (columnName: string): 'asc' | 'desc' | null => {
    const sortColumn = sortColumns.value.find((s) => s.columnName === columnName)
    return sortColumn ? sortColumn.order : null
  }

  return {
    tableContainerStyle,
    handleTableColumns,
    tableVars,
    tableColumns,
    tableData,
    filterState,
    summaryState,
    sortColumns,
    handleTableData,
    resetTableVars,
    handleHeaderSort,
    getColumnSortOrder
  }
}
