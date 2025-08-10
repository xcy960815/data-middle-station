<template>
  <div id="container-table" class="container-table" :style="containerStyle"></div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Konva from 'konva'

/**
 * 获取容器元素
 * @returns {HTMLDivElement | null} 容器元素
 */
const getContainerEl = (): HTMLDivElement | null => {
  return document.getElementById('container-table') as HTMLDivElement | null
}

/**
 * 接收外部传入的数据与列配置及样式参数
 */
const props = withDefaults(
  defineProps<{
    /**
     * 数据
     */
    data: ChartDataDao.ChartData
    /**
     * 分组字段
     */
    xAxisFields: Array<GroupStore.GroupOption>
    /**
     * 维度字段
     */
    yAxisFields: Array<DimensionStore.DimensionOption>
    /**
     * 表格宽度
     */
    chartWidth?: number | string
    /**
     * 表格高度
     */
    chartHeight?: number | string
    /**
     * 表格边框
     */
    border?: boolean
    /**
     * 悬停填充颜色
     */
    hoverFill?: string
    /**
     * 表头高度
     */
    headerHeight?: number
    /**
     * 行高
     */
    rowHeight?: number
    /**
     * 滚动条大小
     */
    scrollbarSize?: number
    /**
     * 表格内边距
     */
    tablePadding?: number
    /**
     * 表头背景色
     */
    headerBg?: string
    /**
     * 表格奇数行背景色
     */
    bodyBgOdd?: string
    /**
     * 表格偶数行背景色
     */
    bodyBgEven?: string
    /**
     * 表格边框颜色
     */
    borderColor?: string
    /**
     * 表头文本颜色
     */
    headerTextColor?: string
    /**
     * 表格文本颜色
     */
    bodyTextColor?: string
    /**
     * 表头字体
     */
    headerFontFamily?: string
    /**
     * 表头字体大小
     */
    headerFontSize?: number
    /**
     * 表格内容字体
     */
    bodyFontFamily?: string
    /**
     * 表格内容字体大小
     */
    bodyFontSize?: number
    /**
     * 滚动条背景色
     */
    scrollbarBg?: string
    /**
     * 滚动条滑块颜色
     */
    scrollbarThumb?: string
    /**
     * 滚动条滑块悬停颜色
     */
    scrollbarThumbHover?: string
    /**
     * 上下缓冲行数
     */
    bufferRows?: number
    /**
     * 自动列最小宽度（当列未指定width时，均分剩余宽度，但不小于该值）
     */
    minAutoColWidth?: number
    /**
     * 滚动条拖拽容错阈值（像素），防止轻微鼠标移动意外触发滚动
     */
    scrollThreshold?: number
  }>(),
  {
    chartWidth: '100%',
    chartHeight: 460,
    border: false,
    hoverFill: 'rgba(24, 144, 255, 0.12)',
    headerHeight: 32,
    rowHeight: 32,
    scrollbarSize: 16,
    tablePadding: 0,
    headerBg: '#f7f7f9',
    bodyBgOdd: '#ffffff',
    bodyBgEven: '#fbfbfd',
    borderColor: '#dcdfe6',
    headerTextColor: '#303133',
    bodyTextColor: '#303133',
    headerFontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, Noto Sans, Ubuntu, sans-serif',
    headerFontSize: 14,
    bodyFontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, Noto Sans, Ubuntu, sans-serif',
    bodyFontSize: 13,
    scrollbarBg: '#f1f1f1',
    scrollbarThumb: '#c1c1c1',
    scrollbarThumbHover: '#a8a8a8',
    bufferRows: 5,
    minAutoColWidth: 100,
    scrollThreshold: 10
  }
)

/**
 * 定义事件
 */
const emits = defineEmits<{
  (
    event: 'cell-click',
    payload: { rowIndex: number; colIndex: number; colKey: string; rowData: ChartDataDao.ChartData[0] }
  ): void
}>()

/**
 * 所有列
 */
const allColumns = computed(
  () => props.xAxisFields.concat(props.yAxisFields) as Array<GroupStore.GroupOption | DimensionStore.DimensionOption>
)

/**
 * 表格数据
 */
const tableData = computed<ChartDataDao.ChartData>(() => (Array.isArray(props.data) ? props.data : []))

/**
 * 排序状态
 */
// 排序状态：单字段循环 asc -> desc -> null
const sortState = reactive<{ columnName: string | null; order: 'asc' | 'desc' | null }>({
  columnName: null,
  order: null
})

/**
 * 应用排序后的数据视图
 */
const activeData = computed<ChartDataDao.ChartData>(() => {
  if (!sortState.columnName || !sortState.order) return tableData.value
  const key = sortState.columnName as string
  const sorted = [...tableData.value]
  const toNum = (v: unknown) => {
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  }
  sorted.sort((a, b) => {
    const av = a[key] as unknown
    const bv = b[key] as unknown
    const an = toNum(av)
    const bn = toNum(bv)
    let cmp = 0
    if (an !== null && bn !== null) cmp = an - bn
    else cmp = String(av ?? '').localeCompare(String(bv ?? ''))
    return sortState.order === 'asc' ? cmp : -cmp
  })
  return sorted
})

/**
 * 布局与样式配置改为直接使用 props.xxx（已通过 withDefaults 提供默认值）
 */

/**
 * 舞台
 */
let stage: Konva.Stage | null = null

/**
 * 表头层
 */
let headerLayer: Konva.Layer | null = null

/**
 * 表格层
 */
let bodyLayer: Konva.Layer | null = null

/**
 * 固定列层
 */
let fixedLayer: Konva.Layer | null = null

/**
 * 固定表头层
 */
let fixedHeaderLayer: Konva.Layer | null = null

/**
 * 滚动条层
 */
let scrollbarLayer: Konva.Layer | null = null

/**
 * 中间区域剪辑组
 */
let centerBodyClipGroup: Konva.Group | null = null

/**
 * 左侧表头组
 */
let leftHeaderGroup: Konva.Group | null = null

/**
 * 中间表头组
 */
let centerHeaderGroup: Konva.Group | null = null

/**
 * 右侧表头组
 */
let rightHeaderGroup: Konva.Group | null = null

/**
 * 左侧主体组
 */
let leftBodyGroup: Konva.Group | null = null
let centerBodyGroup: Konva.Group | null = null
let rightBodyGroup: Konva.Group | null = null

/**
 * 滚动状态
 */
let scrollY = 0
let scrollX = 0

/**
 * 滚动条元素
 */
let vScrollbar: Konva.Group | null = null
let hScrollbar: Konva.Group | null = null

/**
 * 垂直滚动条滑块
 */
let vThumb: Konva.Rect | null = null
/**
 * 水平滚动条滑块
 */
let hThumb: Konva.Rect | null = null

/**
 * 拖拽状态
 */
let isDraggingVThumb = false // 垂直滚动条拖拽状态
let isDraggingHThumb = false // 水平滚动条拖拽状态
let dragStartY = 0 // 垂直滚动条拖拽起始位置
let dragStartX = 0 // 水平滚动条拖拽起始位置
let dragStartScrollY = 0 // 垂直滚动条拖拽起始位置
let dragStartScrollX = 0 // 水平滚动条拖拽起始位置

/**
 * 单元格选中状态
 */
let selectedCell: { rowIndex: number; colIndex: number; colKey: string } | null = null
/**
 * 高亮矩形
 */
let highlightRect: Konva.Rect | null = null

/**
 * 虚拟滚动状态
 */
let virtualScrollTop = 0
let visibleRowStart = 0
let visibleRowEnd = 0
/**
 * 上下缓冲行数
 */
let visibleRowCount = 0 // 可视区域行数

