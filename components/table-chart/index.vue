<template>
  <div id="container-table" class="container-table" :style="containerStyle"></div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import Konva from 'konva'

interface Column {
  key: string
  title: string
  width?: number
  fixed?: 'left' | 'right'
  align?: 'left' | 'center' | 'right'
}

interface RowData {
  [key: string]: string | number
}

const getContainerEl = (): HTMLDivElement | null => {
  return document.getElementById('container-table') as HTMLDivElement | null
}

// 接收外部传入的数据与列配置及样式参数
const props = defineProps<{
  columns: Column[]
  data: RowData[]
  // 可选配置项（以下都有默认值）
  chartWidth?: number | string
  chartHeight?: number | string
  border?: boolean
  hoverFill?: string
  headerHeight?: number
  rowHeight?: number
  scrollbarSize?: number
  tablePadding?: number
  headerBg?: string
  bodyBgOdd?: string
  bodyBgEven?: string
  borderColor?: string
  headerTextColor?: string
  bodyTextColor?: string
  scrollbarBg?: string
  scrollbarThumb?: string
  scrollbarThumbHover?: string
  bufferRows?: number
}>()

const emit = defineEmits<{
  (e: 'cell-click', payload: { rowIndex: number; colIndex: number; colKey: string; rowData: RowData }): void
}>()

// 内部可变引用，保持现有渲染逻辑对变量名的依赖
let columns: Column[] = []
let data: RowData[] = []

/**
 * 布局配置（支持被 props 覆盖）
 */

/**
 * 表头高度
 */
let headerHeight = 40

/**
 * 行高
 */
let rowHeight = 32

/**
 * 滚动条大小
 */
let scrollbarSize = 16

/**
 * 表格内边距
 */
let tablePadding = 0

/**
 * 表头背景色
 */
let headerBg = '#f7f7f9'

/**
 * 表格奇数行背景色
 */
let bodyBgOdd = '#ffffff'

/**
 * 表格偶数行背景色
 */
let bodyBgEven = '#fbfbfd'

/**
 * 表格边框颜色
 */
let borderColor = '#dcdfe6'

/**
 * 表头文本颜色
 */
let headerTextColor = '#303133'

/**
 * 表格文本颜色
 */
let bodyTextColor = '#303133'

/**
 * 滚动条背景色
 */
let scrollbarBg = '#f1f1f1'

/**
 * 滚动条滑块颜色
 */
let scrollbarThumb = '#c1c1c1'

/**
 * 滚动条滑块悬停颜色
 */
let scrollbarThumbHover = '#a8a8a8'

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
let vThumb: Konva.Rect | null = null
let hThumb: Konva.Rect | null = null

/**
 * 拖拽状态
 */
let isDraggingVThumb = false
let isDraggingHThumb = false
let dragStartY = 0
let dragStartX = 0
let dragStartScrollY = 0
let dragStartScrollX = 0

/**
 * 单元格选中状态
 */
let selectedCell: { rowIndex: number; colIndex: number; colKey: string } | null = null
let highlightRect: Konva.Rect | null = null

/**
 * 虚拟滚动状态
 */
let virtualScrollTop = 0
let visibleRowStart = 0
let visibleRowEnd = 0
let bufferRows = 5 // 上下缓冲行数（可被 props 覆盖）
let visibleRowCount = 0 // 可视区域行数

/**
 * 行悬停状态
 */
let hoveredRowIndex: number | null = null
let leftHoverRect: Konva.Rect | null = null
let centerHoverRect: Konva.Rect | null = null
let rightHoverRect: Konva.Rect | null = null
let hoverFill = 'rgba(24, 144, 255, 0.12)'

/**
 * 对象池
 */
interface ObjectPools {
  cellRects: Konva.Rect[]
  textNodes: Konva.Text[]
  backgroundRects: Konva.Rect[]
}

