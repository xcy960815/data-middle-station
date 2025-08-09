<template>
  <div id="container-table" class="stage-container"></div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import Konva from 'konva'
/**
 * 默认宽度
 */
const DEFAULT_CLIENT_WIDTH = 800
/**
 * 默认高度
 */
const DEFAULT_CLIENT_HEIGHT = 420
/**
 * 运行时Konva引用（仅在客户端赋值）
 */
const konvaInstance = ref<typeof import('konva') | null>(null)
/**
 * 舞台实例
 */
const stage = ref<Konva.Stage | null>(null)

/**
 * 列方向
 */
type PinDirection = 'left' | 'right' | null

/**
 * 列定义
 */
interface ColumnDef {
  key: string
  title: string
  width: number
  pin: PinDirection
  align?: 'left' | 'center' | 'right'
}

/**
 * 行数据
 */
interface RowData {
  [key: string]: string | number
}

const props = withDefaults(
  defineProps<{
    columns?: ColumnDef[]
    data?: RowData[]
    height?: number | string
  }>(),
  {
    columns: () => [],
    data: () => [],
    height: 'auto'
  }
)
const { columns, data, height } = props

/**
 * 布局配置
 */
const headerHeight = 40
/**
 * 行高
 */
const rowHeight = 32
/**
 * 滚动条大小
 */
const scrollbarSize = 16
/**
 * 表格内边距
 */
const tablePadding = 0
/**
 * 表头背景色
 */
const headerBg = '#f7f7f9'
/**
 * 奇数行背景色
 */
const bodyBgOdd = '#ffffff'
/**
 * 偶数行背景色
 */
const bodyBgEven = '#fbfbfd'

const borderColor = '#dcdfe6'
/**
 * 表头文本颜色
 */
const headerTextColor = '#303133'
/**
 * 内容文本颜色
 */
const bodyTextColor = '#303133'
/**
 * 滚动条背景色
 */
const scrollbarBg = '#f1f1f1'
/**
 * 滚动条滑块颜色
 */
const scrollbarThumb = '#c1c1c1'
/**
 * 滚动条滑块悬停颜色
 */
const scrollbarThumbHover = '#a8a8a8'

const headerLayer = ref<Konva.Layer | null>(null)
const bodyLayer = ref<Konva.Layer | null>(null)
const fixedLayer = ref<Konva.Layer | null>(null)
const fixedHeaderLayer = ref<Konva.Layer | null>(null)
const scrollbarLayer = ref<Konva.Layer | null>(null)

const centerBodyClipGroup = ref<Konva.Group | null>(null)

const leftHeaderGroup = ref<Konva.Group | null>(null)
const centerHeaderGroup = ref<Konva.Group | null>(null)
const rightHeaderGroup = ref<Konva.Group | null>(null)

const leftBodyGroup = ref<Konva.Group | null>(null)
const centerBodyGroup = ref<Konva.Group | null>(null)
const rightBodyGroup = ref<Konva.Group | null>(null)

// Scrolling state
const scrollY = ref(0)
const scrollX = ref(0)

// Scrollbar elements
const vScrollbar = ref<Konva.Group | null>(null)
const hScrollbar = ref<Konva.Group | null>(null)
const vThumb = ref<Konva.Rect | null>(null)
const hThumb = ref<Konva.Rect | null>(null)

// Drag state
let isDraggingVThumb = false
let isDraggingHThumb = false
let dragStartY = 0
let dragStartX = 0
let dragStartScrollY = 0
let dragStartScrollX = 0

// Cell selection state
const selectedCell = ref<{ rowIndex: number; colIndex: number; colKey: string } | null>(null)
const highlightRect = ref<Konva.Rect | null>(null)

// Virtual scrolling state
let virtualScrollTop = 0
let visibleRowStart = 0
let visibleRowEnd = 0
let bufferRows = 5 // 上下缓冲行数
let visibleRowCount = 0 // 可视区域行数

// Object pools for performance optimization
interface ObjectPools {
  cellRects: Konva.Rect[]
  textNodes: Konva.Text[]
  backgroundRects: Konva.Rect[]
}

const leftBodyPools: ObjectPools = { cellRects: [], textNodes: [], backgroundRects: [] }
const centerBodyPools: ObjectPools = { cellRects: [], textNodes: [], backgroundRects: [] }
const rightBodyPools: ObjectPools = { cellRects: [], textNodes: [], backgroundRects: [] }