/**
 * 行悬停状态
 */
let hoveredRowIndex: number | null = null
/**
 * 列悬停状态
 */
let hoveredColIndex: number | null = null
/**
 * 左侧悬停矩形
 */
let leftHoverRect: Konva.Rect | null = null
/**
 * 中间悬停矩形
 */
let centerHoverRect: Konva.Rect | null = null
let rightHoverRect: Konva.Rect | null = null
/**
 * 列悬停矩形（表头）
 */
let headerHoverRect: Konva.Rect | null = null
/**
 * 列悬停矩形（左侧固定列）
 */
let leftColHoverRect: Konva.Rect | null = null
/**
 * 列悬停矩形（中间列）
 */
let centerColHoverRect: Konva.Rect | null = null
/**
 * 列悬停矩形（右侧固定列）
 */
let rightColHoverRect: Konva.Rect | null = null
/**
 * 表头列悬停矩形（中间表头）
 */
let centerHeaderHoverRect: Konva.Rect | null = null
/**
 * 表头列悬停矩形（右侧表头）
 */
let rightHeaderHoverRect: Konva.Rect | null = null

/**
 * 对象池
 */
interface ObjectPools {
  cellRects: Konva.Rect[]
  textNodes: Konva.Text[]
  backgroundRects: Konva.Rect[]
}

/**
 * 左侧主体组对象池
 */
const leftBodyPools: ObjectPools = { cellRects: [], textNodes: [], backgroundRects: [] }
/**
 * 中间主体组对象池
 */
const centerBodyPools: ObjectPools = { cellRects: [], textNodes: [], backgroundRects: [] }
/**
 * 右侧主体组对象池
 */
const rightBodyPools: ObjectPools = { cellRects: [], textNodes: [], backgroundRects: [] }

/**
 * 容器样式：支持外部传入 chartWidth、chartHeight 与 border
 */
const containerStyle = computed(() => {
  const height = typeof props.chartHeight === 'number' ? `${props.chartHeight}px` : (props.chartHeight ?? '460px')
  const width = typeof props.chartWidth === 'number' ? `${props.chartWidth}px` : (props.chartWidth ?? '100%')
  const borderStyle = props.border ? '1px solid #e5e7eb' : 'none'
  return {
    height,
    width,
    border: borderStyle,
    background: '#fff'
  } as Record<string, string>
})

// ===== 顶部：工具与计算函数 =====
/**
 * 计算左右固定列与中间列的分组与宽度汇总
 */
const getSplitColumns = () => {
  if (!stage) {
    // 如果stage还没有初始化，返回默认值
    const leftCols = allColumns.value.filter((c) => c.fixed === 'left')
    const rightCols = allColumns.value.filter((c) => c.fixed === 'right')
    const centerCols = allColumns.value.filter((c) => !c.fixed)
    return {
      leftCols,
      centerCols,
      rightCols,
      leftWidth: 0,
      centerWidth: 0,
      rightWidth: 0,
      totalWidth: 0
    }
  }

  const stageWidthRaw = stage.width()
  const stageHeightRaw = stage.height()
  const contentHeightForV = activeData.value.length * props.rowHeight
  const vBarPre = contentHeightForV > stageHeightRaw - props.headerHeight ? props.scrollbarSize : 0
  const stageWidth = stageWidthRaw - vBarPre

  // 计算已设置宽度的列的总宽度
  const fixedWidthColumns = allColumns.value.filter((c) => c.width !== undefined)
  const autoWidthColumns = allColumns.value.filter((c) => c.width === undefined)
  const fixedTotalWidth = fixedWidthColumns.reduce((acc, c) => acc + (c.width || 0), 0)

  // 计算自动宽度列应该分配的宽度
  const remainingWidth = Math.max(0, stageWidth - fixedTotalWidth)
  const rawAutoWidth = autoWidthColumns.length > 0 ? remainingWidth / autoWidthColumns.length : 0
  const autoColumnWidth = Math.max(props.minAutoColWidth, rawAutoWidth)

  // 为每个列计算最终宽度
  const columnsWithWidth = allColumns.value.map((col) => ({
    ...col,
    width: col.width !== undefined ? col.width : autoColumnWidth
  }))

  const leftCols = columnsWithWidth.filter((c) => c.fixed === 'left')
  const rightCols = columnsWithWidth.filter((c) => c.fixed === 'right')
  const centerCols = columnsWithWidth.filter((c) => !c.fixed)
  const sumWidth = (arr: Array<GroupStore.GroupOption | DimensionStore.DimensionOption>) =>
    arr.reduce((acc, c) => acc + (c.width || 0), 0)

  return {
    leftCols,
    centerCols,
    rightCols,
    leftWidth: sumWidth(leftCols),
    centerWidth: sumWidth(centerCols),
    rightWidth: sumWidth(rightCols),
    totalWidth: sumWidth(columnsWithWidth)
  }
}

/** 限制数值在[min, max] 区间内 */
const clamp = (n: number, min: number, max: number) => {
  return Math.max(min, Math.min(max, n))
}

/** 文本起始 X 坐标（包含左侧 8px 内边距） */
const getTextX = (x: number) => {
  // Simple left-aligned text with 8px padding
  return x + 8
}

/**
 * 超出最大宽度时裁剪文本，并追加省略号
 */
const truncateText = (text: string, maxWidth: number, fontSize: number, fontFamily: string): string => {
  // 创建一个临时文本节点来测量文本宽度
  const tempText = new Konva.Text({
    text: text,
    fontSize: fontSize,
    fontFamily: fontFamily
  })

  // 如果文本宽度小于等于 maxWidth，直接返回
  if (tempText.width() <= maxWidth) {
    tempText.destroy()
    return text
  }

  // 二分查找，找到最大可容纳的字符数
  let left = 0
  let right = text.length
  let result = ''

  while (left <= right) {
    const mid = Math.floor((left + right) / 2)
    const testText = text.substring(0, mid) + '...'

    tempText.text(testText)

    if (tempText.width() <= maxWidth) {
      result = testText
      left = mid + 1
    } else {
      right = mid - 1
    }
  }

  tempText.destroy()
  return result || '...'
}

//（已在顶部定义 getFromPool/returnToPool）

// ===== 底部：渲染与交互辅助 =====
/**
 * 在指定分组内创建单元格高亮矩形
 */
const createHighlightRect = (x: number, y: number, width: number, height: number, group: Konva.Group) => {
  if (highlightRect) {
    highlightRect.destroy()
    highlightRect = null
  }

  highlightRect = new Konva.Rect({
    x,
    y,
    width,
    height,
    fill: 'rgba(66, 165, 245, 0.3)',
    stroke: '#1976d2',
    strokeWidth: 2,
    listening: false
  })

  group.add(highlightRect)
  highlightRect.moveToTop()
  const layer = group.getLayer()
  layer?.batchDraw()
}

/**
 * 处理单元格点击，更新选中状态并抛出事件
 */
const handleCellClick = (
  rowIndex: number,
  colIndex: number,
  col: GroupStore.GroupOption | DimensionStore.DimensionOption,
  cellX: number,
  cellY: number,
  cellWidth: number,
  cellHeight: number,
  group: Konva.Group
) => {
  selectedCell = { rowIndex, colIndex, colKey: col.columnName }
  if (rowIndex >= visibleRowStart && rowIndex <= visibleRowEnd) {
    createHighlightRect(cellX, cellY, cellWidth, cellHeight, group)
  } else if (highlightRect) {
    highlightRect.destroy()
    highlightRect = null
  }

  const rowData = activeData.value[rowIndex]
  emits('cell-click', { rowIndex, colIndex, colKey: col.columnName, rowData })
}