const leftBodyPools: ObjectPools = { cellRects: [], textNodes: [], backgroundRects: [] }
const centerBodyPools: ObjectPools = { cellRects: [], textNodes: [], backgroundRects: [] }
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
    const leftCols = columns.filter((c) => c.fixed === 'left')
    const rightCols = columns.filter((c) => c.fixed === 'right')
    const centerCols = columns.filter((c) => !c.fixed)
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

  const stageWidth = stage.width()

  // 计算已设置宽度的列的总宽度
  const fixedWidthColumns = columns.filter((c) => c.width !== undefined)
  const autoWidthColumns = columns.filter((c) => c.width === undefined)
  const fixedTotalWidth = fixedWidthColumns.reduce((acc, c) => acc + (c.width || 0), 0)

  // 计算自动宽度列应该分配的宽度
  const remainingWidth = Math.max(0, stageWidth - fixedTotalWidth)
  const autoColumnWidth = autoWidthColumns.length > 0 ? remainingWidth / autoWidthColumns.length : 0

  // 为每个列计算最终宽度
  const columnsWithWidth = columns.map((col) => ({
    ...col,
    width: col.width !== undefined ? col.width : autoColumnWidth
  }))

  const leftCols = columnsWithWidth.filter((c) => c.fixed === 'left')
  const rightCols = columnsWithWidth.filter((c) => c.fixed === 'right')
  const centerCols = columnsWithWidth.filter((c) => !c.fixed)
  const sumWidth = (arr: Column[]) => arr.reduce((acc, c) => acc + (c.width || 0), 0)

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
  col: Column,
  cellX: number,
  cellY: number,
  cellWidth: number,
  cellHeight: number,
  group: Konva.Group
) => {
  selectedCell = { rowIndex, colIndex, colKey: col.key }
  if (rowIndex >= visibleRowStart && rowIndex <= visibleRowEnd) {
    createHighlightRect(cellX, cellY, cellWidth, cellHeight, group)
  } else if (highlightRect) {
    highlightRect.destroy()
    highlightRect = null
  }

  const rowData = data[rowIndex]
  emit('cell-click', { rowIndex, colIndex, colKey: col.key, rowData })
}

/**
 * 获取滚动限制
 */
const getScrollLimits = () => {
  if (!stage) return { maxScrollX: 0, maxScrollY: 0 }

  const { totalWidth, leftWidth, rightWidth } = getSplitColumns()
  const stageWidth = stage.width()
  const stageHeight = stage.height()
  const contentHeight = data.length * rowHeight
  const visibleContentWidth = stageWidth - leftWidth - rightWidth - scrollbarSize

  const maxScrollX = Math.max(0, totalWidth - leftWidth - rightWidth - visibleContentWidth)
  const maxScrollY = Math.max(0, contentHeight - (stageHeight - headerHeight - scrollbarSize))

  return { maxScrollX, maxScrollY }
}

/**
 * 计算虚拟滚动的可视区域（根据当前滚动位置得出渲染行范围）
 */