/**
 * 计算列的宽度
 */
function getSplitColumns() {
  const leftCols = columns.filter((c) => c.pin === 'left')
  const rightCols = columns.filter((c) => c.pin === 'right')
  const centerCols = columns.filter((c) => !c.pin)
  const sumWidth = (arr: ColumnDef[]) => arr.reduce((acc, c) => acc + c.width, 0)
  return {
    leftCols,
    centerCols,
    rightCols,
    leftWidth: sumWidth(leftCols),
    centerWidth: sumWidth(centerCols),
    rightWidth: sumWidth(rightCols),
    totalWidth: sumWidth(columns)
  }
}

/**
 * 限制值在最小值和最大值之间
 */
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

/**
 * 获取文本的x坐标
 */
function getTextX(x: number) {
  return x + 8
}

/**
 * 截断文本
 */
function truncateText(text: string, maxWidth: number, fontSize: number, fontFamily: string): string {
  // Create a temporary text node to measure text width
  const tempText = new Konva.Text({
    text: text,
    fontSize: fontSize,
    fontFamily: fontFamily
  })

  // If text fits within maxWidth, return as is
  if (tempText.width() <= maxWidth) {
    tempText.destroy()
    return text
  }

  // Binary search to find the maximum number of characters that fit
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

/**
 * 创建高亮矩形
 */
function createHighlightRect(x: number, y: number, width: number, height: number, group: any) {
  // Remove existing highlight
  if (highlightRect.value) {
    highlightRect.value.destroy()
    highlightRect.value = null
  }
  // Create new highlight rectangle
  highlightRect.value = new Konva.Rect({
    x,
    y,
    width,
    height,
    fill: 'rgba(66, 165, 245, 0.3)', // Light blue highlight
    stroke: '#1976d2',
    strokeWidth: 2,
    listening: false
  })

  // Add to the same group as the cell
  if (highlightRect.value) {
    ;(group as any).add(highlightRect.value)
  }

  // Move highlight to top within the group
  if (highlightRect.value && typeof (highlightRect.value as any).moveToTop === 'function') {
    highlightRect.value.moveToTop()
  }

  // Redraw the layer that contains this group
  const layer = group.getLayer()
  layer?.batchDraw()

  // console.log('Highlight created at:', x, y, 'size:', width, height)
}

/**
 * 处理单元格点击事件
 */
function handleCellClick(
  rowIndex: number,
  colIndex: number,
  col: ColumnDef,
  cellX: number,
  cellY: number,
  cellWidth: number,
  cellHeight: number,
  group: Konva.Group
) {
  // Update selected cell
  selectedCell.value = { rowIndex, colIndex, colKey: col.key }

  // 检查选中的行是否在当前可视区域内
  if (rowIndex >= visibleRowStart && rowIndex <= visibleRowEnd) {
    // 在可视区域内，直接创建高亮
    createHighlightRect(cellX, cellY, cellWidth, cellHeight, group)
  } else {
    // 不在可视区域内，清除现有高亮，等待滚动到该位置时重新创建
    if (highlightRect.value) {
      highlightRect.value.destroy()
      highlightRect.value = null
    }
    // 行不在可视区域内时不输出日志
  }

  // 取消调试日志输出
}

/**
 * 获取滚动限制
 */
function getScrollLimits() {
  if (!stage.value) return { maxScrollX: 0, maxScrollY: 0 }

  const { totalWidth, leftWidth, rightWidth } = getSplitColumns()
  const stageWidth = stage.value.width()
  const stageHeight = stage.value.height()
  const contentHeight = data.length * rowHeight
  const visibleContentWidth = stageWidth - leftWidth - rightWidth - scrollbarSize

  const maxScrollX = Math.max(0, totalWidth - leftWidth - rightWidth - visibleContentWidth)
  const maxScrollY = Math.max(0, contentHeight - (stageHeight - headerHeight - scrollbarSize))

  return { maxScrollX, maxScrollY }
}

/**
 * 计算虚拟滚动的可视区域
 * 根据当前滚动位置计算需要渲染的行范围
 */
function calculateVisibleRows() {
  if (!stage.value) return

  const stageHeight = stage.value.height()
  const contentHeight = stageHeight - headerHeight - scrollbarSize

  // 计算可视区域能显示的行数
  visibleRowCount = Math.ceil(contentHeight / rowHeight)

  // 根据scrollY计算起始行
  const startRow = Math.floor(scrollY.value / rowHeight)

  // 添加缓冲区，确保滚动时有预渲染的行
  visibleRowStart = Math.max(0, startRow - bufferRows)
  visibleRowEnd = Math.min(data.length - 1, startRow + visibleRowCount + bufferRows)

  // 取消调试日志输出
}

/**
 * 从对象池获取或创建对象
 */
function getFromPool<T extends Konva.Node>(pool: T[], createFn: () => T): T {
  let obj = pool.pop()
  if (!obj) {
    obj = createFn()
  }
  return obj
}

/**
 * 将对象返回到池中
 */
function returnToPool<T extends Konva.Node>(pool: T[], obj: T) {
  obj.remove() // 从场景中移除
  pool.push(obj)
}

/**
 * 为固定列添加右边缘阴影效果
 * @param group 要添加阴影的组
 * @param cols 列定义数组
 * @param isHeader 是否为表头区域
 */
function createFixedColumnShadow() {
  if (!stage.value || !bodyLayer.value || !headerLayer.value) return

  // 移除旧的阴影
  const existingBodyShadow = stage.value?.findOne('.fixedColumnBodyShadow')
  const existingHeaderShadow = stage.value?.findOne('.fixedColumnHeaderShadow')
  if (existingBodyShadow) existingBodyShadow.destroy()
  if (existingHeaderShadow) existingHeaderShadow.destroy()

  // 计算左侧固定列的总宽度
  const { leftCols } = getSplitColumns()
  const totalWidth = leftCols.reduce((acc, col) => acc + col.width, 0)

  //

  // 创建表头阴影
  const headerShadowRect = new Konva.Rect({
    x: totalWidth,
    y: 0, // 从顶部开始
    width: 4,
    height: headerHeight, // 表头高度
    fill: 'rgba(0, 0, 0, 0.1)',
    listening: false,
    name: 'fixedColumnHeaderShadow'
  })

  // 创建内容区域阴影
  const stageHeight = stage.value.height()
  const bodyShadowRect = new Konva.Rect({
    x: totalWidth,
    y: headerHeight, // 从表头下方开始
    width: 4,
    height: stageHeight - headerHeight - scrollbarSize, // 覆盖整个内容区域
    fill: 'rgba(0, 0, 0, 0.1)',
    listening: false,
    name: 'fixedColumnBodyShadow'
  })

  // 将阴影添加到对应的层
  headerLayer.value.add(headerShadowRect)
  bodyLayer.value.add(bodyShadowRect)

  headerLayer.value.batchDraw()
  bodyLayer.value.batchDraw()

  // 取消调试日志输出
}

/**
 * 初始化表格
 */
const initTable = () => {
  const tableContainer = document.querySelector<HTMLDivElement>('#container-table')
  if (!tableContainer) return
  const width = tableContainer.clientWidth || DEFAULT_CLIENT_WIDTH
  const height = tableContainer.clientHeight || DEFAULT_CLIENT_HEIGHT

  if (!stage.value) {
    stage.value = new Konva.Stage({ container: tableContainer, width, height })
  } else {
    stage.value.size({ width, height })
  }

  if (!headerLayer.value) {
    headerLayer.value = new Konva.Layer()
    stage.value.add(headerLayer.value)
  }

  if (!bodyLayer.value) {
    bodyLayer.value = new Konva.Layer()
    stage.value.add(bodyLayer.value)
  }

  if (!fixedLayer.value) {
    fixedLayer.value = new Konva.Layer()
    stage.value.add(fixedLayer.value)
  }

  if (!fixedHeaderLayer.value) {
    fixedHeaderLayer.value = new Konva.Layer()
    stage.value.add(fixedHeaderLayer.value)
  }

  if (!scrollbarLayer.value) {
    scrollbarLayer.value = new Konva.Layer()
    stage.value.add(scrollbarLayer.value)
  }

  const { leftWidth, rightWidth } = getSplitColumns()
  const contentHeight = height - headerHeight - scrollbarSize

  // Always recreate clipping group for center scrollable content
  centerBodyClipGroup.value = new Konva.Group({
    x: leftWidth,
    y: headerHeight,
    clip: {
      x: 0,
      y: 0,
      width: width - leftWidth - rightWidth - scrollbarSize,
      height: contentHeight
    }
  })
  bodyLayer.value.add(centerBodyClipGroup.value)
}

/**
 * 清除组
 */
function clearGroups() {
  headerLayer.value?.destroyChildren()
  bodyLayer.value?.destroyChildren()
  fixedLayer.value?.destroyChildren()
  fixedHeaderLayer.value?.destroyChildren()
  scrollbarLayer.value?.destroyChildren()

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
  vScrollbar.value = null
  hScrollbar.value = null
  vThumb.value = null
  hThumb.value = null

  // Reset centerBodyClipGroup.value reference
  centerBodyClipGroup.value = null

  // Reset cell selection
  selectedCell.value = null
  highlightRect.value = null

  // Reset virtual scrolling state
  visibleRowStart = 0
  visibleRowEnd = 0
  visibleRowCount = 0
}

function rebuildGroups() {
  if (
    !stage.value ||
    !headerLayer.value ||
    !bodyLayer.value ||
    !fixedLayer.value ||
    !fixedHeaderLayer.value ||
    !scrollbarLayer.value
  )
    return

  const { leftCols, centerCols, rightCols, leftWidth, rightWidth } = getSplitColumns()
  const stageWidth = stage.value.width()
  const stageHeight = stage.value.height()

  // Ensure centerBodyClipGroup.value exists
  if (!centerBodyClipGroup.value) {
    const contentHeight = stageHeight - headerHeight - scrollbarSize
    centerBodyClipGroup.value = new Konva.Group({
      x: leftWidth,
      y: headerHeight,
      clip: {
        x: 0,
        y: 0,
        width: stageWidth - leftWidth - rightWidth - scrollbarSize,
        height: contentHeight
      }
    })
    bodyLayer.value.add(centerBodyClipGroup.value)
  }

  leftHeaderGroup.value = new Konva.Group({ x: 0, y: 0, name: 'leftHeader' })
  centerHeaderGroup.value = new Konva.Group({ x: leftWidth - scrollX.value, y: 0, name: 'centerHeader' })
  rightHeaderGroup.value = new Konva.Group({
    x: stageWidth - rightWidth - scrollbarSize,
    y: 0,
    name: 'rightHeader'
  })

  leftBodyGroup.value = new Konva.Group({ x: 0, y: headerHeight - scrollY.value, name: 'leftBody' })
  centerBodyGroup.value = new Konva.Group({ x: -scrollX.value, y: -scrollY.value, name: 'centerBody' })
  rightBodyGroup.value = new Konva.Group({
    x: stageWidth - rightWidth - scrollbarSize,
    y: headerHeight - scrollY.value,
    name: 'rightBody'
  })

  // Add center scrollable header to header layer (lower layer)
  headerLayer.value.add(centerHeaderGroup.value)

  // Add fixed headers to fixed header layer (top layer)
  fixedHeaderLayer.value.add(leftHeaderGroup.value, rightHeaderGroup.value)

  // Add center scrollable content to clipped group
  if (centerBodyGroup.value) {
    centerBodyClipGroup.value.add(centerBodyGroup.value)
  }

  // Add fixed columns to fixed layer (on top)
  if (leftBodyGroup.value && rightBodyGroup.value) {
    fixedLayer.value.add(leftBodyGroup.value, rightBodyGroup.value)
  }
  drawHeaderPart(leftHeaderGroup.value, leftCols, 0)
  drawHeaderPart(centerHeaderGroup.value, centerCols, 0)
  drawHeaderPart(rightHeaderGroup.value, rightCols, 0)

  // 使用虚拟滚动渲染body部分
  drawBodyPartVirtual(leftBodyGroup.value, leftCols, leftBodyPools)
  drawBodyPartVirtual(centerBodyGroup.value, centerCols, centerBodyPools)
  drawBodyPartVirtual(rightBodyGroup.value, rightCols, rightBodyPools)

  createScrollbars()

  headerLayer.value.batchDraw()
  bodyLayer.value?.batchDraw()
  fixedLayer.value?.batchDraw()
  fixedHeaderLayer.value?.batchDraw()
  scrollbarLayer.value?.batchDraw()
}

function createScrollbars() {
  if (!stage.value || !scrollbarLayer.value) return

  const stageWidth = stage.value.width()
  const stageHeight = stage.value.height()
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
  scrollbarLayer.value.add(vScrollbarHeaderMask)

  // Vertical scrollbar
  if (maxScrollY > 0) {
    vScrollbar.value = new Konva.Group()
    scrollbarLayer.value.add(vScrollbar.value)

    const vTrack = new Konva.Rect({
      x: stageWidth - scrollbarSize,
      y: headerHeight,
      width: scrollbarSize,
      height: stageHeight - headerHeight - scrollbarSize,
      fill: scrollbarBg,
      stroke: borderColor,
      strokeWidth: 1
    })
    vScrollbar.value!.add(vTrack)

    const thumbHeight = Math.max(
      20,
      ((stageHeight - headerHeight - scrollbarSize) * (stageHeight - headerHeight - scrollbarSize)) /
        (data.length * rowHeight)
    )
    const thumbY =
      headerHeight + (scrollY.value / maxScrollY) * (stageHeight - headerHeight - scrollbarSize - thumbHeight)

    vThumb.value = new Konva.Rect({
      x: stageWidth - scrollbarSize + 2,
      y: thumbY,
      width: scrollbarSize - 4,
      height: thumbHeight,
      fill: scrollbarThumb,
      cornerRadius: 2,
      draggable: false
    })
    vScrollbar.value!.add(vThumb.value)

    setupVerticalScrollbarEvents()
  }

  // Horizontal scrollbar
  if (maxScrollX > 0) {
    hScrollbar.value = new Konva.Group()
    scrollbarLayer.value.add(hScrollbar.value!)

    const hTrack = new Konva.Rect({
      x: 0,
      y: stageHeight - scrollbarSize,
      width: stageWidth - scrollbarSize,
      height: scrollbarSize,
      fill: scrollbarBg,
      stroke: borderColor,
      strokeWidth: 1
    })
    hScrollbar.value!.add(hTrack)

    const { leftWidth, rightWidth, centerWidth } = getSplitColumns()
    const visibleWidth = stageWidth - leftWidth - rightWidth - scrollbarSize
    const thumbWidth = Math.max(20, (visibleWidth * visibleWidth) / centerWidth)
    const thumbX = leftWidth + (scrollX.value / maxScrollX) * (visibleWidth - thumbWidth)

    hThumb.value = new Konva.Rect({
      x: thumbX,
      y: stageHeight - scrollbarSize + 2,
      width: thumbWidth,
      height: scrollbarSize - 4,
      fill: scrollbarThumb,
      cornerRadius: 2,
      draggable: false
    })
    hScrollbar.value!.add(hThumb.value)

    setupHorizontalScrollbarEvents()
  }
}

/**
 * 绘制表头部分
 */
function drawHeaderPart(group: Konva.Group | null, cols: ColumnDef[], startX: number) {
  if (!group) return

  // background
  const totalWidth = cols.reduce((acc, c) => acc + c.width, 0)
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
      width: col.width,
      height: headerHeight,
      stroke: borderColor,
      strokeWidth: 1,
      listening: false
    })
    group.add(cell)

    const maxTextWidth = col.width - 16 // 8px padding on each side
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

    x += col.width
  })

  // 表头渲染完成后，如果是左侧表头，创建固定列阴影
  if (group && group.name() === 'leftHeader') {
    // 延迟创建阴影，确保所有内容都已渲染
    setTimeout(() => createFixedColumnShadow(), 0)
  }
}