/**
 * 获取滚动限制
 */
const getScrollLimits = () => {
  if (!stage) return { maxScrollX: 0, maxScrollY: 0 }

  const { totalWidth, leftWidth, rightWidth } = getSplitColumns()
  const stageWidth = stage.width()
  const stageHeight = stage.height()
  const contentHeight = activeData.value.length * props.rowHeight
  // 初步估算：不预留滚动条空间
  const visibleContentWidthNoV = stageWidth - leftWidth - rightWidth
  const contentHeightNoH = stageHeight - props.headerHeight
  const prelimMaxX = Math.max(0, totalWidth - leftWidth - rightWidth - visibleContentWidthNoV)
  const prelimMaxY = Math.max(0, contentHeight - contentHeightNoH)
  const vBar = prelimMaxY > 0 ? props.scrollbarSize : 0
  const hBar = prelimMaxX > 0 ? props.scrollbarSize : 0
  // 复算：考虑另一条滚动条占位
  const visibleContentWidth = stageWidth - leftWidth - rightWidth - vBar
  const maxScrollX = Math.max(0, totalWidth - leftWidth - rightWidth - visibleContentWidth)
  const maxScrollY = Math.max(0, contentHeight - (stageHeight - props.headerHeight - hBar))

  return { maxScrollX, maxScrollY }
}

/**
 * 计算虚拟滚动的可视区域（根据当前滚动位置得出渲染行范围）
 */
const calculateVisibleRows = () => {
  if (!stage) return

  const stageHeight = stage.height()
  const contentHeight = stageHeight - props.headerHeight - props.scrollbarSize

  // 计算可视区域能显示的行数
  visibleRowCount = Math.ceil(contentHeight / props.rowHeight)

  // 根据scrollY计算起始行
  const startRow = Math.floor(scrollY / props.rowHeight)

  // 添加缓冲区，确保滚动时有预渲染的行
  visibleRowStart = Math.max(0, startRow - props.bufferRows)
  visibleRowEnd = Math.min(activeData.value.length - 1, startRow + visibleRowCount + props.bufferRows)
}

/**
 * 对象池：获取或创建对象
 */
const getFromPool = <T extends Konva.Node>(pool: T[], createFn: () => T): T => {
  let obj = pool.pop()
  if (!obj) {
    obj = createFn()
  }
  return obj
}

/**
 * 对象池：回收对象
 */
const returnToPool = <T extends Konva.Node>(pool: T[], obj: T) => {
  obj.remove() // 从场景中移除
  pool.push(obj)
}

/**
 * 为固定列添加右边缘阴影效果
 */
const createFixedColumnShadow = () => {
  if (!stage || !bodyLayer || !headerLayer) return
  // 清除并不再绘制固定列阴影，以避免出现额外竖线
  const existingBodyShadow = stage.findOne('.fixedColumnBodyShadow')
  const existingHeaderShadow = stage.findOne('.fixedColumnHeaderShadow')
  if (existingBodyShadow) existingBodyShadow.destroy()
  if (existingHeaderShadow) existingHeaderShadow.destroy()
}

/**
 * 渲染表格
 */
const renderTable = () => {
  const el = getContainerEl()
  if (!el) return
  const width = el.clientWidth || 800
  const height = el.clientHeight || 420

  if (!stage) {
    stage = new Konva.Stage({ container: el, width, height })
  } else {
    stage.size({ width, height })
  }

  if (!headerLayer) {
    headerLayer = new Konva.Layer()
    stage.add(headerLayer)
  }

  if (!bodyLayer) {
    bodyLayer = new Konva.Layer()
    stage.add(bodyLayer)
  }

  if (!fixedLayer) {
    fixedLayer = new Konva.Layer()
    stage.add(fixedLayer)
  }

  if (!fixedHeaderLayer) {
    fixedHeaderLayer = new Konva.Layer()
    stage.add(fixedHeaderLayer)
  }

  if (!scrollbarLayer) {
    scrollbarLayer = new Konva.Layer()
    stage.add(scrollbarLayer)
  }

  const { leftWidth, rightWidth } = getSplitColumns()
  const { maxScrollX, maxScrollY } = getScrollLimits()
  const vBar = maxScrollY > 0 ? props.scrollbarSize : 0
  const hBar = maxScrollX > 0 ? props.scrollbarSize : 0
  const contentHeight = height - props.headerHeight - hBar

  // 创建中间区域剪辑组
  centerBodyClipGroup = new Konva.Group({
    x: leftWidth,
    y: props.headerHeight,
    clip: {
      x: 0,
      y: 0,
      width: width - leftWidth - rightWidth - vBar,
      height: contentHeight
    }
  })
  // 添加中间区域剪辑组到body层
  bodyLayer.add(centerBodyClipGroup)
}

/**
 * 清除分组
 */
const clearGroups = () => {
  headerLayer?.destroyChildren()
  bodyLayer?.destroyChildren()
  fixedLayer?.destroyChildren()
  fixedHeaderLayer?.destroyChildren()
  scrollbarLayer?.destroyChildren()

  // 清理对象池
  const clearPool = (pool: Konva.Node[]) => {
    pool.forEach((obj) => obj.destroy())
    pool.length = 0
  }

  clearPool(leftBodyPools.cellRects)
  clearPool(leftBodyPools.textNodes)
  clearPool(leftBodyPools.backgroundRects)
  clearPool(centerBodyPools.cellRects)
  clearPool(centerBodyPools.textNodes)
  clearPool(centerBodyPools.backgroundRects)
  clearPool(rightBodyPools.cellRects)
  clearPool(rightBodyPools.textNodes)
  clearPool(rightBodyPools.backgroundRects)

  // Reset scrollbar references
  vScrollbar = null
  hScrollbar = null
  vThumb = null
  hThumb = null

  // Reset centerBodyClipGroup reference
  centerBodyClipGroup = null

  // Reset cell selection
  selectedCell = null
  highlightRect = null

  // Reset virtual scrolling state
  visibleRowStart = 0
  visibleRowEnd = 0
  visibleRowCount = 0

  // Reset hover highlights
  hoveredRowIndex = null
  hoveredColIndex = null
  leftHoverRect = null
  centerHoverRect = null
  rightHoverRect = null
  headerHoverRect = null
  leftColHoverRect = null
  centerColHoverRect = null
  rightColHoverRect = null
  centerHeaderHoverRect = null
  rightHeaderHoverRect = null
}

/**
 * 重建分组
 */
