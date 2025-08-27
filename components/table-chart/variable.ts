import Konva from 'konva'
import { computed, reactive, ref, type ComputedRef } from 'vue'

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

/**
 * 表格全局状态变量
 */
export const tableVars = {
  // ========== Konva 对象 ==========
  /**
   * Stage 实例
   */
  stage: null as Konva.Stage | null,

  /**
   * 滚动条层（滚动条）
   */
  scrollbarLayer: null as Konva.Layer | null,

  /**
   * 中间区域剪辑组（中间区域）
   */
  centerBodyClipGroup: null as Konva.Group | null,

  /**
   * 表头层（固定表头）
   */
  headerLayer: null as Konva.Layer | null,

  /**
   * 表格层（主体）
   */
  bodyLayer: null as Konva.Layer | null,

  /**
   * 汇总层（汇总）
   */
  summaryLayer: null as Konva.Layer | null,

  /**
   * 固定表头层（固定表头）
   */
  fixedHeaderLayer: null as Konva.Layer | null,

  /**
   * 固定表body层（固定表body）
   */
  fixedBodyLayer: null as Konva.Layer | null,

  /**
   * 固定汇总层（固定汇总）
   */
  fixedSummaryLayer: null as Konva.Layer | null,

  /**
   * 左侧表头组（左侧表头）
   */
  leftHeaderGroup: null as Konva.Group | null,

  /**
   * 中间表头组（中间表头）
   */
  centerHeaderGroup: null as Konva.Group | null,

  /**
   * 右侧表头组（右侧表头）
   */
  rightHeaderGroup: null as Konva.Group | null,

  /**
   * 左侧主体组（左侧主体）
   */
  leftBodyGroup: null as Konva.Group | null,

  /**
   * 中间主体组（中间主体）
   */
  centerBodyGroup: null as Konva.Group | null,

  /**
   * 右侧主体组
   */
  rightBodyGroup: null as Konva.Group | null,

  /**
   * 左侧汇总组（左侧汇总）
   */
  leftSummaryGroup: null as Konva.Group | null,

  /**
   * 中间汇总组（中间汇总）
   */
  centerSummaryGroup: null as Konva.Group | null,

  /**
   * 右侧汇总组（右侧汇总）
   */
  rightSummaryGroup: null as Konva.Group | null,

  /**
   * 垂直滚动条组
   */
  verticalScrollbarGroup: null as Konva.Group | null,

  /**
   * 水平滚动条组
   */
  horizontalScrollbarGroup: null as Konva.Group | null,

  /**
   * 垂直滚动条滑块
   */
  verticalScrollbarThumb: null as Konva.Rect | null,

  /**
   * 水平滚动条滑块
   */
  horizontalScrollbarThumb: null as Konva.Rect | null,

  /**
   * 单元格选中状态
   */
  selectedCell: null as { rowIndex: number; colIndex: number; colKey: string } | null,

  /**
   * 高亮矩形
   */
  highlightRect: null as Konva.Rect | null,

  // ========== 滚动相关 ==========
  /**
   * 垂直滚动多少像素
   */
  stageScrollY: 0,

  /**
   * 水平滚动多少像素
   */
  scrollX: 0,

  // ========== 列宽拖拽相关状态 ==========
  /**
   * 列宽拖拽相关状态
   */
  columnWidthOverrides: {} as Record<string, number>,

  /**
   * 列宽拖拽状态
   */
  isResizingColumn: false,

  /**
   * 列宽拖拽列名
   */
  resizingColumnName: null as string | null,

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
  resizeNeighborColumnName: null as string | null,

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
  hoveredRowIndex: null as number | null,

  /**
   * 需要高亮的列索引
   */
  hoveredColIndex: null as number | null,

  /**
   * 最近一次指针的屏幕坐标（用于判断表格上是否存在遮罩层）
   */
  lastClientX: 0,
  lastClientY: 0,

  // ========== 位置映射列表 ==========
  headerPositionMapList: [] as PositionMap[],
  bodyPositionMapList: [] as PositionMap[],
  summaryPositionMapList: [] as PositionMap[]
}

/**
 * 创建表格状态管理器
 * @param props 组件 props
 * @param tableColumns 表格列配置
 * @param columnAliasMap 列别名映射
 */
export function createTableState(
  props: any,
  tableColumns: ComputedRef<any[]>,
  columnAliasMap: ComputedRef<Record<string, string>>
) {
  /**
   * 表格数据
   */
  const tableData = computed<Array<ChartDataVo.ChartData>>(() => props.data)

  /**
   * 排序状态
   */
  const sortColumns = ref<Array<{ columnName: string; order: 'asc' | 'desc' }>>([])

  /**
   * 过滤状态：列名 -> 选中的离散值集合（使用 Set 便于判定）
   */
  const filterState = reactive<Record<string, Set<string>>>({})

  /**
   * 汇总行选择状态：列名 -> 选中的规则
   */
  const summaryState = reactive<Record<string, string>>({})

  /**
   * 应用排序后的数据视图
   */
  const activeData = computed<Array<ChartDataVo.ChartData>>(() => {
    // 先按 filter 过滤
    let base = tableData.value.filter((row) => row && typeof row === 'object') // 过滤掉无效的行
    const filterKeys = Object.keys(filterState).filter((k) => filterState[k] && filterState[k].size > 0)
    if (filterKeys.length) {
      const aliasMap = columnAliasMap.value
      base = base.filter((row) => {
        for (const k of filterKeys) {
          const set = filterState[k]
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
    if (!sortColumns.value.length) return base
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
    return sorted
  })

  return {
    tableData,
    sortColumns,
    filterState,
    summaryState,
    activeData
  }
}

/**
 * 重置表格状态
 */
export function resetTableVars() {
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
  tableVars.selectedCell = null
  tableVars.highlightRect = null

  // 重置滚动相关
  tableVars.stageScrollY = 0
  tableVars.scrollX = 0

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
}