function setupVerticalScrollbarEvents() {
  if (!vThumb.value || !stage.value) return

  vThumb.value.on('mousedown', (e: any) => {
    isDraggingVThumb = true
    dragStartY = e.evt.clientY
    dragStartScrollY = scrollY.value
    stage.value!.container().style.cursor = 'grabbing'
  })

  vThumb.value.on('mouseenter', () => {
    const vt: any = vThumb.value
    if (vt && typeof vt.fill === 'function') vt.fill(scrollbarThumbHover)
    scrollbarLayer.value?.batchDraw()
  })

  vThumb.value.on('mouseleave', () => {
    const vt: any = vThumb.value
    if (
      vt &&
      !isDraggingVThumb &&
      typeof vt.fill === 'function' &&
      typeof vt.getClassName === 'function' &&
      vt.getClassName() === 'Rect'
    )
      vt.fill(scrollbarThumb)
    scrollbarLayer.value?.batchDraw()
  })
}

/**
 * 设置水平滚动条事件
 */
function setupHorizontalScrollbarEvents() {
  if (!hThumb.value || !stage.value) return

  hThumb.value.on('mousedown', (e: any) => {
    isDraggingHThumb = true
    dragStartX = e.evt.clientX
    dragStartScrollX = scrollX.value
    stage.value!.container().style.cursor = 'grabbing'
  })

  hThumb.value.on('mouseenter', () => {
    const ht: any = hThumb.value
    if (ht && typeof ht.fill === 'function') ht.fill(scrollbarThumbHover)
    scrollbarLayer.value?.batchDraw()
  })

  hThumb.value.on('mouseleave', () => {
    const ht: any = hThumb.value
    if (
      ht &&
      !isDraggingHThumb &&
      typeof ht.fill === 'function' &&
      typeof ht.getClassName === 'function' &&
      ht.getClassName() === 'Rect'
    )
      ht.fill(scrollbarThumb)
    scrollbarLayer.value?.batchDraw()
  })
}
/**
 * 虚拟滚动版本的drawBodyPart - 只渲染可视区域的行
 */