const rebuildGroups = () => {
  if (!stage || !headerLayer || !bodyLayer || !fixedLayer || !fixedHeaderLayer || !scrollbarLayer) return

  const { leftCols, centerCols, rightCols, leftWidth, rightWidth } = getSplitColumns()
  const stageWidth = stage.width()
  const stageHeight = stage.height()
  const { maxScrollX, maxScrollY } = getScrollLimits()
  const vBar = maxScrollY > 0 ? props.scrollbarSize : 0
  const hBar = maxScrollX > 0 ? props.scrollbarSize : 0

  // Ensure centerBodyClipGroup exists
  if (!centerBodyClipGroup) {
    const contentHeight = stageHeight - props.headerHeight - hBar
    centerBodyClipGroup = new Konva.Group({
      x: leftWidth,
      y: props.headerHeight,
      clip: {
        x: 0,
        y: 0,
        width: stageWidth - leftWidth - rightWidth - vBar,
        height: contentHeight
      }
    })
    bodyLayer.add(centerBodyClipGroup)
  }

  leftHeaderGroup = new Konva.Group({ x: 0, y: 0, name: 'leftHeader' })
  centerHeaderGroup = new Konva.Group({ x: leftWidth - scrollX, y: 0, name: 'centerHeader' })
  rightHeaderGroup = new Konva.Group({
    x: stageWidth - rightWidth - vBar,
    y: 0,
    name: 'rightHeader'
  })

  leftBodyGroup = new Konva.Group({ x: 0, y: props.headerHeight - scrollY, name: 'leftBody' })
  centerBodyGroup = new Konva.Group({ x: -scrollX, y: -scrollY, name: 'centerBody' })
  rightBodyGroup = new Konva.Group({
    x: stageWidth - rightWidth - vBar,
    y: props.headerHeight - scrollY,
    name: 'rightBody'
  })

  // Add center scrollable header to header layer (lower layer)
  headerLayer.add(centerHeaderGroup)

  // Add fixed headers to fixed header layer (top layer)
  fixedHeaderLayer.add(leftHeaderGroup, rightHeaderGroup)

  // Add center scrollable content to clipped group
  centerBodyClipGroup.add(centerBodyGroup)

  // Add fixed columns to fixed layer (on top)
  fixedLayer.add(leftBodyGroup, rightBodyGroup)

  drawHeaderPart(leftHeaderGroup, leftCols, 0)
  drawHeaderPart(centerHeaderGroup, centerCols, 0)
  drawHeaderPart(rightHeaderGroup, rightCols, 0)

  // 使用虚拟滚动渲染body部分
  drawBodyPartVirtual(leftBodyGroup, leftCols, leftBodyPools)
  drawBodyPartVirtual(centerBodyGroup, centerCols, centerBodyPools)
  drawBodyPartVirtual(rightBodyGroup, rightCols, rightBodyPools)

  createScrollbars()

  headerLayer.batchDraw()
  bodyLayer?.batchDraw()
  fixedLayer?.batchDraw()
  fixedHeaderLayer?.batchDraw()
  scrollbarLayer?.batchDraw()
  // 重新计算可视区与 hover after sort/resize
  const p = stage.getPointerPosition()
  recomputeHoverIndexFromPointer(p?.y)
}

/**
 * 创建滚动条
 */
const createScrollbars = () => {
  if (!stage || !scrollbarLayer) return

  const stageWidth = stage.width()
  const stageHeight = stage.height()
  const { maxScrollX, maxScrollY } = getScrollLimits()

  // Vertical scrollbar（仅在需要时创建，同时创建表头遮罩）
  if (maxScrollY > 0) {
    const vScrollbarHeaderMask = new Konva.Rect({
      x: stageWidth - props.scrollbarSize,
      y: 0,
      width: props.scrollbarSize,
      height: props.headerHeight,
      fill: props.headerBg,
      stroke: props.borderColor,
      strokeWidth: 1
    })
    scrollbarLayer.add(vScrollbarHeaderMask)

    vScrollbar = new Konva.Group()
    scrollbarLayer.add(vScrollbar)

    const vTrack = new Konva.Rect({
      x: stageWidth - props.scrollbarSize,
      y: props.headerHeight,
      width: props.scrollbarSize,
      height: stageHeight - props.headerHeight - props.scrollbarSize,
      fill: props.scrollbarBg,
      stroke: props.borderColor,
      strokeWidth: 1
    })
    vScrollbar.add(vTrack)

    const thumbHeight = Math.max(
      20,
      ((stageHeight - props.headerHeight - props.scrollbarSize) *
        (stageHeight - props.headerHeight - props.scrollbarSize)) /
        (tableData.value.length * props.rowHeight)
    )
    const thumbY =
      props.headerHeight +
      (scrollY / maxScrollY) * (stageHeight - props.headerHeight - props.scrollbarSize - thumbHeight)

    vThumb = new Konva.Rect({
      x: stageWidth - props.scrollbarSize + 2,
      y: thumbY,
      width: props.scrollbarSize - 4,
      height: thumbHeight,
      fill: props.scrollbarThumb,
      cornerRadius: 2,
      draggable: false
    })
    vScrollbar.add(vThumb)

    setupVerticalScrollbarEvents()
  }

  // 水平滚动条
  if (maxScrollX > 0) {
    hScrollbar = new Konva.Group()
    scrollbarLayer.add(hScrollbar)

    const vBarForH = maxScrollY > 0 ? props.scrollbarSize : 0
    const hTrack = new Konva.Rect({
      x: 0,
      y: stageHeight - props.scrollbarSize,
      width: stageWidth - vBarForH,
      height: props.scrollbarSize,
      fill: props.scrollbarBg,
      stroke: props.borderColor,
      strokeWidth: 1
    })
    hScrollbar.add(hTrack)

    const { leftWidth, rightWidth, centerWidth } = getSplitColumns()
    const vBarForThumb = maxScrollY > 0 ? props.scrollbarSize : 0
    const visibleWidth = stageWidth - leftWidth - rightWidth - vBarForThumb
    const thumbWidth = Math.max(20, (visibleWidth * visibleWidth) / centerWidth)
    const thumbX = leftWidth + (scrollX / maxScrollX) * (visibleWidth - thumbWidth)

    hThumb = new Konva.Rect({
      x: thumbX,
      y: stageHeight - props.scrollbarSize + 2,
      width: thumbWidth,
      height: props.scrollbarSize - 4,
      fill: props.scrollbarThumb,
      cornerRadius: 2,
      draggable: false
    })
    hScrollbar.add(hThumb)

    setupHorizontalScrollbarEvents()
  }
}

/**
 * 绘制表头部分
 */
const drawHeaderPart = (
  group: Konva.Group | null,
  cols: Array<GroupStore.GroupOption | DimensionStore.DimensionOption>,
  startX: number
) => {
  if (!group) return

  // background
  const totalWidth = cols.reduce((acc, c) => acc + (c.width || 0), 0)
  const bg = new Konva.Rect({
    x: startX + props.tablePadding,
    y: 0,
    width: totalWidth,
    height: props.headerHeight,
    fill: props.headerBg,
    stroke: props.borderColor,
    strokeWidth: 1
  })
  group.add(bg)

  let x = startX
  cols.forEach((col) => {
    const cell = new Konva.Rect({
      x,
      y: 0,
      width: col.width || 0,
      height: props.headerHeight,
      stroke: props.borderColor,
      strokeWidth: 1,
      listening: true,
      cursor: 'pointer'
    })
    group.add(cell)

    // 预留箭头区域，避免文本与箭头重叠
    const maxTextWidth = (col.width || 0) - 18 // 预留 ~18px 给排序箭头
    const fontFamily = props.headerFontFamily
    const fontSize = props.headerFontSize
    const truncatedTitle = truncateText(col.displayName, maxTextWidth, fontSize, fontFamily)

    const label = new Konva.Text({
      x: getTextX(x),
      y: props.headerHeight / 2,
      text: truncatedTitle,
      fontSize: fontSize,
      fontFamily: fontFamily,
      fill: props.headerTextColor,
      align: 'left',
      verticalAlign: 'middle'
    })
    label.offsetY(label.height() / 2)
    group.add(label)

    // 排序箭头（三角形 ▲/▼），更紧凑与清晰
    const isActiveCol = sortState.columnName === col.columnName
    const activeColor = '#409EFF'
    const inactiveColor = '#C0C4CC'
    const upColor = isActiveCol && sortState.order === 'asc' ? activeColor : inactiveColor
    const downColor = isActiveCol && sortState.order === 'desc' ? activeColor : inactiveColor

    const arrowX = x + (col.width || 0) - 10 // 更靠右，紧凑
    const centerY = props.headerHeight / 2
    const arrowSize = 5
    const gap = 2

    const upTriangle = new Konva.RegularPolygon({
      x: arrowX,
      y: centerY - (arrowSize + gap) / 2,
      sides: 3,
      radius: arrowSize,
      rotation: 0,
      fill: upColor,
      listening: false
    })
    const downTriangle = new Konva.RegularPolygon({
      x: arrowX,
      y: centerY + (arrowSize + gap) / 2,
      sides: 3,
      radius: arrowSize,
      rotation: 180,
      fill: downColor,
      listening: false
    })
    group.add(upTriangle)
    group.add(downTriangle)

    // 点击表头切换排序
    cell.on('click', () => {
      if (sortState.columnName === col.columnName) {
        sortState.order = sortState.order === 'asc' ? 'desc' : sortState.order === 'desc' ? null : 'asc'
        if (!sortState.order) sortState.columnName = null
      } else {
        sortState.columnName = col.columnName
        sortState.order = 'asc'
      }
      // 重新构建
      clearGroups()
      rebuildGroups()
    })

    x += col.width || 0
  })

  // 表头渲染完成后，如果是左侧表头，创建固定列阴影
  if (group && group.name() === 'leftHeader') {
    // 延迟创建阴影，确保所有内容都已渲染
    setTimeout(() => createFixedColumnShadow(), 0)
  }
}
/**
 * 设置垂直滚动条事件
 */
