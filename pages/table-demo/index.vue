<template>
  <div ref="containerRef" class="stage-container"></div>
</template>

<script setup lang="ts">
definePageMeta({ ssr: false })
import { onBeforeUnmount, onMounted, ref } from 'vue'
// 仅导入类型，运行时在客户端动态加载，避免SSR侧加载node版依赖
import type Konva from 'konva'

// 运行时Konva引用（仅在客户端赋值）
const konvaInstance = ref<typeof import('konva') | null>(null)

type PinDirection = 'left' | 'right' | null

interface ColumnDef {
  key: string
  title: string
  width: number
  pin: PinDirection
  align?: 'left' | 'center' | 'right'
}

interface RowData {
  [key: string]: string | number
}

const containerRef = ref<HTMLDivElement | null>(null)

/**
 * 表头配置
 * key: 列的唯一标识
 * title: 列的标题
 * width: 列的宽度
 * pin: 列是否固定，固定在左侧或右侧
 * align: 列的对齐方式
 */
const columns: ColumnDef[] = [
  { key: 'id', title: 'ID', width: 80, pin: 'left', align: 'right' },
  { key: 'name', title: 'Name', width: 120, pin: null },
  { key: 'age', title: 'Age', width: 80, pin: null, align: 'right' },
  { key: 'gender', title: 'Gender', width: 80, pin: null },
  { key: 'country', title: 'Country', width: 120, pin: null },
  { key: 'city', title: 'City', width: 120, pin: null },
  { key: 'state', title: 'State', width: 100, pin: null },
  { key: 'zipcode', title: 'Zip Code', width: 100, pin: null },
  { key: 'address', title: 'Address', width: 200, pin: null },
  { key: 'phone', title: 'Phone', width: 140, pin: null },
  { key: 'mobile', title: 'Mobile', width: 140, pin: null },
  { key: 'company', title: 'Company', width: 150, pin: null },
  { key: 'department', title: 'Department', width: 120, pin: null },
  { key: 'position', title: 'Position', width: 130, pin: null },
  { key: 'salary', title: 'Salary', width: 100, pin: null, align: 'right' },
  { key: 'experience', title: 'Experience', width: 100, pin: null, align: 'right' },
  { key: 'education', title: 'Education', width: 120, pin: null },
  { key: 'skills', title: 'Skills', width: 180, pin: null },
  { key: 'notes', title: 'Notes', width: 200, pin: 'right' },
  { key: 'email', title: 'Email', width: 220, pin: 'right' }
]

/**
 * 数据
 */
const data: RowData[] = Array.from({ length: 30000 }, (_, i) => ({
  id: i + 1,
  name: `User ${i + 1}`,
  age: 18 + ((i * 7) % 40),
  gender: ['Male', 'Female', 'Other'][(i * 3) % 3],
  country: ['China', 'USA', 'UK', 'Germany', 'France', 'Japan', 'Canada', 'Australia'][(i * 3) % 8],
  city: ['Beijing', 'Shanghai', 'New York', 'London', 'Berlin', 'Paris', 'Tokyo', 'Toronto', 'Sydney'][(i * 5) % 9],
  state: ['CA', 'NY', 'TX', 'FL', 'WA', 'IL', 'PA', 'OH', 'GA', 'NC'][(i * 7) % 10],
  zipcode: `${10000 + ((i * 123) % 90000)}`,
  address: `${i + 1} Main Street, Apt ${(i % 50) + 1}--${i + 1} Main Street, Apt ${(i % 50) + 1}---${i + 1} Main Street, Apt ${(i % 50) + 1}`,
  phone: `+1-555-${String(1000 + i).slice(-4)}`,
  mobile: `+1-666-${String(2000 + i).slice(-4)}`,
  company: ['TechCorp', 'DataSoft', 'CloudInc', 'WebSolutions', 'AppDev', 'SystemsLtd', 'CodeWorks', 'DigitalPro'][
    (i * 11) % 8
  ],
  department: ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations', 'Support', 'Design'][(i * 13) % 8],
  position: ['Developer', 'Manager', 'Analyst', 'Designer', 'Consultant', 'Specialist', 'Coordinator', 'Director'][
    (i * 17) % 8
  ],
  salary: `$${(30000 + ((i * 1000) % 120000)).toLocaleString()}`,
  experience: `${(i % 20) + 1} years`,
  education: ['Bachelor', 'Master', 'PhD', 'Associate', 'High School', 'Certificate'][(i * 19) % 6],
  skills: [
    'JavaScript, React',
    'Python, Django',
    'Java, Spring',
    'C#, .NET',
    'PHP, Laravel',
    'Go, Gin',
    'Ruby, Rails',
    'Node.js, Express'
  ][(i * 23) % 8],
  notes: `Additional notes for user ${i + 1}. Lorem ipsum dolor sit amet.`,
  email: `user${i + 1}@${['gmail.com', 'yahoo.com', 'outlook.com', 'company.com', 'example.org'][(i * 29) % 5]}`
}))