function drawBodyPartVirtual(group: Konva.Group | null, cols: ColumnDef[], pools: ObjectPools) {
  if (!stage.value || !group) return

  // 计算可视区域
  calculateVisibleRows()

  const totalWidth = cols.reduce((acc, c) => acc + c.width, 0)

  // 清空当前组，将对象返回池中
  const rawChildren: any = (group as any).getChildren ? (group as any).getChildren() : []
  const children = Array.isArray(rawChildren)
    ? rawChildren.slice()
    : rawChildren && typeof rawChildren.toArray === 'function'
      ? rawChildren.toArray()
      : [] // 复制数组避免修改时的问题
  children.forEach((child) => {
    if ((child as any).getClassName && (child as any).getClassName() === 'Rect') {
      // 检查是否为阴影元素
      if (child.name() === 'fixedColumnShadow') {
        child.destroy() // 阴影元素直接销毁，不回收到池中
      } else if (
        typeof (child as any).fill === 'function' &&
        (child as any).fill() &&
        (child as any).fill() !== 'transparent'
      ) {
        // 背景矩形
        returnToPool(pools.backgroundRects as any, child as any)
      } else {
        // 单元格边框矩形
        returnToPool(pools.cellRects as any, child as any)
      }
    } else if ((child as any).getClassName && (child as any).getClassName() === 'Text') {
      returnToPool(pools.textNodes as any, child as any)
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
      cell.width(col.width)
      cell.height(rowHeight)
      cell.stroke(borderColor)
      cell.strokeWidth(1)
      cell.fill('transparent')

      // 清除之前的事件监听器
      cell.off('click')

      // 添加点击事件
      cell.on('click', () => {
        handleCellClick(rowIndex, colIndex, col, cell.x(), cell.y(), col.width, rowHeight, group)
      })
      group.add(cell)

      // 创建文本
      const value = String(row[col.key] ?? '')
      const maxTextWidth = col.width - 16
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

      x += col.width
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
        highlightX += cols[i].width
      }
      const highlightY = selectedCell!.rowIndex * rowHeight
      const highlightWidth = cols[selectedColIndex].width

      // 重新创建高亮
      createHighlightRect(highlightX, highlightY, highlightWidth, rowHeight, group)
    }
  }

  // 阴影现在由createFixedColumnShadow()统一管理，不需要在这里添加

  // 取消调试日志输出
}