const setupVerticalScrollbarEvents = () => {
  if (!vThumb || !stage) return

  vThumb.on('mousedown', (e) => {
    isDraggingVThumb = true
    dragStartY = e.evt.clientY
    dragStartScrollY = scrollY
    stage!.container().style.cursor = 'grabbing'
  })

  vThumb.on('mouseenter', () => {
    if (vThumb) vThumb.fill(props.scrollbarThumbHover)
    scrollbarLayer?.batchDraw()
  })

  vThumb.on('mouseleave', () => {
    if (vThumb && !isDraggingVThumb) vThumb.fill(props.scrollbarThumb)
    scrollbarLayer?.batchDraw()
  })
}

/**
 * 设置水平滚动条事件
 */
const setupHorizontalScrollbarEvents = () => {
  if (!hThumb || !stage) return

  hThumb.on('mousedown', (e) => {
    isDraggingHThumb = true
    dragStartX = e.evt.clientX
    dragStartScrollX = scrollX
    stage!.container().style.cursor = 'grabbing'
  })

  hThumb.on('mouseenter', () => {
    if (hThumb) hThumb.fill(props.scrollbarThumbHover)
    scrollbarLayer?.batchDraw()
  })

  hThumb.on('mouseleave', () => {
    if (hThumb && !isDraggingHThumb) hThumb.fill(props.scrollbarThumb)
    scrollbarLayer?.batchDraw()
  })
}

/**
 * 虚拟滚动版本的drawBodyPart - 只渲染可视区域的行
 */
const drawBodyPartVirtual = (
  group: Konva.Group | null,
  cols: Array<GroupStore.GroupOption | DimensionStore.DimensionOption>,
  pools: ObjectPools
) => {
  if (!stage || !group) return

  // 计算可视区域
  calculateVisibleRows()
  // 切片渲染期间暂存当前指针位置，避免 getPointerPosition 在拖拽中为 null
  const pointerPosSnapshot = stage.getPointerPosition()

  const totalWidth = cols.reduce((acc, c) => acc + (c.width || 0), 0)

  // 清空当前组，将对象返回池中
  const children = group.children.slice() // 复制数组避免修改时的问题
  children.forEach((child) => {
    if (child instanceof Konva.Rect) {
      // 检查是否为阴影元素
      if (child.name() === 'fixedColumnShadow') {
        child.destroy() // 阴影元素直接销毁，不回收到池中
      } else if (child.name() && child.name().startsWith('hoverRect')) {
        // 保留 hover 高亮矩形，不回收到池中
        return
      } else if (child.fill() && child.fill() !== 'transparent') {
        // 背景矩形
        returnToPool(pools.backgroundRects, child as Konva.Rect)
      } else {
        // 单元格边框矩形
        returnToPool(pools.cellRects, child as Konva.Rect)
      }
    } else if (child instanceof Konva.Text) {
      returnToPool(pools.textNodes, child as Konva.Text)
    }
  })

  // 渲染可视区域的行
  for (let rowIndex = visibleRowStart; rowIndex <= visibleRowEnd; rowIndex++) {
    const row = activeData.value[rowIndex]
    const y = rowIndex * props.rowHeight

    // 创建背景条纹
    const bg = getFromPool(pools.backgroundRects, () => new Konva.Rect({ listening: false }))

    bg.x(0)
    bg.y(y)
    bg.width(totalWidth)
    bg.height(props.rowHeight)
    bg.fill(rowIndex % 2 === 0 ? props.bodyBgOdd : props.bodyBgEven)
    bg.stroke('')
    bg.strokeWidth(0)
    group.add(bg)

    // hover 高亮统一由 createOrUpdateHoverRects 管理

    // 渲染每列的单元格
    let x = 0
    cols.forEach((col, colIndex) => {
      // 创建单元格边框
      const cell = getFromPool(pools.cellRects, () => new Konva.Rect({ listening: true, cursor: 'pointer' }))

      cell.x(x)
      cell.y(y)
      cell.width(col.width || 0)
      cell.height(props.rowHeight)
      cell.stroke(props.borderColor)
      cell.strokeWidth(1)
      cell.fill('transparent')

      // 清除之前的事件监听器
      cell.off('click')

      // 添加点击事件
      cell.on('click', () => {
        handleCellClick(rowIndex, colIndex, col, cell.x(), cell.y(), col.width || 0, props.rowHeight, group)
      })
      group.add(cell)

      // 创建文本
      const value = String(row[col.columnName] ?? '')
      const maxTextWidth = (col.width || 0) - 16
      const fontFamily = props.bodyFontFamily
      const fontSize = props.bodyFontSize
      const truncatedValue = truncateText(value, maxTextWidth, fontSize, fontFamily)

      const textNode = getFromPool(pools.textNodes, () => new Konva.Text({ listening: false }))

      textNode.x(getTextX(x))
      textNode.y(y + props.rowHeight / 2)
      textNode.text(truncatedValue)
      textNode.fontSize(fontSize)
      textNode.fontFamily(fontFamily)
      textNode.fill(props.bodyTextColor)
      textNode.align('left')
      textNode.verticalAlign('middle')
      textNode.offsetY(textNode.height() / 2)
      group.add(textNode)

      x += col.width || 0
    })
  }

  // 检查是否需要重新创建高亮（选中的单元格在当前可视区域内）
  if (selectedCell && selectedCell.rowIndex >= visibleRowStart && selectedCell.rowIndex <= visibleRowEnd) {
    // 找到选中的列在当前组中的位置
    const selectedColIndex = cols.findIndex((col) => col.columnName === selectedCell!.colKey)
    if (selectedColIndex >= 0) {
      // 计算高亮位置
      let highlightX = 0
      for (let i = 0; i < selectedColIndex; i++) {
        highlightX += cols[i].width || 0
      }
      const highlightY = selectedCell!.rowIndex * props.rowHeight
      const highlightWidth = cols[selectedColIndex].width || 0

      // 重新创建高亮
      createHighlightRect(highlightX, highlightY, highlightWidth, props.rowHeight, group)
    }
  }

  // 渲染完成后，用快照位置重新计算 hover，保证滚动、重绘后仍然可见
  if (pointerPosSnapshot) {
    recomputeHoverIndexFromPointer(pointerPosSnapshot.y, pointerPosSnapshot.x)
  } else {
    createOrUpdateHoverRects()
  }
}