/**
 * 布局配置
 */
const headerHeight = 40
const rowHeight = 32
const scrollbarSize = 16
const tablePadding = 0
const headerBg = '#f7f7f9'
const bodyBgOdd = '#ffffff'
const bodyBgEven = '#fbfbfd'
const borderColor = '#dcdfe6'
const headerTextColor = '#303133'
const bodyTextColor = '#303133'
const scrollbarBg = '#f1f1f1'
const scrollbarThumb = '#c1c1c1'
const scrollbarThumbHover = '#a8a8a8'

/**
 * 舞台
 */
let stage: any | null = null
let headerLayer: any | null = null
let bodyLayer: any | null = null
let fixedLayer: any | null = null
let fixedHeaderLayer: any | null = null
let scrollbarLayer: any | null = null
let shadowLayer: any | null = null

let centerBodyClipGroup: any | null = null

let leftHeaderGroup: any | null = null
let centerHeaderGroup: any | null = null
let rightHeaderGroup: any | null = null

let leftBodyGroup: any | null = null
let centerBodyGroup: any | null = null
let rightBodyGroup: any | null = null

// Scrolling state
let scrollY = 0
let scrollX = 0

// Scrollbar elements
let vScrollbar: any | null = null
let hScrollbar: any | null = null
let vThumb: any | null = null
let hThumb: any | null = null

// Drag state
let isDraggingVThumb = false
let isDraggingHThumb = false
let dragStartY = 0
let dragStartX = 0
let dragStartScrollY = 0
let dragStartScrollX = 0

