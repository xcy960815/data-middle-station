import Konva from 'konva'
import { computed, reactive } from 'vue'
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
   * 合并单元格矩形
   */
  mergedCellRects: Konva.Rect[]
  /**
   * 单元格矩形
   */
  cellRects: Konva.Rect[]
  /**
   * 合并单元格文本
   */
  mergedCellTexts: Konva.Text[]
  /**
   * 单元格文本
   */
  cellTexts: Konva.Text[]
  /**
   * 背景矩形
   */
  backgroundRects: Konva.Rect[]
  /**
   * 按钮矩形
   */
  buttonRects?: Konva.Rect[]
  /**
   * 按钮文本
   */
  buttonTexts?: Konva.Text[]
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

interface TableVars {
  rowHighlightRects: Konva.Rect[] | null
  colHighlightRects: Konva.Rect[] | null
  leftBodyPools: KonvaNodePools
  centerBodyPools: KonvaNodePools
  rightBodyPools: KonvaNodePools
  stage: Konva.Stage | null
  scrollbarLayer: Konva.Layer | null
  centerBodyClipGroup: Konva.Group | null
  headerLayer: Konva.Layer | null
  bodyLayer: Konva.Layer | null
  summaryLayer: Konva.Layer | null
  fixedHeaderLayer: Konva.Layer | null
  fixedBodyLayer: Konva.Layer | null
  fixedSummaryLayer: Konva.Layer | null
  leftHeaderGroup: Konva.Group | null
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
  verticalScrollbarThumb: Konva.Rect | null
  horizontalScrollbarThumb: Konva.Rect | null
  highlightRect: Konva.Rect | null
  stageScrollY: number
  stageScrollX: number
  columnWidthOverrides: Record<string, number>
  isResizingColumn: boolean
  resizingColumnName: string | null
  resizeStartX: number
  resizeStartWidth: number
  resizeNeighborColumnName: string | null
  resizeNeighborStartWidth: number
  isDraggingVerticalThumb: boolean
  isDraggingHorizontalThumb: boolean
  dragStartY: number
  dragStartX: number
  dragStartScrollY: number
  dragStartScrollX: number
  visibleRowStart: number
  visibleRowEnd: number
  visibleRowCount: number
  hoveredRowIndex: number | null
  hoveredColIndex: number | null
  lastClientX: number
  lastClientY: number
  headerPositionMapList: PositionMap[]
  bodyPositionMapList: PositionMap[]
  summaryPositionMapList: PositionMap[]
  sortColumns: SortColumn[]
  /**
   * 过滤状态：列名 -> 选中的离散值集合
   */
  filterState: Record<string, Set<string>>
  /**
   * 汇总行选择状态：列名 -> 选中的规则
   */
  summaryState: Record<string, string>
}

/**
 * 表格全局状态变量
 */
export const tableVars: TableVars = reactive({
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
    mergedCellRects: [],
    cellRects: [],
    mergedCellTexts: [],
    cellTexts: [],
    backgroundRects: []
  },
  /**
   * 中间主体组对象池
   */
  centerBodyPools: {
    mergedCellRects: [],
    cellRects: [],
    mergedCellTexts: [],
    cellTexts: [],
    backgroundRects: []
  },
  /**
   * 右侧主体组对象池
   */
  rightBodyPools: {
    mergedCellRects: [],
    cellRects: [],
    mergedCellTexts: [],
    cellTexts: [],
    backgroundRects: []
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
   * 固定表头层（固定表头）
   */
  fixedHeaderLayer: null,

  /**
   * 固定表body层（固定表body）
   */
  fixedBodyLayer: null,

  /**
   * 固定汇总层（固定汇总）
   */
  fixedSummaryLayer: null,

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
  verticalScrollbarThumb: null,

  /**
   * 水平滚动条滑块
   */
  horizontalScrollbarThumb: null,

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
   * 列宽拖拽列名
   */
  resizingColumnName: null,

  /**
   * 列宽拖拽起始 X 坐标
   */
  resizeStartX: 0,

  /**
   * 列宽拖拽起始宽度
   */
  resizeStartWidth: 0,

  /**
   * 列宽拖拽邻居列名
   */
  resizeNeighborColumnName: null,

  /**
   * 列宽拖拽邻居起始宽度
   */
  resizeNeighborStartWidth: 0,

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

  // ========== 悬停高亮相关 ==========
  /**
   * 需要高亮的行索引
   */
  hoveredRowIndex: null,

  /**
   * 需要高亮的列索引
   */
  hoveredColIndex: null,

  /**
   * 最近一次指针的屏幕坐标（用于判断表格上是否存在遮罩层）
   */
  lastClientX: 0,
  lastClientY: 0,

  // ========== 位置映射列表 ==========
  headerPositionMapList: [],
  bodyPositionMapList: [],
  summaryPositionMapList: [],

  // ========== 排序相关 ==========
  /**
   * 排序状态
   */
  sortColumns: [],

  // ========== 过滤和汇总相关 ==========
  /**
   * 过滤状态：列名 -> 选中的离散值集合
   */
  filterState: {},

  /**
   * 汇总行选择状态：列名 -> 选中的规则
   */
  summaryState: {}
})

export interface SortColumn {
  columnName: string
  order: 'asc' | 'desc'
}