// 基于当前指针位置重新计算 hoveredRowIndex 和 hoveredColIndex 并更新 hover 矩形
const recomputeHoverIndexFromPointer = (localY?: number, localX?: number) => {
  if (!stage) return
  const pointerPos = stage.getPointerPosition()
  if (!pointerPos) {
    // 保持原有 hover，不做清空，等待下一次可用位置再更新
    return
  }

  // 计算行索引
  if (localY === undefined) {
    localY = pointerPos.y
  }
  const withinContent = localY >= props.headerHeight && localY <= stage.height() - props.scrollbarSize
  const newHoverRowIndex = withinContent
    ? (() => {
        const yInContent = localY! - props.headerHeight + scrollY
        const idx = Math.floor(yInContent / props.rowHeight)
        return idx >= 0 && idx < tableData.value.length ? idx : null
      })()
    : null

  // 计算列索引
  if (localX === undefined) {
    localX = pointerPos.x
  }
  const { leftCols, centerCols, rightCols, leftWidth, rightWidth } = getSplitColumns()
  const stageWidth = stage.width()
  const rightStartX = stageWidth - rightWidth - props.scrollbarSize

  let newHoverColIndex: number | null = null

  // 判断鼠标在哪个区域，计算全局列索引
  if (localX < leftWidth) {
    // 左侧固定列区域
    let currentX = 0
    for (let i = 0; i < leftCols.length; i++) {
      const colWidth = leftCols[i].width || 0
      if (localX >= currentX && localX < currentX + colWidth) {
        // 找到对应的全局列索引
        const globalColIndex = allColumns.value.findIndex((col) => col.columnName === leftCols[i].columnName)
        newHoverColIndex = globalColIndex >= 0 ? globalColIndex : null
        break
      }
      currentX += colWidth
    }
  } else if (localX >= rightStartX) {
    // 右侧固定列区域
    let currentX = rightStartX
    for (let i = 0; i < rightCols.length; i++) {
      const colWidth = rightCols[i].width || 0
      if (localX >= currentX && localX < currentX + colWidth) {
        // 找到对应的全局列索引
        const globalColIndex = allColumns.value.findIndex((col) => col.columnName === rightCols[i].columnName)
        newHoverColIndex = globalColIndex >= 0 ? globalColIndex : null
        break
      }
      currentX += colWidth
    }
  } else {
    // 中间滚动区域
    const centerX = localX - leftWidth + scrollX
    let currentX = 0
    for (let i = 0; i < centerCols.length; i++) {
      const colWidth = centerCols[i].width || 0
      if (centerX >= currentX && centerX < currentX + colWidth) {
        // 找到对应的全局列索引
        const globalColIndex = allColumns.value.findIndex((col) => col.columnName === centerCols[i].columnName)
        newHoverColIndex = globalColIndex >= 0 ? globalColIndex : null
        break
      }
      currentX += colWidth
    }
  }

  // 更新状态并重新渲染
  const rowChanged = newHoverRowIndex !== hoveredRowIndex
  const colChanged = newHoverColIndex !== hoveredColIndex

  if (rowChanged) {
    hoveredRowIndex = newHoverRowIndex
  }
  if (colChanged) {
    hoveredColIndex = newHoverColIndex
  }

  if (rowChanged || colChanged) {
    createOrUpdateHoverRects()
  }

  // 若仍无 hover（例如鼠标位于内容区域外），强制刷新一次矩形显隐，避免残留
  if (hoveredRowIndex === null && hoveredColIndex === null) {
    createOrUpdateHoverRects()
  }
}

// 创建或更新行和列的 hover 高亮矩形
const createOrUpdateHoverRects = () => {
  if (!stage || !leftBodyGroup || !centerBodyGroup || !rightBodyGroup) return
  const { leftCols, centerCols, rightCols, leftWidth, rightWidth } = getSplitColumns()

  // 更新行高亮矩形
  const updateRowRect = (
    rectRef: Konva.Rect | null,
    group: Konva.Group | null,
    totalWidth: number,
    name: string
  ): Konva.Rect | null => {
    if (!group) return null
    const y = hoveredRowIndex === null ? 0 : hoveredRowIndex * props.rowHeight
    const shouldShow =
      hoveredRowIndex !== null && hoveredRowIndex >= visibleRowStart && hoveredRowIndex <= visibleRowEnd
    if (!rectRef) {
      rectRef = new Konva.Rect({
        x: 0,
        y,
        width: totalWidth,
        height: props.rowHeight,
        fill: props.hoverFill,
        listening: false,
        visible: shouldShow,
        name
      })
      group.add(rectRef)
      rectRef.moveToTop()
    } else {
      rectRef.y(y)
      rectRef.width(totalWidth)
      rectRef.height(props.rowHeight)
      rectRef.visible(shouldShow)
      rectRef.moveToTop()
    }
    return rectRef
  }

  // 更新列高亮矩形
  const updateColRect = (
    rectRef: Konva.Rect | null,
    group: Konva.Group | null,
    colIndex: number,
    cols: Array<GroupStore.GroupOption | DimensionStore.DimensionOption>,
    name: string
  ): Konva.Rect | null => {
    if (!group || hoveredColIndex === null) return rectRef

    // 根据全局列索引找到对应的列
    const targetCol = allColumns.value[colIndex]
    if (!targetCol) {
      if (rectRef) {
        rectRef.visible(false)
      }
      return rectRef
    }

    // 检查目标列是否在当前组中
    const targetColIndex = cols.findIndex((col) => col.columnName === targetCol.columnName)
    if (targetColIndex === -1) {
      // 隐藏不在当前组的列高亮
      if (rectRef) {
        rectRef.visible(false)
      }
      return rectRef
    }

    // 计算列的位置和宽度
    let colX = 0
    let colWidth = 0
    for (let i = 0; i < cols.length; i++) {
      if (i === targetColIndex) {
        colWidth = cols[i].width || 0
        break
      }
      colX += cols[i].width || 0
    }

    const shouldShow = hoveredColIndex === colIndex
    const totalHeight = activeData.value.length * props.rowHeight

    if (!rectRef) {
      rectRef = new Konva.Rect({
        x: colX,
        y: 0,
        width: colWidth,
        height: totalHeight,
        fill: props.hoverFill,
        listening: false,
        visible: shouldShow,
        name
      })
      group.add(rectRef)
      rectRef.moveToTop()
    } else {
      rectRef.x(colX)
      rectRef.y(0)
      rectRef.width(colWidth)
      rectRef.height(totalHeight)
      rectRef.visible(shouldShow)
      rectRef.moveToTop()
    }
    return rectRef
  }

  const leftTotal = leftCols.reduce((acc, c) => acc + (c.width || 0), 0)
  const centerTotal = centerCols.reduce((acc, c) => acc + (c.width || 0), 0)
  const rightTotal = rightCols.reduce((acc, c) => acc + (c.width || 0), 0)

  // 更新行高亮
  leftHoverRect = updateRowRect(leftHoverRect, leftBodyGroup, leftTotal, 'hoverRect-left')
  centerHoverRect = updateRowRect(centerHoverRect, centerBodyGroup, centerTotal, 'hoverRect-center')
  rightHoverRect = updateRowRect(rightHoverRect, rightBodyGroup, rightTotal, 'hoverRect-right')

  // 更新列高亮
  if (hoveredColIndex !== null) {
    leftColHoverRect = updateColRect(leftColHoverRect, leftBodyGroup, hoveredColIndex, leftCols, 'hoverColRect-left')
    centerColHoverRect = updateColRect(
      centerColHoverRect,
      centerBodyGroup,
      hoveredColIndex,
      centerCols,
      'hoverColRect-center'
    )
    rightColHoverRect = updateColRect(
      rightColHoverRect,
      rightBodyGroup,
      hoveredColIndex,
      rightCols,
      'hoverColRect-right'
    )
  } else {
    // 隐藏所有列高亮
    if (leftColHoverRect) leftColHoverRect.visible(false)
    if (centerColHoverRect) centerColHoverRect.visible(false)
    if (rightColHoverRect) rightColHoverRect.visible(false)
  }

  // 更新表头列高亮
  const updateHeaderColRect = (
    rectRef: Konva.Rect | null,
    group: Konva.Group | null,
    colIndex: number,
    cols: Array<GroupStore.GroupOption | DimensionStore.DimensionOption>,
    name: string
  ): Konva.Rect | null => {
    if (!group || hoveredColIndex === null) return rectRef

    // 根据全局列索引找到对应的列
    const targetCol = allColumns.value[colIndex]
    if (!targetCol) {
      if (rectRef) {
        rectRef.visible(false)
      }
      return rectRef
    }

    // 检查目标列是否在当前组中
    const targetColIndex = cols.findIndex((col) => col.columnName === targetCol.columnName)
    if (targetColIndex === -1) {
      // 隐藏不在当前组的列高亮
      if (rectRef) {
        rectRef.visible(false)
      }
      return rectRef
    }

    // 计算列的位置和宽度
    let colX = 0
    let colWidth = 0
    for (let i = 0; i < cols.length; i++) {
      if (i === targetColIndex) {
        colWidth = cols[i].width || 0
        break
      }
      colX += cols[i].width || 0
    }

    const shouldShow = hoveredColIndex === colIndex

    if (!rectRef) {
      rectRef = new Konva.Rect({
        x: colX,
        y: 0,
        width: colWidth,
        height: props.headerHeight,
        fill: props.hoverFill,
        listening: false,
        visible: shouldShow,
        name
      })
      group.add(rectRef)
      rectRef.moveToTop()
    } else {
      rectRef.x(colX)
      rectRef.y(0)
      rectRef.width(colWidth)
      rectRef.height(props.headerHeight)
      rectRef.visible(shouldShow)
      rectRef.moveToTop()
    }
    return rectRef
  }

  // 更新表头列高亮
  if (hoveredColIndex !== null) {
    // 先隐藏所有表头列高亮
    if (headerHoverRect) headerHoverRect.visible(false)
    if (centerHeaderHoverRect) centerHeaderHoverRect.visible(false)
    if (rightHeaderHoverRect) rightHeaderHoverRect.visible(false)

    // 然后只显示当前悬停列的高亮
    headerHoverRect = updateHeaderColRect(
      headerHoverRect,
      leftHeaderGroup,
      hoveredColIndex,
      leftCols,
      'hoverHeaderRect-left'
    )
    centerHeaderHoverRect = updateHeaderColRect(
      centerHeaderHoverRect,
      centerHeaderGroup,
      hoveredColIndex,
      centerCols,
      'hoverHeaderRect-center'
    )
    rightHeaderHoverRect = updateHeaderColRect(
      rightHeaderHoverRect,
      rightHeaderGroup,
      hoveredColIndex,
      rightCols,
      'hoverHeaderRect-right'
    )
  } else {
    // 隐藏所有表头列高亮
    if (headerHoverRect) headerHoverRect.visible(false)
    if (centerHeaderHoverRect) centerHeaderHoverRect.visible(false)
    if (rightHeaderHoverRect) rightHeaderHoverRect.visible(false)
  }

  bodyLayer?.batchDraw()
  fixedLayer?.batchDraw()
  headerLayer?.batchDraw()
  fixedHeaderLayer?.batchDraw()
}