const calculateVisibleRows = () => {
  if (!stage) return

  const stageHeight = stage.height()
  const contentHeight = stageHeight - headerHeight - scrollbarSize

  // 计算可视区域能显示的行数
  visibleRowCount = Math.ceil(contentHeight / rowHeight)

  // 根据scrollY计算起始行
  const startRow = Math.floor(scrollY / rowHeight)

  // 添加缓冲区，确保滚动时有预渲染的行
  visibleRowStart = Math.max(0, startRow - bufferRows)
  visibleRowEnd = Math.min(data.length - 1, startRow + visibleRowCount + bufferRows)
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
  const contentHeight = height - headerHeight - scrollbarSize

  // 创建中间区域剪辑组
  centerBodyClipGroup = new Konva.Group({
    x: leftWidth,
    y: headerHeight,
    clip: {
      x: 0,
      y: 0,
      width: width - leftWidth - rightWidth - scrollbarSize,
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
  leftHoverRect = null
  centerHoverRect = null
  rightHoverRect = null
}

/**
 * 重建分组
 */
const rebuildGroups = () => {
  if (!stage || !headerLayer || !bodyLayer || !fixedLayer || !fixedHeaderLayer || !scrollbarLayer) return

  const { leftCols, centerCols, rightCols, leftWidth, rightWidth } = getSplitColumns()
  const stageWidth = stage.width()
  const stageHeight = stage.height()

  // Ensure centerBodyClipGroup exists
  if (!centerBodyClipGroup) {
    const contentHeight = stageHeight - headerHeight - scrollbarSize
    centerBodyClipGroup = new Konva.Group({
      x: leftWidth,
      y: headerHeight,
      clip: {
        x: 0,
        y: 0,
        width: stageWidth - leftWidth - rightWidth - scrollbarSize,
        height: contentHeight
      }
    })
    bodyLayer.add(centerBodyClipGroup)
  }

  leftHeaderGroup = new Konva.Group({ x: 0, y: 0, name: 'leftHeader' })
  centerHeaderGroup = new Konva.Group({ x: leftWidth - scrollX, y: 0, name: 'centerHeader' })
  rightHeaderGroup = new Konva.Group({
    x: stageWidth - rightWidth - scrollbarSize,
    y: 0,
    name: 'rightHeader'
  })

  leftBodyGroup = new Konva.Group({ x: 0, y: headerHeight - scrollY, name: 'leftBody' })
  centerBodyGroup = new Konva.Group({ x: -scrollX, y: -scrollY, name: 'centerBody' })
  rightBodyGroup = new Konva.Group({
    x: stageWidth - rightWidth - scrollbarSize,
    y: headerHeight - scrollY,
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

  // 创建或更新行 hover 高亮矩形
  createOrUpdateHoverRects()

  createScrollbars()

  headerLayer.batchDraw()
  bodyLayer?.batchDraw()
  fixedLayer?.batchDraw()
  fixedHeaderLayer?.batchDraw()
  scrollbarLayer?.batchDraw()
}

/**
 * 创建滚动条
 */
const createScrollbars = () => {
  if (!stage || !scrollbarLayer) return

  const stageWidth = stage.width()
  const stageHeight = stage.height()
  const { maxScrollX, maxScrollY } = getScrollLimits()

  // Create mask for vertical scrollbar header area to hide overflowing content
  const vScrollbarHeaderMask = new Konva.Rect({
    x: stageWidth - scrollbarSize,
    y: 0,
    width: scrollbarSize,
    height: headerHeight,
    fill: headerBg,
    stroke: borderColor,
    strokeWidth: 1
  })
  scrollbarLayer.add(vScrollbarHeaderMask)

  // Vertical scrollbar
  if (maxScrollY > 0) {
    vScrollbar = new Konva.Group()
    scrollbarLayer.add(vScrollbar)

    const vTrack = new Konva.Rect({
      x: stageWidth - scrollbarSize,
      y: headerHeight,
      width: scrollbarSize,
      height: stageHeight - headerHeight - scrollbarSize,
      fill: scrollbarBg,
      stroke: borderColor,
      strokeWidth: 1
    })
    vScrollbar.add(vTrack)

    const thumbHeight = Math.max(
      20,
      ((stageHeight - headerHeight - scrollbarSize) * (stageHeight - headerHeight - scrollbarSize)) /
        (data.length * rowHeight)
    )
    const thumbY = headerHeight + (scrollY / maxScrollY) * (stageHeight - headerHeight - scrollbarSize - thumbHeight)

    vThumb = new Konva.Rect({
      x: stageWidth - scrollbarSize + 2,
      y: thumbY,
      width: scrollbarSize - 4,
      height: thumbHeight,
      fill: scrollbarThumb,
      cornerRadius: 2,
      draggable: false
    })
    vScrollbar.add(vThumb)

    setupVerticalScrollbarEvents()
  }

  // Horizontal scrollbar
  if (maxScrollX > 0) {
    hScrollbar = new Konva.Group()
    scrollbarLayer.add(hScrollbar)

    const hTrack = new Konva.Rect({
      x: 0,
      y: stageHeight - scrollbarSize,
      width: stageWidth - scrollbarSize,
      height: scrollbarSize,
      fill: scrollbarBg,
      stroke: borderColor,
      strokeWidth: 1
    })
    hScrollbar.add(hTrack)

    const { leftWidth, rightWidth, centerWidth } = getSplitColumns()
    const visibleWidth = stageWidth - leftWidth - rightWidth - scrollbarSize
    const thumbWidth = Math.max(20, (visibleWidth * visibleWidth) / centerWidth)
    const thumbX = leftWidth + (scrollX / maxScrollX) * (visibleWidth - thumbWidth)

    hThumb = new Konva.Rect({
      x: thumbX,
      y: stageHeight - scrollbarSize + 2,
      width: thumbWidth,
      height: scrollbarSize - 4,
      fill: scrollbarThumb,
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
const drawHeaderPart = (group: Konva.Group | null, cols: Column[], startX: number) => {
  if (!group) return

  // background
  const totalWidth = cols.reduce((acc, c) => acc + (c.width || 0), 0)
  const bg = new Konva.Rect({
    x: startX + tablePadding,
    y: 0,
    width: totalWidth,
    height: headerHeight,
    fill: headerBg,
    stroke: borderColor,
    strokeWidth: 1
  })
  group.add(bg)

  let x = startX
  cols.forEach((col) => {
    const cell = new Konva.Rect({
      x,
      y: 0,
      width: col.width || 0,
      height: headerHeight,
      stroke: borderColor,
      strokeWidth: 1,
      listening: false
    })
    group.add(cell)

    const maxTextWidth = (col.width || 0) - 16 // 8px padding on each side
    const fontFamily = 'system-ui, -apple-system, Segoe UI, Roboto, Arial, Noto Sans, Ubuntu'
    const fontSize = 14
    const truncatedTitle = truncateText(col.title, maxTextWidth, fontSize, fontFamily)

    const label = new Konva.Text({
      x: getTextX(x),
      y: headerHeight / 2,
      text: truncatedTitle,
      fontSize: fontSize,
      fontFamily: fontFamily,
      fill: headerTextColor,
      align: 'left',
      verticalAlign: 'middle'
    })
    label.offsetY(label.height() / 2)
    group.add(label)

    x += col.width || 0
  })

  // 表头渲染完成后，如果是左侧表头，创建固定列阴影
  if (group && group.name() === 'leftHeader') {
    // 延迟创建阴影，确保所有内容都已渲染
    setTimeout(() => createFixedColumnShadow(), 0)
  }
}

const setupVerticalScrollbarEvents = () => {
  if (!vThumb || !stage) return

  vThumb.on('mousedown', (e) => {
    isDraggingVThumb = true
    dragStartY = e.evt.clientY
    dragStartScrollY = scrollY
    stage!.container().style.cursor = 'grabbing'
  })

  vThumb.on('mouseenter', () => {
    if (vThumb) vThumb.fill(scrollbarThumbHover)
    scrollbarLayer?.batchDraw()
  })

  vThumb.on('mouseleave', () => {
    if (vThumb && !isDraggingVThumb) vThumb.fill(scrollbarThumb)
    scrollbarLayer?.batchDraw()
  })
}

const setupHorizontalScrollbarEvents = () => {
  if (!hThumb || !stage) return

  hThumb.on('mousedown', (e) => {
    isDraggingHThumb = true
    dragStartX = e.evt.clientX
    dragStartScrollX = scrollX
    stage!.container().style.cursor = 'grabbing'
  })

  hThumb.on('mouseenter', () => {
    if (hThumb) hThumb.fill(scrollbarThumbHover)
    scrollbarLayer?.batchDraw()
  })

  hThumb.on('mouseleave', () => {
    if (hThumb && !isDraggingHThumb) hThumb.fill(scrollbarThumb)
    scrollbarLayer?.batchDraw()
  })
}

// /**
//  * 临时兼容函数 - 重定向到虚拟滚动版本
//  */
// function drawBodyPart(group: Konva.Group | null, cols: Column[]) {
//   // 根据组确定使用哪个对象池
//   let pools: ObjectPools
//   if (group === leftBodyGroup) {
//     pools = leftBodyPools
//   } else if (group === centerBodyGroup) {
//     pools = centerBodyPools
//   } else if (group === rightBodyGroup) {
//     pools = rightBodyPools
//   } else {
//     // 默认使用center池
//     pools = centerBodyPools
//   }

//   drawBodyPartVirtual(group, cols, pools)
// }

/**
 * 虚拟滚动版本的drawBodyPart - 只渲染可视区域的行
 */
const drawBodyPartVirtual = (group: Konva.Group | null, cols: Column[], pools: ObjectPools) => {
  if (!stage || !group) return

  // 计算可视区域
  calculateVisibleRows()

  const totalWidth = cols.reduce((acc, c) => acc + (c.width || 0), 0)

  // 清空当前组，将对象返回池中
  const children = group.children.slice() // 复制数组避免修改时的问题
  children.forEach((child) => {
    if (child instanceof Konva.Rect) {
      // 检查是否为阴影元素
      if (child.name() === 'fixedColumnShadow') {
        child.destroy() // 阴影元素直接销毁，不回收到池中
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
    const row = data[rowIndex]
    const y = rowIndex * rowHeight

    // 创建背景条纹
    const bg = getFromPool(pools.backgroundRects, () => new Konva.Rect({ listening: false }))

    bg.x(0)
    bg.y(y)
    bg.width(totalWidth)
    bg.height(rowHeight)
    bg.fill(rowIndex % 2 === 0 ? bodyBgOdd : bodyBgEven)
    bg.stroke('')
    bg.strokeWidth(0)
    group.add(bg)

    // 渲染每列的单元格
    let x = 0
    cols.forEach((col, colIndex) => {
      // 创建单元格边框
      const cell = getFromPool(pools.cellRects, () => new Konva.Rect({ listening: true, cursor: 'pointer' }))

      cell.x(x)
      cell.y(y)
      cell.width(col.width || 0)
      cell.height(rowHeight)
      cell.stroke(borderColor)
      cell.strokeWidth(1)
      cell.fill('transparent')

      // 清除之前的事件监听器
      cell.off('click')

      // 添加点击事件
      cell.on('click', () => {
        handleCellClick(rowIndex, colIndex, col, cell.x(), cell.y(), col.width || 0, rowHeight, group)
      })
      group.add(cell)

      // 创建文本
      const value = String((row as unknown as Record<string, unknown>)[col.key] ?? '')
      const maxTextWidth = (col.width || 0) - 16
      const fontFamily = 'system-ui, -apple-system, Segoe UI, Roboto, Arial, Noto Sans, Ubuntu'
      const fontSize = 13
      const truncatedValue = truncateText(value, maxTextWidth, fontSize, fontFamily)

      const textNode = getFromPool(pools.textNodes, () => new Konva.Text({ listening: false }))

      textNode.x(getTextX(x))
      textNode.y(y + rowHeight / 2)
      textNode.text(truncatedValue)
      textNode.fontSize(fontSize)
      textNode.fontFamily(fontFamily)
      textNode.fill(bodyTextColor)
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
    const selectedColIndex = cols.findIndex((col) => col.key === selectedCell!.colKey)
    if (selectedColIndex >= 0) {
      // 计算高亮位置
      let highlightX = 0
      for (let i = 0; i < selectedColIndex; i++) {
        highlightX += cols[i].width || 0
      }
      const highlightY = selectedCell!.rowIndex * rowHeight
      const highlightWidth = cols[selectedColIndex].width || 0

      // 重新创建高亮
      createHighlightRect(highlightX, highlightY, highlightWidth, rowHeight, group)
    }
  }

  // 阴影现在由createFixedColumnShadow()统一管理，不需要在这里添加

  // 确保 hover 层在内容之上
  if (group === leftBodyGroup && leftHoverRect) leftHoverRect.moveToTop()
  if (group === centerBodyGroup && centerHoverRect) centerHoverRect.moveToTop()
  if (group === rightBodyGroup && rightHoverRect) rightHoverRect.moveToTop()
}

// 创建或更新三块区域的 hover 高亮矩形（保持在各自组的最底层，不遮挡文本）
const createOrUpdateHoverRects = () => {
  if (!stage || !leftBodyGroup || !centerBodyGroup || !rightBodyGroup) return
  const { leftCols, centerCols, rightCols, leftWidth, rightWidth } = getSplitColumns()

  const updateRect = (rectRef: Konva.Rect | null, group: Konva.Group | null, totalWidth: number): Konva.Rect | null => {
    if (!group) return null
    const y = hoveredRowIndex === null ? 0 : hoveredRowIndex * rowHeight
    const shouldShow =
      hoveredRowIndex !== null && hoveredRowIndex >= visibleRowStart && hoveredRowIndex <= visibleRowEnd
    if (!rectRef) {
      rectRef = new Konva.Rect({
        x: 0,
        y,
        width: totalWidth,
        height: rowHeight,
        fill: hoverFill,
        listening: false,
        visible: shouldShow
      })
      group.add(rectRef)
      rectRef.moveToTop()
    } else {
      rectRef.y(y)
      rectRef.width(totalWidth)
      rectRef.height(rowHeight)
      rectRef.visible(shouldShow)
    }
    return rectRef
  }

  const leftTotal = leftCols.reduce((acc, c) => acc + (c.width || 0), 0)
  const centerTotal = centerCols.reduce((acc, c) => acc + (c.width || 0), 0)
  const rightTotal = rightCols.reduce((acc, c) => acc + (c.width || 0), 0)

  leftHoverRect = updateRect(leftHoverRect, leftBodyGroup, leftTotal)
  centerHoverRect = updateRect(centerHoverRect, centerBodyGroup, centerTotal)
  rightHoverRect = updateRect(rightHoverRect, rightBodyGroup, rightTotal)

  bodyLayer?.batchDraw()
  fixedLayer?.batchDraw()
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
    Math.abs(scrollY - oldScrollY) > rowHeight * 2 // 滚动超过2行时强制重新渲染

  // const needsRerender = true

  if (needsRerender) {
    // 重新渲染可视区域
    const { leftCols, centerCols, rightCols } = getSplitColumns()
    drawBodyPartVirtual(leftBodyGroup, leftCols, leftBodyPools)
    drawBodyPartVirtual(centerBodyGroup, centerCols, centerBodyPools)
    drawBodyPartVirtual(rightBodyGroup, rightCols, rightBodyPools)
  }

  const bodyY = headerHeight - scrollY
  const centerY = -scrollY

  // Only body content moves vertically, headers stay fixed
  leftBodyGroup.y(bodyY)
  rightBodyGroup.y(bodyY)
  centerBodyGroup.y(centerY)

  updateScrollbars()
  bodyLayer?.batchDraw()
  fixedLayer?.batchDraw()

  // 垂直滚动时同步 hover 矩形位置/显示
  createOrUpdateHoverRects()
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
  createOrUpdateHoverRects()
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
      ((stageHeight - headerHeight - scrollbarSize) * (stageHeight - headerHeight - scrollbarSize)) /
        (data.length * rowHeight)
    )
    const thumbY = headerHeight + (scrollY / maxScrollY) * (stageHeight - headerHeight - scrollbarSize - thumbHeight)
    vThumb.y(thumbY)
  }

  // Update horizontal thumb position
  if (hThumb && maxScrollX > 0) {
    const { leftWidth, rightWidth, centerWidth } = getSplitColumns()
    const visibleWidth = stageWidth - leftWidth - rightWidth - scrollbarSize
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
    const { maxScrollY } = getScrollLimits()
    const stageHeight = stage.height()
    const trackHeight = stageHeight - headerHeight - scrollbarSize
    const thumbHeight = Math.max(20, (trackHeight * trackHeight) / (data.length * rowHeight))
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
      Math.abs(scrollY - oldScrollY) > rowHeight * 2

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
    const { maxScrollX } = getScrollLimits()
    const { leftWidth, rightWidth, centerWidth } = getSplitColumns()
    const stageWidth = stage.width()
    const visibleWidth = stageWidth - leftWidth - rightWidth - scrollbarSize
    const thumbWidth = Math.max(20, (visibleWidth * visibleWidth) / centerWidth)
    const scrollRatio = deltaX / (visibleWidth - thumbWidth)
    const newScrollX = dragStartScrollX + scrollRatio * maxScrollX

    scrollX = clamp(newScrollX, 0, maxScrollX)
    updateScrollPositions()
  }

  // 普通移动时，更新 hoveredRowIndex，并同步 hover 矩形
  if (!isDraggingVThumb && !isDraggingHThumb && stage) {
    const pointerPos = stage.getPointerPosition()
    if (pointerPos) {
      // 使用容器内坐标，避开外层布局影响
      const containerRect = stage.container().getBoundingClientRect()
      const localY = pointerPos.y - containerRect.top
      const yInContent = localY - headerHeight + scrollY
      const rowIdx = Math.floor(yInContent / rowHeight)
      const newHoverIndex = rowIdx >= 0 && rowIdx < data.length ? rowIdx : null
      if (newHoverIndex !== hoveredRowIndex) {
        hoveredRowIndex = newHoverIndex
        createOrUpdateHoverRects()
      }
    }
  }
}

const handleMouseUp = () => {
  if (isDraggingVThumb || isDraggingHThumb) {
    isDraggingVThumb = false
    isDraggingHThumb = false
    if (stage) stage.container().style.cursor = 'default'

    if (vThumb && !isDraggingVThumb) vThumb.fill(scrollbarThumb)
    if (hThumb && !isDraggingHThumb) hThumb.fill(scrollbarThumb)
    scrollbarLayer?.batchDraw()
  }
}

const updateScrollPositions = () => {
  if (!leftBodyGroup || !centerBodyGroup || !rightBodyGroup || !centerHeaderGroup) return

  const { leftWidth } = getSplitColumns()
  const bodyY = headerHeight - scrollY
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
const initFromProps = () => {
  columns = Array.isArray(props.columns) ? props.columns : []
  data = Array.isArray(props.data) ? props.data : []

  // 应用可选样式/布局配置（提供默认值兜底）
  headerHeight = props.headerHeight ?? 40
  rowHeight = props.rowHeight ?? 32
  scrollbarSize = props.scrollbarSize ?? 16
  tablePadding = props.tablePadding ?? 0
  headerBg = props.headerBg ?? '#f7f7f9'
  bodyBgOdd = props.bodyBgOdd ?? '#ffffff'
  bodyBgEven = props.bodyBgEven ?? '#fbfbfd'
  borderColor = props.borderColor ?? '#dcdfe6'
  headerTextColor = props.headerTextColor ?? '#303133'
  bodyTextColor = props.bodyTextColor ?? '#303133'
  scrollbarBg = props.scrollbarBg ?? '#f1f1f1'
  scrollbarThumb = props.scrollbarThumb ?? '#c1c1c1'
  scrollbarThumbHover = props.scrollbarThumbHover ?? '#a8a8a8'
  bufferRows = props.bufferRows ?? 5
  hoverFill = props.hoverFill ?? 'rgba(24, 144, 255, 0.12)'

  // 重置滚动状态
  scrollX = 0
  scrollY = 0

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
  initFromProps()

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
  () => [props.columns, props.data],
  () => {
    if (!stage) return
    initFromProps()
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
    initFromProps()
  }
)

/**
 * 卸载
 */
onBeforeUnmount(() => {
  const el = getContainerEl()
  el?.removeEventListener('wheel', handleWheel)
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

<style lang="scss" scoped></style>