interface CreateTableStateProps {
  props: Prettify<Readonly<ExtractPropTypes<typeof chartProps>>>
}

/**
 * 创建表格状态管理器
 */
export const createTableState = ({ props }: CreateTableStateProps) => {
  /**
   * 列别名映射
   * @returns {Record<string, string>}
   */
  const columnAliasMap = computed(() => {
    const map: Record<string, string> = {}
    tableColumns.value.forEach((c: GroupStore.GroupOption | DimensionStore.DimensionOption) => {
      if (c && typeof c === 'object') {
        const columnName = c.columnName
        const displayName = c.displayName as string | undefined
        if (columnName && displayName && displayName !== columnName) {
          map[columnName] = displayName
        }
      }
    })
    return map
  })

  /**
   * 所有列 已经按照左中右排序过
   * @returns {Array<GroupStore.GroupOption | DimensionStore.DimensionOption>}
   */
  const tableColumns = computed(() => {
    const leftColsx = props.xAxisFields.filter((c) => c.fixed === 'left')
    const rightColsx = props.xAxisFields.filter((c) => c.fixed === 'right')
    const centerColsx = props.xAxisFields.filter((c) => !c.fixed)
    const leftColsy = props.yAxisFields.filter((c) => c.fixed === 'left')
    const rightColsy = props.yAxisFields.filter((c) => c.fixed === 'right')
    const centerColsy = props.yAxisFields.filter((c) => !c.fixed)
    return leftColsx.concat(centerColsx).concat(rightColsx).concat(leftColsy).concat(centerColsy).concat(rightColsy)
  })
  /**
   * 表格数据
   */
  const tableData = computed<Array<ChartDataVo.ChartData>>(() => props.data)

  /**
   * 应用排序后的数据视图
   */
  const activeData = computed<Array<ChartDataVo.ChartData>>(() => {
    // 先按 filter 过滤
    let base = tableData.value.filter((row) => row && typeof row === 'object') // 过滤掉无效的行
    const filterKeys = Object.keys(tableVars.filterState).filter(
      (k) => tableVars.filterState[k] && tableVars.filterState[k].size > 0
    )
    if (filterKeys.length) {
      const aliasMap = columnAliasMap.value
      base = base.filter((row) => {
        for (const k of filterKeys) {
          const set = tableVars.filterState[k]
          const alias = aliasMap[k]
          const val = row[k] !== undefined ? row[k] : alias ? row[alias] : undefined
          if (!set.has(String(val ?? ''))) return false
        }
        return true
      })
    }
    /**
     * 如果未排序，则直接返回原始数据
     */
    if (!tableVars.sortColumns.length) return base
    const sorted = [...base]
    const toNum = (v: string | number | null | undefined) => {
      const n = Number(v)
      return Number.isFinite(n) ? n : null
    }
    const aliasMap2 = columnAliasMap.value

    const getVal = (row: ChartDataVo.ChartData, key: string): string | number | undefined => {
      const alias = aliasMap2[key]
      const candidates: unknown[] = [row[key], alias ? row[alias] : undefined]
      for (const v of candidates) {
        if (typeof v === 'string' || typeof v === 'number') return v
      }
      return undefined
    }
    sorted.sort((a, b) => {
      for (const s of tableVars.sortColumns) {
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
    return sorted
  })

  /**
   * 容器样式
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

  return {
    tableData,
    activeData,
    tableColumns,
    columnAliasMap,
    tableContainerStyle
  }
}

/**
 * 重置表格状态
 */
export const resetTableVars = () => {
  // 重置 Konva 对象
  tableVars.stage = null
  tableVars.scrollbarLayer = null
  tableVars.centerBodyClipGroup = null
  tableVars.headerLayer = null
  tableVars.bodyLayer = null
  tableVars.summaryLayer = null
  tableVars.fixedHeaderLayer = null
  tableVars.fixedBodyLayer = null
  tableVars.fixedSummaryLayer = null
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
  tableVars.verticalScrollbarThumb = null
  tableVars.horizontalScrollbarThumb = null
  tableVars.highlightRect = null

  // 重置滚动相关
  tableVars.stageScrollY = 0
  tableVars.stageScrollX = 0

  // 重置列宽拖拽相关
  tableVars.columnWidthOverrides = {}
  tableVars.isResizingColumn = false
  tableVars.resizingColumnName = null
  tableVars.resizeStartX = 0
  tableVars.resizeStartWidth = 0
  tableVars.resizeNeighborColumnName = null
  tableVars.resizeNeighborStartWidth = 0

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

  // 重置悬停高亮相关
  tableVars.hoveredRowIndex = null
  tableVars.hoveredColIndex = null
  tableVars.lastClientX = 0
  tableVars.lastClientY = 0

  // 重置位置映射列表
  tableVars.headerPositionMapList.length = 0
  tableVars.bodyPositionMapList.length = 0
  tableVars.summaryPositionMapList.length = 0

  // 重置排序相关
  tableVars.sortColumns.length = 0

  // 重置过滤和汇总相关
  Object.keys(tableVars.filterState).forEach((key) => delete tableVars.filterState[key])
  Object.keys(tableVars.summaryState).forEach((key) => delete tableVars.summaryState[key])
}