const updateVerticalScroll = (offsetY: number) => {
  if (!stage || !leftBodyGroup || !centerBodyGroup || !rightBodyGroup) return
  const { maxScrollY } = getScrollLimits()
  const oldScrollY = scrollY
  scrollY = clamp(scrollY + offsetY, 0, maxScrollY)

  // 检查是否需要重新渲染（滚动超过一定阈值或可视区域改变）
  const oldVisibleStart = visibleRowStart
  const oldVisibleEnd = visibleRowEnd
  calculateVisibleRows()

  const needsRerender =
    visibleRowStart !== oldVisibleStart ||
    visibleRowEnd !== oldVisibleEnd ||
    Math.abs(scrollY - oldScrollY) > props.rowHeight * 2 // 滚动超过2行时强制重新渲染

  // const needsRerender = true

  if (needsRerender) {
    // 重新渲染可视区域
    const { leftCols, centerCols, rightCols } = getSplitColumns()
    drawBodyPartVirtual(leftBodyGroup, leftCols, leftBodyPools)
    drawBodyPartVirtual(centerBodyGroup, centerCols, centerBodyPools)
    drawBodyPartVirtual(rightBodyGroup, rightCols, rightBodyPools)
  }

  const bodyY = props.headerHeight - scrollY
  const centerY = -scrollY

  // Only body content moves vertically, headers stay fixed
  leftBodyGroup.y(bodyY)
  rightBodyGroup.y(bodyY)
  centerBodyGroup.y(centerY)

  updateScrollbars()
  bodyLayer?.batchDraw()
  fixedLayer?.batchDraw()

  // 垂直滚动时同步 hover 矩形位置/显示：优先使用最近的指针坐标
  const p = stage.getPointerPosition()
  recomputeHoverIndexFromPointer(p?.y, p?.x)
}

const updateHorizontalScroll = (offsetX: number) => {
  if (!stage || !centerHeaderGroup || !centerBodyGroup) return
  const { maxScrollX } = getScrollLimits()
  const { leftWidth } = getSplitColumns()
  scrollX = clamp(scrollX + offsetX, 0, maxScrollX)

  const headerX = leftWidth - scrollX
  const centerX = -scrollX

  // Only center scrollable content moves horizontally
  centerHeaderGroup.x(headerX)
  centerBodyGroup.x(centerX)

  updateScrollbars()
  headerLayer?.batchDraw()
  bodyLayer?.batchDraw()

  // 横向滚动时也保持 hover 矩形可见（宽度不变，仅 redraw）
  const p2 = stage.getPointerPosition()
  recomputeHoverIndexFromPointer(p2?.y, p2?.x)
}

const updateScrollbars = () => {
  if (!stage) return

  const stageWidth = stage.width()
  const stageHeight = stage.height()
  const { maxScrollX, maxScrollY } = getScrollLimits()

  // Update vertical thumb position
  if (vThumb && maxScrollY > 0) {
    const thumbHeight = Math.max(
      20,
      ((stageHeight - props.headerHeight - props.scrollbarSize) *
        (stageHeight - props.headerHeight - props.scrollbarSize)) /
        (tableData.value.length * props.rowHeight)
    )
    const thumbY =
      props.headerHeight +
      (scrollY / maxScrollY) * (stageHeight - props.headerHeight - props.scrollbarSize - thumbHeight)
    vThumb.y(thumbY)
  }

  // Update horizontal thumb position
  if (hThumb && maxScrollX > 0) {
    const { leftWidth, rightWidth, centerWidth } = getSplitColumns()
    const visibleWidth = stageWidth - leftWidth - rightWidth - props.scrollbarSize
    const thumbWidth = Math.max(20, (visibleWidth * visibleWidth) / centerWidth)
    const thumbX = leftWidth + (scrollX / maxScrollX) * (visibleWidth - thumbWidth)
    hThumb.x(thumbX)
  }

  scrollbarLayer?.batchDraw()
}