function updateVerticalScroll(offsetY: number) {
  if (!stage.value || !leftBodyGroup.value || !centerBodyGroup.value || !rightBodyGroup.value) return
  const { maxScrollY } = getScrollLimits()
  const oldScrollY = scrollY.value
  scrollY.value = clamp(scrollY.value + offsetY, 0, maxScrollY)

  // 检查是否需要重新渲染（滚动超过一定阈值或可视区域改变）
  const oldVisibleStart = visibleRowStart
  const oldVisibleEnd = visibleRowEnd
  calculateVisibleRows()

  const needsRerender =
    visibleRowStart !== oldVisibleStart ||
    visibleRowEnd !== oldVisibleEnd ||
    Math.abs(scrollY.value - oldScrollY) > rowHeight * 2 // 滚动超过2行时强制重新渲染

  if (needsRerender) {
    // 重新渲染可视区域
    const { leftCols, centerCols, rightCols } = getSplitColumns()
    drawBodyPartVirtual(leftBodyGroup.value, leftCols, leftBodyPools)
    drawBodyPartVirtual(centerBodyGroup.value, centerCols, centerBodyPools)
    drawBodyPartVirtual(rightBodyGroup.value, rightCols, rightBodyPools)
  }

  const bodyY = headerHeight - scrollY.value
  const centerY = -scrollY.value

  // Only body content moves vertically, headers stay fixed
  leftBodyGroup.value.y(bodyY)
  rightBodyGroup.value.y(bodyY)
  centerBodyGroup.value.y(centerY)

  updateScrollbars()
  bodyLayer.value?.batchDraw()
  fixedLayer.value?.batchDraw()
}

