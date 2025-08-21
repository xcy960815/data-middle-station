import Konva from 'konva'

export const parameterHandler = function () {
  /**
   * Stage 实例
   */
  let stage: Konva.Stage | null = null

  /**
   * 滚动条层（滚动条）
   */
  let scrollbarLayer: Konva.Layer | null = null

  /**
   * 中间区域剪辑组（中间区域）
   */
  let centerBodyClipGroup: Konva.Group | null = null

  /**
   * 表头层（固定表头）
   */
  let headerLayer: Konva.Layer | null = null

  /**
   * 表格层（主体）
   */
  let bodyLayer: Konva.Layer | null = null

  /**
   * 汇总层（汇总）
   */
  let summaryLayer: Konva.Layer | null = null

  /**
   * 固定表头层（固定表头）
   */
  let fixedHeaderLayer: Konva.Layer | null = null

  /**
   * 固定表body层（固定表body）
   */
  let fixedBodyLayer: Konva.Layer | null = null

  /**
   * 固定汇总层（固定汇总）
   */
  let fixedSummaryLayer: Konva.Layer | null = null

  /**
   * 左侧表头组（左侧表头）
   */
  let leftHeaderGroup: Konva.Group | null = null

  /**
   * 中间表头组（中间表头）
   */
  let centerHeaderGroup: Konva.Group | null = null

  /**
   * 右侧表头组（右侧表头）
   */
  let rightHeaderGroup: Konva.Group | null = null

  /**
   * 左侧主体组（左侧主体）
   */
  let leftBodyGroup: Konva.Group | null = null

  /**
   * 中间主体组（中间主体）
   */
  let centerBodyGroup: Konva.Group | null = null

  /**
   * 右侧主体组
   */
  let rightBodyGroup: Konva.Group | null = null

  /**
   * 左侧汇总组（左侧汇总）
   */
  let leftSummaryGroup: Konva.Group | null = null

  /**
   * 中间汇总组（中间汇总）
   */
  let centerSummaryGroup: Konva.Group | null = null

  /**
   * 右侧汇总组（右侧汇总）
   */
  let rightSummaryGroup: Konva.Group | null = null

  /**
   * 垂直滚动状态
   */
  let scrollY = 0

  /**
   * 水平滚动状态
   */
  let scrollX = 0

  /**
   * 垂直滚动条组
   */
  let verticalScrollbarGroup: Konva.Group | null = null

  /**
   * 水平滚动条组
   */
  let horizontalScrollbarGroup: Konva.Group | null = null

  /**
   * 垂直滚动条滑块
   */
  let verticalScrollbarThumb: Konva.Rect | null = null
  /**
   * 水平滚动条滑块
   */
  let horizontalScrollbarThumb: Konva.Rect | null = null

  /**
   * 列宽拖拽相关状态
   */
  const columnWidthOverrides: Record<string, number> = {}

  /**
   * 列宽拖拽状态
   */
  let isResizingColumn = false

  /**
   * 列宽拖拽列名
   */
  let resizingColumnName: string | null = null
  let resizeStartX = 0
  let resizeStartWidth = 0

  /**
   *
   */
  let resizeNeighborColumnName: string | null = null
  let resizeNeighborStartWidth = 0

  /**
   * 垂直滚动条拖拽状态
   */
  let isDraggingVerticalThumb = false
  /**
   * 水平滚动条拖拽状态
   */
  let isDraggingHorizontalThumb = false
  /**
   * 垂直滚动条拖拽起始 Y 坐标
   */
  let dragStartY = 0
  /**
   * 水平滚动条拖拽起始 X 坐标
   */
  let dragStartX = 0
  /**
   * 垂直滚动条拖拽起始滚动位置 Y
   */
  let dragStartScrollY = 0
  /**
   * 水平滚动条拖拽起始滚动位置 X
   */
  let dragStartScrollX = 0

  /**
   * 单元格选中状态
   */
  let selectedCell: { rowIndex: number; colIndex: number; colKey: string } | null = null
  /**
   * 高亮矩形
   */
  let highlightRect: Konva.Rect | null = null

  /**
   * 可视区域起始行索引
   */
  let visibleRowStart = 0

  /**
   * 可视区域结束行索引
   */
  let visibleRowEnd = 0

  /**
   * 上下缓冲行数
   */
  let visibleRowCount = 0

  /**
   * 需要高亮的行索引
   */
  let hoveredRowIndex: number | null = null
  /**
   * 需要高亮的列索引
   */
  let hoveredColIndex: number | null = null
  /**
   * 列需要高亮的矩形（表头）
   */
  let leftHeaderHoverRect: Konva.Rect | null = null
  /**
   * 表头列需要高亮的矩形（中间表头）
   */
  let centerHeaderHoverRect: Konva.Rect | null = null
  /**
   * 表头列需要高亮的矩形（右侧表头）
   */
  let rightHeaderHoverRect: Konva.Rect | null = null

  /**
   * 最近一次指针的屏幕坐标（用于判断表格上是否存在遮罩层）
   */
  let lastClientX = 0
  let lastClientY = 0
  return {
    stage,
    scrollbarLayer,
    centerBodyClipGroup,
    headerLayer,
    bodyLayer,
    summaryLayer,
    fixedHeaderLayer,
    fixedBodyLayer,
    fixedSummaryLayer,
    leftHeaderGroup,
    centerHeaderGroup,
    rightHeaderGroup,
    leftBodyGroup,
    centerBodyGroup,
    rightBodyGroup,
    leftSummaryGroup,
    centerSummaryGroup,
    rightSummaryGroup,
    scrollY,
    scrollX,
    verticalScrollbarGroup,
    horizontalScrollbarGroup,
    verticalScrollbarThumb,
    horizontalScrollbarThumb,
    columnWidthOverrides,

    selectedCell,
    highlightRect,
    visibleRowStart,
    visibleRowEnd,
    visibleRowCount,
    hoveredRowIndex,
    hoveredColIndex,
    leftHeaderHoverRect,
    centerHeaderHoverRect,

    rightHeaderHoverRect,
    lastClientX,
    lastClientY
  }
}