const handleWheel = (e: WheelEvent) => {
  e.preventDefault()
  const hasDeltaX = Math.abs(e.deltaX) > 0
  const hasDeltaY = Math.abs(e.deltaY) > 0
  // 兼容 Shift + 滚轮用于横向滚动（常见于鼠标）
  if (e.shiftKey && !hasDeltaX && hasDeltaY) {
    updateHorizontalScroll(e.deltaY)
    return
  }
  // 触控板或支持横向滚轮的鼠标
  if (hasDeltaX) updateHorizontalScroll(e.deltaX)
  if (hasDeltaY) updateVerticalScroll(e.deltaY)
}

const handleMouseMove = (e: MouseEvent) => {
  if (!stage) return

  if (isDraggingVThumb) {
    const deltaY = e.clientY - dragStartY
    // 添加容错机制：只有当垂直移动距离超过阈值时才触发滚动
    const threshold = props.scrollThreshold
    if (Math.abs(deltaY) < threshold) return

    const { maxScrollY } = getScrollLimits()
    const stageHeight = stage.height()
    const trackHeight = stageHeight - props.headerHeight - props.scrollbarSize
    const thumbHeight = Math.max(20, (trackHeight * trackHeight) / (tableData.value.length * props.rowHeight))
    const scrollRatio = deltaY / (trackHeight - thumbHeight)
    const newScrollY = dragStartScrollY + scrollRatio * maxScrollY

    const oldScrollY = scrollY
    scrollY = clamp(newScrollY, 0, maxScrollY)

    // 检查是否需要重新渲染虚拟滚动内容
    const oldVisibleStart = visibleRowStart
    const oldVisibleEnd = visibleRowEnd
    calculateVisibleRows()

    const needsRerender =
      visibleRowStart !== oldVisibleStart ||
      visibleRowEnd !== oldVisibleEnd ||
      Math.abs(scrollY - oldScrollY) > props.rowHeight * 2

    if (needsRerender) {
      // 重新渲染可视区域
      const { leftCols, centerCols, rightCols } = getSplitColumns()
      drawBodyPartVirtual(leftBodyGroup, leftCols, leftBodyPools)
      drawBodyPartVirtual(centerBodyGroup, centerCols, centerBodyPools)
      drawBodyPartVirtual(rightBodyGroup, rightCols, rightBodyPools)
    }

    updateScrollPositions()
  }

  if (isDraggingHThumb) {
    const deltaX = e.clientX - dragStartX
    // 添加容错机制：只有当水平移动距离超过阈值时才触发滚动
    const threshold = props.scrollThreshold
    if (Math.abs(deltaX) < threshold) return

    const { maxScrollX } = getScrollLimits()
    const { leftWidth, rightWidth, centerWidth } = getSplitColumns()
    const stageWidth = stage.width()
    const visibleWidth = stageWidth - leftWidth - rightWidth - props.scrollbarSize
    const thumbWidth = Math.max(20, (visibleWidth * visibleWidth) / centerWidth)
    const scrollRatio = deltaX / (visibleWidth - thumbWidth)
    const newScrollX = dragStartScrollX + scrollRatio * maxScrollX

    scrollX = clamp(newScrollX, 0, maxScrollX)
    updateScrollPositions()
  }

  // 普通移动时，更新 hoveredRowIndex 和 hoveredColIndex，并同步 hover 矩形
  if (!isDraggingVThumb && !isDraggingHThumb && stage) {
    const pointerPos = stage.getPointerPosition()
    if (pointerPos) {
      recomputeHoverIndexFromPointer()
    }
  }
}

const handleMouseUp = () => {
  if (isDraggingVThumb || isDraggingHThumb) {
    isDraggingVThumb = false
    isDraggingHThumb = false
    if (stage) stage.container().style.cursor = 'default'

    if (vThumb && !isDraggingVThumb) vThumb.fill(props.scrollbarThumb)
    if (hThumb && !isDraggingHThumb) hThumb.fill(props.scrollbarThumb)
    scrollbarLayer?.batchDraw()
  }
}

const updateScrollPositions = () => {
  if (!leftBodyGroup || !centerBodyGroup || !rightBodyGroup || !centerHeaderGroup) return

  const { leftWidth } = getSplitColumns()
  const bodyY = props.headerHeight - scrollY
  const centerX = -scrollX
  const headerX = leftWidth - scrollX

  // Update fixed columns (only Y position changes)
  leftBodyGroup.y(bodyY)
  rightBodyGroup.y(bodyY)

  // Update center scrollable content (both X and Y)
  centerBodyGroup.x(centerX)
  centerBodyGroup.y(-scrollY)

  // Update center header (only X position changes)
  centerHeaderGroup.x(headerX)

  // Fixed headers (leftHeaderGroup and rightHeaderGroup) never move - they stay at (0,0) and fixed right position

  updateScrollbars()
  headerLayer?.batchDraw()
  bodyLayer?.batchDraw()
  fixedLayer?.batchDraw()
  fixedHeaderLayer?.batchDraw()
}

/**
 * 处理窗口大小改变
 */
const handleResize = () => {
  renderTable()

  // 重新计算可视区域（窗口大小改变时）
  calculateVisibleRows()

  // Rebuild groups to adjust right pinned x position
  clearGroups()
  rebuildGroups()

  // 重新创建固定列阴影
  setTimeout(() => createFixedColumnShadow(), 0)
}

/**
 * 从 props 初始化 初始化表格
 */
const refreshTable = (resetScroll: boolean) => {
  // 列与数据直接使用 allColumns/tableData

  // 样式/布局配置直接使用 props（默认值由 withDefaults 提供）

  // 重置滚动状态
  if (resetScroll) {
    scrollX = 0
    scrollY = 0
  } else {
    // 在不重置时，保证滚动值在新范围内
    const { maxScrollX, maxScrollY } = getScrollLimits()
    scrollX = clamp(scrollX, 0, maxScrollX)
    scrollY = clamp(scrollY, 0, maxScrollY)
  }

  // 初始化虚拟滚动状态
  calculateVisibleRows()

  clearGroups()
  rebuildGroups()

  // 创建固定列阴影
  setTimeout(() => createFixedColumnShadow(), 0)
}

/**
 * 挂载
 */
onMounted(() => {
  renderTable()
  refreshTable(true)

  const el = getContainerEl()
  el?.addEventListener('wheel', handleWheel, { passive: false })
  window.addEventListener('resize', handleResize)
  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('mouseup', handleMouseUp)
})

/**
 * 监听 props 变化
 */
watch(
  () => [props.xAxisFields, props.yAxisFields, props.data],
  () => {
    if (!stage) return
    refreshTable(true)
  },
  { deep: true }
)

watch(
  () => [
    props.chartWidth,
    props.chartHeight,
    props.headerHeight,
    props.rowHeight,
    props.scrollbarSize,
    props.tablePadding,
    props.headerBg,
    props.bodyBgOdd,
    props.bodyBgEven,
    props.borderColor,
    props.headerTextColor,
    props.bodyTextColor,
    props.scrollbarBg,
    props.scrollbarThumb,
    props.scrollbarThumbHover,
    props.bufferRows,
    props.hoverFill
  ],
  () => {
    if (!stage) return
    refreshTable(false)
  }
)

/**
 * 卸载
 */
onBeforeUnmount(() => {
  const tableContainer = getContainerEl()
  tableContainer?.removeEventListener('wheel', handleWheel)
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('mouseup', handleMouseUp)

  stage?.destroy()
  stage = null
  headerLayer = null
  bodyLayer = null
  fixedLayer = null
  fixedHeaderLayer = null
  scrollbarLayer = null
  centerBodyClipGroup = null
  selectedCell = null
  highlightRect = null
})
</script>

<style scoped>
.container-table {
  width: 100%;
}
</style>