/**
 * 更新水平滚动
 * @param offsetX 水平滚动偏移量
 */
function updateHorizontalScroll(offsetX: number) {
  if (!stage.value || !centerHeaderGroup.value || !centerBodyGroup) return
  const { maxScrollX } = getScrollLimits()
  const { leftWidth } = getSplitColumns()
  scrollX.value = clamp(scrollX.value + offsetX, 0, maxScrollX)

  const headerX = leftWidth - scrollX.value
  const centerX = -scrollX.value

  // Only center scrollable content moves horizontally
  centerHeaderGroup.value.x(headerX)
  centerBodyGroup.x(centerX)

  updateScrollbars()
  headerLayer.value?.batchDraw()
  bodyLayer.value?.batchDraw()
}

/**
 * 更新滚动条
 */
function updateScrollbars() {
  if (!stage.value) return

  const stageWidth = stage.value.width()
  const stageHeight = stage.value.height()
  const { maxScrollX, maxScrollY } = getScrollLimits()

  // Update vertical thumb position
  if (vThumb.value && maxScrollY > 0) {
    const thumbHeight = Math.max(
      20,
      ((stageHeight - headerHeight - scrollbarSize) * (stageHeight - headerHeight - scrollbarSize)) /
        (data.length * rowHeight)
    )
    const thumbY =
      headerHeight + (scrollY.value / maxScrollY) * (stageHeight - headerHeight - scrollbarSize - thumbHeight)
    vThumb.value.y(thumbY)
  }

  // Update horizontal thumb position
  if (hThumb.value && maxScrollX > 0) {
    const { leftWidth, rightWidth, centerWidth } = getSplitColumns()
    const visibleWidth = stageWidth - leftWidth - rightWidth - scrollbarSize
    const thumbWidth = Math.max(20, (visibleWidth * visibleWidth) / centerWidth)
    const thumbX = leftWidth + (scrollX.value / maxScrollX) * (visibleWidth - thumbWidth)
    hThumb.value.x(thumbX)
  }

  scrollbarLayer.value?.batchDraw()
}