// Cell selection state
let selectedCell: { rowIndex: number; colIndex: number; colKey: string } | null = null
let highlightRect: Konva.Rect | null = null

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
  const tempText = new (konvaInstance.value as any).Text({
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
  if (highlightRect) {
    highlightRect.destroy()
    highlightRect = null
  }

  // console.log('00000000000', x, y);

  // Create new highlight rectangle
  highlightRect = new (konvaInstance.value as any).Rect({
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
  if (highlightRect) {
    ;(group as any).add(highlightRect as any)
  }

  // Move highlight to top within the group
  if (highlightRect && typeof (highlightRect as any).moveToTop === 'function') {
    ;(highlightRect as any).moveToTop()
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
  selectedCell = { rowIndex, colIndex, colKey: col.key }

  // 检查选中的行是否在当前可视区域内
  if (rowIndex >= visibleRowStart && rowIndex <= visibleRowEnd) {
    // 在可视区域内，直接创建高亮
    createHighlightRect(cellX, cellY, cellWidth, cellHeight, group)
  } else {
    // 不在可视区域内，清除现有高亮，等待滚动到该位置时重新创建
    if (highlightRect) {
      highlightRect.destroy()
      highlightRect = null
    }
    // 行不在可视区域内时不输出日志
  }

  // 取消调试日志输出
}

/**
 * 获取滚动限制
 */
function getScrollLimits() {
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
 * 计算虚拟滚动的可视区域
 * 根据当前滚动位置计算需要渲染的行范围
 */
function calculateVisibleRows() {
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
  if (!stage || !bodyLayer || !headerLayer) return

  // 移除旧的阴影
  const existingBodyShadow = stage.findOne('.fixedColumnBodyShadow')
  const existingHeaderShadow = stage.findOne('.fixedColumnHeaderShadow')
  if (existingBodyShadow) existingBodyShadow.destroy()
  if (existingHeaderShadow) existingHeaderShadow.destroy()

  // 计算左侧固定列的总宽度
  const { leftCols } = getSplitColumns()
  const totalWidth = leftCols.reduce((acc, col) => acc + col.width, 0)

  //

  // 创建表头阴影
  const headerShadowRect = new (konvaInstance.value as any).Rect({
    x: totalWidth,
    y: 0, // 从顶部开始
    width: 4,
    height: headerHeight, // 表头高度
    fill: 'rgba(0, 0, 0, 0.1)',
    listening: false,
    name: 'fixedColumnHeaderShadow'
  })

  // 创建内容区域阴影
  const stageHeight = stage.height()
  const bodyShadowRect = new (konvaInstance.value as any).Rect({
    x: totalWidth,
    y: headerHeight, // 从表头下方开始
    width: 4,
    height: stageHeight - headerHeight - scrollbarSize, // 覆盖整个内容区域
    fill: 'rgba(0, 0, 0, 0.1)',
    listening: false,
    name: 'fixedColumnBodyShadow'
  })

  // 将阴影添加到对应的层
  headerLayer.add(headerShadowRect)
  bodyLayer.add(bodyShadowRect)

  headerLayer.batchDraw()
  bodyLayer.batchDraw()

  // 取消调试日志输出
}

/**
 * 确保舞台
 */
function ensureStage() {
  const el = containerRef.value
  if (!el) return
  const width = el.clientWidth || 800
  const height = el.clientHeight || 420

  if (!stage) {
    stage = new (konvaInstance.value as any).Stage({ container: el, width, height })
  } else {
    stage.size({ width, height })
  }

  if (!headerLayer) {
    headerLayer = new (konvaInstance.value as any).Layer()
    stage.add(headerLayer)
  }

  if (!bodyLayer) {
    bodyLayer = new (konvaInstance.value as any).Layer()
    stage.add(bodyLayer)
  }

  if (!fixedLayer) {
    fixedLayer = new (konvaInstance.value as any).Layer()
    stage.add(fixedLayer)
  }

  if (!fixedHeaderLayer) {
    fixedHeaderLayer = new (konvaInstance.value as any).Layer()
    stage.add(fixedHeaderLayer)
  }

  if (!scrollbarLayer) {
    scrollbarLayer = new (konvaInstance.value as any).Layer()
    stage.add(scrollbarLayer)
  }

  const { leftWidth, rightWidth } = getSplitColumns()
  const contentHeight = height - headerHeight - scrollbarSize

  // Always recreate clipping group for center scrollable content
  centerBodyClipGroup = new (konvaInstance.value as any).Group({
    x: leftWidth,
    y: headerHeight,
    clip: {
      x: 0,
      y: 0,
      width: width - leftWidth - rightWidth - scrollbarSize,
      height: contentHeight
    }
  })
  bodyLayer.add(centerBodyClipGroup)
}

/**
 * 清除组
 */
function clearGroups() {
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
}

function rebuildGroups() {
  if (!stage || !headerLayer || !bodyLayer || !fixedLayer || !fixedHeaderLayer || !scrollbarLayer) return

  const { leftCols, centerCols, rightCols, leftWidth, rightWidth } = getSplitColumns()
  const stageWidth = stage.width()
  const stageHeight = stage.height()

  // Ensure centerBodyClipGroup exists
  if (!centerBodyClipGroup) {
    const contentHeight = stageHeight - headerHeight - scrollbarSize
    centerBodyClipGroup = new (konvaInstance.value as any).Group({
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

  leftHeaderGroup = new (konvaInstance.value as any).Group({ x: 0, y: 0, name: 'leftHeader' })
  centerHeaderGroup = new (konvaInstance.value as any).Group({ x: leftWidth - scrollX, y: 0, name: 'centerHeader' })
  rightHeaderGroup = new (konvaInstance.value as any).Group({
    x: stageWidth - rightWidth - scrollbarSize,
    y: 0,
    name: 'rightHeader'
  })

  leftBodyGroup = new (konvaInstance.value as any).Group({ x: 0, y: headerHeight - scrollY, name: 'leftBody' })
  centerBodyGroup = new (konvaInstance.value as any).Group({ x: -scrollX, y: -scrollY, name: 'centerBody' })
  rightBodyGroup = new (konvaInstance.value as any).Group({
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

  createScrollbars()

  headerLayer.batchDraw()
  bodyLayer?.batchDraw()
  fixedLayer?.batchDraw()
  fixedHeaderLayer?.batchDraw()
  scrollbarLayer?.batchDraw()
}

function createScrollbars() {
  if (!stage || !scrollbarLayer) return

  const stageWidth = stage.width()
  const stageHeight = stage.height()
  const { maxScrollX, maxScrollY } = getScrollLimits()

  // Create mask for vertical scrollbar header area to hide overflowing content
  const vScrollbarHeaderMask = new (konvaInstance.value as any).Rect({
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
    vScrollbar = new (konvaInstance.value as any).Group()
    scrollbarLayer.add(vScrollbar)

    const vTrack = new (konvaInstance.value as any).Rect({
      x: stageWidth - scrollbarSize,
      y: headerHeight,
      width: scrollbarSize,
      height: stageHeight - headerHeight - scrollbarSize,
      fill: scrollbarBg,
      stroke: borderColor,
      strokeWidth: 1
    })
    vScrollbar!.add(vTrack)

    const thumbHeight = Math.max(
      20,
      ((stageHeight - headerHeight - scrollbarSize) * (stageHeight - headerHeight - scrollbarSize)) /
        (data.length * rowHeight)
    )
    const thumbY = headerHeight + (scrollY / maxScrollY) * (stageHeight - headerHeight - scrollbarSize - thumbHeight)

    vThumb = new (konvaInstance.value as any).Rect({
      x: stageWidth - scrollbarSize + 2,
      y: thumbY,
      width: scrollbarSize - 4,
      height: thumbHeight,
      fill: scrollbarThumb,
      cornerRadius: 2,
      draggable: false
    })
    vScrollbar!.add(vThumb)

    setupVerticalScrollbarEvents()
  }

  // Horizontal scrollbar
  if (maxScrollX > 0) {
    hScrollbar = new (konvaInstance.value as any).Group()
    scrollbarLayer.add(hScrollbar!)

    const hTrack = new (konvaInstance.value as any).Rect({
      x: 0,
      y: stageHeight - scrollbarSize,
      width: stageWidth - scrollbarSize,
      height: scrollbarSize,
      fill: scrollbarBg,
      stroke: borderColor,
      strokeWidth: 1
    })
    hScrollbar!.add(hTrack)

    const { leftWidth, rightWidth, centerWidth } = getSplitColumns()
    const visibleWidth = stageWidth - leftWidth - rightWidth - scrollbarSize
    const thumbWidth = Math.max(20, (visibleWidth * visibleWidth) / centerWidth)
    const thumbX = leftWidth + (scrollX / maxScrollX) * (visibleWidth - thumbWidth)

    hThumb = new (konvaInstance.value as any).Rect({
      x: thumbX,
      y: stageHeight - scrollbarSize + 2,
      width: thumbWidth,
      height: scrollbarSize - 4,
      fill: scrollbarThumb,
      cornerRadius: 2,
      draggable: false
    })
    hScrollbar!.add(hThumb)

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
  const bg = new (konvaInstance.value as any).Rect({
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
    const cell = new (konvaInstance.value as any).Rect({
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

    const label = new (konvaInstance.value as any).Text({
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
  if (!vThumb || !stage) return

  vThumb.on('mousedown', (e: any) => {
    isDraggingVThumb = true
    dragStartY = e.evt.clientY
    dragStartScrollY = scrollY
    stage!.container().style.cursor = 'grabbing'
  })

  vThumb.on('mouseenter', () => {
    const vt: any = vThumb
    if (vt && typeof vt.fill === 'function') vt.fill(scrollbarThumbHover)
    scrollbarLayer?.batchDraw()
  })

  vThumb.on('mouseleave', () => {
    const vt: any = vThumb
    if (
      vt &&
      !isDraggingVThumb &&
      typeof vt.fill === 'function' &&
      typeof vt.getClassName === 'function' &&
      vt.getClassName() === 'Rect'
    )
      vt.fill(scrollbarThumb)
    scrollbarLayer?.batchDraw()
  })
}

/**
 * 设置水平滚动条事件
 */
function setupHorizontalScrollbarEvents() {
  if (!hThumb || !stage) return

  hThumb.on('mousedown', (e: any) => {
    isDraggingHThumb = true
    dragStartX = e.evt.clientX
    dragStartScrollX = scrollX
    stage!.container().style.cursor = 'grabbing'
  })

  hThumb.on('mouseenter', () => {
    const ht: any = hThumb
    if (ht && typeof ht.fill === 'function') ht.fill(scrollbarThumbHover)
    scrollbarLayer?.batchDraw()
  })

  hThumb.on('mouseleave', () => {
    const ht: any = hThumb
    if (
      ht &&
      !isDraggingHThumb &&
      typeof ht.fill === 'function' &&
      typeof ht.getClassName === 'function' &&
      ht.getClassName() === 'Rect'
    )
      ht.fill(scrollbarThumb)
    scrollbarLayer?.batchDraw()
  })
}
/**
 * 虚拟滚动版本的drawBodyPart - 只渲染可视区域的行
 */
function drawBodyPartVirtual(group: Konva.Group | null, cols: ColumnDef[], pools: ObjectPools) {
  if (!stage || !group) return

  // 计算可视区域
  calculateVisibleRows()

  const totalWidth = cols.reduce((acc, c) => acc + c.width, 0)

  // 清空当前组，将对象返回池中
  const children = group.children.slice() // 复制数组避免修改时的问题
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
    const bg = getFromPool(pools.backgroundRects, () => new (konvaInstance.value as any).Rect({ listening: false }))

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
      const cell = getFromPool(
        pools.cellRects,
        () => new (konvaInstance.value as any).Rect({ listening: true, cursor: 'pointer' })
      )

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

      const textNode = getFromPool(pools.textNodes, () => new (konvaInstance.value as any).Text({ listening: false }))

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

  // 取消调试日志输出

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
}

function updateHorizontalScroll(offsetX: number) {
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
}

function updateScrollbars() {
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

function handleMouseMove(e: MouseEvent) {
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
}

/**
 * 处理鼠标抬起事件
 */
function handleMouseUp() {
  if (isDraggingVThumb || isDraggingHThumb) {
    isDraggingVThumb = false
    isDraggingHThumb = false
    if (stage) stage.container().style.cursor = 'default'

    {
      const vt: any = vThumb
      if (vt && !isDraggingVThumb && typeof vt.fill === 'function') vt.fill(scrollbarThumb)
    }
    {
      const ht: any = hThumb
      if (ht && !isDraggingHThumb && typeof ht.fill === 'function') ht.fill(scrollbarThumb)
    }
    scrollbarLayer?.batchDraw()
  }
}

/**
 * 更新滚动位置
 */
function updateScrollPositions() {
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
function handleResize() {
  ensureStage()

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
  // 动态加载，仅在客户端执行，避免node端引入konva/lib/index-node
  if (!konvaInstance.value) {
    konvaInstance.value = await import('konva')
  }

  ensureStage()

  // 初始化虚拟滚动状态
  calculateVisibleRows()

  clearGroups()
  rebuildGroups()

  const el = containerRef.value
  el?.addEventListener('wheel', handleWheel, { passive: false })
  window.addEventListener('resize', handleResize)
  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('mouseup', handleMouseUp)
})

/**
 * 卸载
 */
onBeforeUnmount(() => {
  const el = containerRef.value
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

<style scoped>
.stage-container {
  height: 460px;
  width: 100%;
  border: 1px solid #e5e7eb;
  background: #fff;
}
</style>