/**
 * 处理鼠标滚轮事件
 * @param e 鼠标滚轮事件
 */
function handleWheel(e: WheelEvent) {
  e.preventDefault()
  if (e.shiftKey) {
    // Horizontal scroll with Shift+Wheel
    updateHorizontalScroll(e.deltaY)
  } else {
    // Vertical scroll
    updateVerticalScroll(e.deltaY)

    // 取消调试日志输出
  }
}

/**
 * 处理鼠标移动事件
 * @param e 鼠标移动事件
 */
function handleMouseMove(e: MouseEvent) {
  if (!stage.value) return

  if (isDraggingVThumb) {
    const deltaY = e.clientY - dragStartY
    const { maxScrollY } = getScrollLimits()
    const stageHeight = stage.value.height()
    const trackHeight = stageHeight - headerHeight - scrollbarSize
    const thumbHeight = Math.max(20, (trackHeight * trackHeight) / (data.length * rowHeight))
    const scrollRatio = deltaY / (trackHeight - thumbHeight)
    const newScrollY = dragStartScrollY + scrollRatio * maxScrollY

    const oldScrollY = scrollY.value
    scrollY.value = clamp(newScrollY, 0, maxScrollY)

    // 检查是否需要重新渲染虚拟滚动内容
    const oldVisibleStart = visibleRowStart
    const oldVisibleEnd = visibleRowEnd
    calculateVisibleRows()

    const needsRerender =
      visibleRowStart !== oldVisibleStart ||
      visibleRowEnd !== oldVisibleEnd ||
      Math.abs(scrollY.value - oldScrollY) > rowHeight * 2

    if (needsRerender) {
      // 重新渲染可视区域
      const { leftCols, centerCols, rightCols } = getSplitColumns()
      drawBodyPartVirtual(leftBodyGroup.value, leftCols, leftBodyPools)
      drawBodyPartVirtual(centerBodyGroup.value, centerCols, centerBodyPools)
      drawBodyPartVirtual(rightBodyGroup.value, rightCols, rightBodyPools)
    }

    updateScrollPositions()
  }

  if (isDraggingHThumb) {
    const deltaX = e.clientX - dragStartX
    const { maxScrollX } = getScrollLimits()
    const { leftWidth, rightWidth, centerWidth } = getSplitColumns()
    const stageWidth = stage.value.width()
    const visibleWidth = stageWidth - leftWidth - rightWidth - scrollbarSize
    const thumbWidth = Math.max(20, (visibleWidth * visibleWidth) / centerWidth)
    const scrollRatio = deltaX / (visibleWidth - thumbWidth)
    const newScrollX = dragStartScrollX + scrollRatio * maxScrollX

    scrollX.value = clamp(newScrollX, 0, maxScrollX)
    updateScrollPositions()
  }
}

/**
 * 处理鼠标抬起事件
 */
function handleMouseUp() {
  if (isDraggingVThumb || isDraggingHThumb) {
    isDraggingVThumb = false
    isDraggingHThumb = false
    if (stage.value) stage.value.container().style.cursor = 'default'

    {
      const vt: any = vThumb.value
      if (vt && !isDraggingVThumb && typeof vt.fill === 'function') vt.fill(scrollbarThumb)
    }
    {
      const ht: any = hThumb.value
      if (ht && !isDraggingHThumb && typeof ht.fill === 'function') ht.fill(scrollbarThumb)
    }
    scrollbarLayer.value?.batchDraw()
  }
}

/**
 * 更新滚动位置
 */
function updateScrollPositions() {
  if (!leftBodyGroup.value || !centerBodyGroup.value || !rightBodyGroup.value || !centerHeaderGroup.value) return

  const { leftWidth } = getSplitColumns()
  const bodyY = headerHeight - scrollY.value
  const centerX = -scrollX.value
  const headerX = leftWidth - scrollX.value
  leftBodyGroup.value.y(bodyY)
  rightBodyGroup.value.y(bodyY)

  // Update center scrollable content (both X and Y)
  centerBodyGroup.value.x(centerX)
  centerBodyGroup.value.y(-scrollY.value)

  // Update center header (only X position changes)
  centerHeaderGroup.value.x(headerX)

  // Fixed headers (leftHeaderGroup.value and rightHeaderGroup.value) never move - they stay at (0,0) and fixed right position

  updateScrollbars()
  headerLayer.value?.batchDraw()
  bodyLayer.value?.batchDraw()
  fixedLayer.value?.batchDraw()
  fixedHeaderLayer.value?.batchDraw()
}

/**
 * 处理窗口大小改变
 */
function handleResize() {
  initTable()

  // 重新计算可视区域（窗口大小改变时）
  calculateVisibleRows()

  // Rebuild groups to adjust right pinned x position
  clearGroups()
  rebuildGroups()

  // 重新创建固定列阴影
  setTimeout(() => createFixedColumnShadow(), 0)
}

/**
 * 初始化
 */
onMounted(async () => {
  konvaInstance.value = Konva
  initTable()

  // 初始化虚拟滚动状态
  calculateVisibleRows()

  clearGroups()
  rebuildGroups()

  const tableContainer = document.querySelector<HTMLDivElement>('#container-table')
  tableContainer?.addEventListener('wheel', handleWheel, { passive: false })
  window.addEventListener('resize', handleResize)
  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('mouseup', handleMouseUp)
})

/**
 * 卸载
 */
onBeforeUnmount(() => {
  const tableContainer = document.querySelector<HTMLDivElement>('#container-table')
  tableContainer?.removeEventListener('wheel', handleWheel)
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('mouseup', handleMouseUp)

  stage.value?.destroy()
  stage.value = null
  headerLayer.value = null
  bodyLayer.value = null
  fixedLayer.value = null
  fixedHeaderLayer.value = null
  scrollbarLayer.value = null
  centerBodyClipGroup.value = null
  selectedCell.value = null
  highlightRect.value = null
})
</script>

<style scoped>
.stage-container {
  width: 100%;
  border: 1px solid #e5e7eb;
  background: #fff;
}
</style>
