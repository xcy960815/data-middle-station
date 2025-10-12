import { ref } from 'vue'
import Konva from 'konva'
import type { KonvaEventObject } from 'konva/lib/Node'
import { stageVars, clearGroups } from './stage-handler'
import { staticParams } from './parameter'
import { filterColumns, handleTableData, getColumnSortStatus, handleMultiColumnSort } from './data-handler'
import { truncateText, setPointerStyle, createGroup, drawUnifiedRect, drawUnifiedText } from './utils'

import FilterDropdown from './components/filter-dropdown.vue'

interface HeaderVars {
  headerLayer: Konva.Layer | null
  leftHeaderGroup: Konva.Group | null
  centerHeaderGroup: Konva.Group | null
  rightHeaderGroup: Konva.Group | null
  /**
   * 是否正在调整列宽
   */
  isResizingColumn: boolean
  /**
   * 正在调整的列名
   */
  resizingColumnName: string | null
  /**
   * 开始拖拽时的鼠标X坐标
   */
  resizeStartX: number
  /**
   * 开始拖拽时的列宽
   */
  resizeStartWidth: number
  /**
   * 拖拽过程中的临时宽度
   */
  resizeTempWidth: number
  /**
   * 调整指示线
   */
  resizeIndicatorLine: Konva.Line | null
}

const LAYOUT_CONSTANTS = {
  /**
   * 右侧图标区域预留宽度
   */
  ICON_AREA_WIDTH: 40,
  /**
   * 排序箭头距离右边缘的距离
   */
  SORT_ARROW_OFFSET: 34,
  /**
   * 过滤图标距离右边缘的距离
   */
  FILTER_ICON_OFFSET: 12,
  /**
   * 排序箭头大小
   */
  ARROW_SIZE: 8,
  /**
   * 排序箭头高度缩放（0-1，值越小越“矮”）
   */
  ARROW_HEIGHT_SCALE: 0.72,
  /**
   * 上下箭头间距
   */
  ARROW_GAP: 2,
  /**
   * 过滤图标大小
   */
  FILTER_ICON_SIZE: 16
} as const

const COLORS = {
  /**
   * 不活跃颜色
   */
  INACTIVE: '#d0d7de'
} as const

/**
 * 排序状态 - 单独的响应式变量
 */
export const headerVars: HeaderVars = {
  /**
   * 表头层
   */
  headerLayer: null,
  /**
   * 左侧表头组
   */
  leftHeaderGroup: null,
  /**
   * 中间表头组
   */
  centerHeaderGroup: null,
  /**
   * 右侧表头组
   */
  rightHeaderGroup: null,
  /**
   * 列宽调整相关字段
   */
  isResizingColumn: false,
  /**
   * 正在调整的列名
   */
  resizingColumnName: null,
  /**
   * 开始拖拽时的鼠标X坐标
   */
  resizeStartX: 0,
  /**
   * 开始拖拽时的列宽
   */
  resizeStartWidth: 0,
  /**
   * 拖拽过程中的临时宽度
   */
  resizeTempWidth: 0,
  /**
   * 调整指示线
   */
  resizeIndicatorLine: null
}

export const filterDropdownRef = ref<InstanceType<typeof FilterDropdown>>()

/**
 * 创建表头左侧组
 * @param x x坐标
 * @param y y坐标
 * @returns {Konva.Group} 表头组
 */
export const createHeaderLeftGroup = (x: number, y: number) => createGroup('header', 'left', x, y)
/**
 * 创建表头中间组
 * @param x x坐标
 * @param y y坐标
 * @returns {Konva.Group} 表头组
 */
export const createHeaderCenterGroup = (x: number, y: number) => createGroup('header', 'center', x, y)
/**
 * 创建表头右侧组
 * @param x x坐标
 * @param y y坐标
 * @returns {Konva.Group} 表头组
 */
export const createHeaderRightGroup = (x: number, y: number) => createGroup('header', 'right', x, y)

/**
 * 创建表头裁剪组
 * @param x x坐标
 * @param y y坐标
 * @param {Object} { width, height } - 裁剪区域宽度高度
 * @param {number} width - 裁剪区域宽度
 * @param {number} height - 裁剪区域高度
 * @returns {Konva.Group} 表头组
 */
export const createHeaderClipGroup = (
  x: number,
  y: number,
  { width, height }: { x: number; y: number; width: number; height: number }
) => createGroup('header', 'center', x, y, { x, y, width, height })

/**
 * 创建过滤图标
 * @param {GroupStore.GroupOption | DimensionStore.DimensionOption} col - 列
 * @param {number} x - 列的x坐标
 * @param {number} y - 列的y坐标
 * @param {number} width - 列的宽度
 * @param {number} height - 列的高度
 * @param {Konva.Group} headerGroup - 表头组
 */
const createFilterIcon = (
  columnOption: GroupStore.GroupOption | DimensionStore.DimensionOption,
  x: number,
  headerGroup: Konva.Group
) => {
  // 检查列是否可过滤
  if (!columnOption.filterable) return

  const filterItem = filterColumns.value.find((f) => f.columnName === columnOption.columnName)
  const isFilter = !!(filterItem && filterItem.values.size > 0)
  const filterColor = isFilter ? staticParams.sortActiveColor : COLORS.INACTIVE
  const filterX = x + (columnOption.width || 0) - LAYOUT_CONSTANTS.FILTER_ICON_OFFSET
  const centerY = staticParams.headerRowHeight / 2
  const iconSize = LAYOUT_CONSTANTS.FILTER_ICON_SIZE

  const filterIcon = new Konva.Shape({
    x: filterX - iconSize / 2,
    y: centerY - iconSize / 2,
    width: iconSize,
    height: iconSize,
    listening: true,
    name: `filter-icon-${columnOption.columnName}`,
    sceneFunc: (context: Konva.Context, shape: Konva.Shape) => {
      context.beginPath()
      // 优化后的漏斗形状 - 更加圆润和对称
      const padding = 2
      const topWidth = iconSize - padding * 2
      const bottomWidth = topWidth * 0.4
      const neckHeight = iconSize * 0.6
      const cornerRadius = Math.max(1, Math.min(3, iconSize * 0.12))

      // 顶部边缘（左右上角圆润）
      context.moveTo(padding + cornerRadius, padding + 1)
      context.lineTo(padding + topWidth - cornerRadius, padding + 1)
      // 右上角圆角过渡到右侧斜边
      context.quadraticCurveTo(padding + topWidth, padding + 1, padding + topWidth * 0.7, neckHeight)

      // 底部柱状部分（右侧）
      context.lineTo(padding + topWidth * 0.7, iconSize - padding)
      context.lineTo(padding + topWidth * 0.3, iconSize - padding)

      // 底部柱状部分（左侧）
      context.lineTo(padding + topWidth * 0.3, neckHeight)
      // 左上角圆角过渡回顶部边缘
      context.quadraticCurveTo(padding, padding + 1, padding + cornerRadius, padding + 1)
      context.closePath()

      context.fillStrokeShape(shape)
    },
    stroke: filterColor,
    strokeWidth: 1.5,
    fill: isFilter ? filterColor : 'transparent',
    opacity: isFilter ? 1 : 0.6
  })

  // 添加鼠标交互
  filterIcon.on('mouseenter', () => setPointerStyle(stageVars.stage, true, 'pointer'))
  filterIcon.on('mouseleave', () => setPointerStyle(stageVars.stage, false, 'default'))

  filterIcon.on('click', (evt: KonvaEventObject<MouseEvent, Konva.Shape>) => {
    const uniqueValues = new Set<string>()

    // TODO 需要优化 遍历时间太长 暂时注释掉
    // tableData.value.forEach((row) => uniqueValues.add(String(row[columnOption.columnName] ?? '')))

    const availableOptions = Array.from(uniqueValues)
    const currentSelection = filterItem ? Array.from(filterItem.values) : []
    const allOptions = Array.from(new Set([...availableOptions, ...currentSelection]))

    filterDropdownRef.value?.openFilterDropdown(evt, columnOption.columnName, allOptions, currentSelection)
  })

  headerGroup.add(filterIcon)
}

/**
 * 创建列宽调整手柄
 * @param {GroupStore.GroupOption | DimensionStore.DimensionOption} columnOption - 列配置
 * @param {number} x - x坐标
 * @param {Konva.Group} headerGroup - 表头组
 */
const createColumnResizer = (
  columnOption: GroupStore.GroupOption | DimensionStore.DimensionOption,
  x: number,
  headerGroup: Konva.Group
) => {
  if (!columnOption.resizable) return

  const resizerRect = drawUnifiedRect({
    name: `col-resizer-${columnOption.columnName}`,
    x: x + (columnOption.width || 0) - staticParams.resizerWidth / 2,
    y: 0,
    width: staticParams.resizerWidth,
    height: staticParams.headerRowHeight,
    fill: staticParams.borderColor,
    stroke: 'transparent',
    strokeWidth: 0,
    listening: true,
    group: headerGroup
  })

  // 添加鼠标交互
  resizerRect.on('mouseenter', () => {
    if (!headerVars.isResizingColumn) {
      setPointerStyle(stageVars.stage, true, 'col-resize')
    }
  })
  resizerRect.on('mouseleave', () => {
    if (!headerVars.isResizingColumn) {
      setPointerStyle(stageVars.stage, false, 'default')
    }
  })

  resizerRect.on('mousedown', (evt: KonvaEventObject<MouseEvent, Konva.Shape | Konva.Circle>) => {
    headerVars.isResizingColumn = true
    headerVars.resizingColumnName = columnOption.columnName
    headerVars.resizeStartX = evt.evt.clientX
    headerVars.resizeStartWidth = columnOption.width || 0
    headerVars.resizeTempWidth = columnOption.width || 0
    setPointerStyle(stageVars.stage, true, 'col-resize')
  })

  resizerRect.moveToTop()
}

/**
 * 创建排序指示器 - 上下两个箭头
 * @param {GroupStore.GroupOption | DimensionStore.DimensionOption} columnOption - 列
 * @param {number} x - 列的x坐标
 * @param {number} y - 列的y坐标
 * @param {number} width - 列的宽度
 * @param {number} height - 列的高度
 * @param {Konva.Group} headerGroup - 表头组
 * @returns {Konva.Path} 排序指示器
 */
const createSortIcon = (
  columnOption: GroupStore.GroupOption | DimensionStore.DimensionOption,
  x: number,
  headerGroup: Konva.Group
) => {
  // 检查列是否可排序
  if (!columnOption.sortable) return

  const sortOrder = getColumnSortStatus(columnOption.columnName)

  // 箭头的基础位置
  const arrowX = x + (columnOption.width || 0) - LAYOUT_CONSTANTS.SORT_ARROW_OFFSET

  const centerY = staticParams.headerRowHeight / 2

  // 上箭头（升序）- 指向上方的三角形（尖端圆润）
  const upSize = LAYOUT_CONSTANTS.ARROW_SIZE
  const upHeightScale = LAYOUT_CONSTANTS.ARROW_HEIGHT_SCALE ?? 1
  const upEffectiveHeight = upSize * upHeightScale
  const upArrowY = centerY - LAYOUT_CONSTANTS.ARROW_GAP / 2 - upEffectiveHeight
  const upBaseLeftX = arrowX
  const upBaseRightX = arrowX + upSize
  const upBaseY = upArrowY + upEffectiveHeight
  const upTipX = arrowX + upSize / 2
  const upTipY = upArrowY
  const upRadius = Math.max(1, Math.min(upSize * 0.18, upEffectiveHeight * 0.35))
  // 从左底边内缩处出发，经左底角的控制点圆润过渡 -> 接近尖端左点 -> 二次贝塞尔到尖端右点 -> 经右底角控制点圆润过渡回到右底边内缩处，闭合
  const upArrowPath = `M ${upBaseLeftX + upRadius} ${upBaseY} Q ${upBaseLeftX} ${upBaseY} ${upTipX - upRadius} ${upTipY + upRadius} Q ${upTipX} ${upTipY} ${upTipX + upRadius} ${upTipY + upRadius} Q ${upBaseRightX} ${upBaseY} ${upBaseRightX - upRadius} ${upBaseY} Z`

  // 下箭头（降序）- 指向下方的三角形（尖端圆润）
  const downSize = LAYOUT_CONSTANTS.ARROW_SIZE
  const downHeightScale = LAYOUT_CONSTANTS.ARROW_HEIGHT_SCALE ?? 1
  const downEffectiveHeight = downSize * downHeightScale
  const downArrowY = centerY + LAYOUT_CONSTANTS.ARROW_GAP / 2
  const downBaseLeftX = arrowX
  const downBaseRightX = arrowX + downSize
  const downBaseY = downArrowY
  const downTipX = arrowX + downSize / 2
  const downTipY = downArrowY + downEffectiveHeight
  const downRadius = Math.max(1, Math.min(downSize * 0.18, downEffectiveHeight * 0.35))
  // 从左底边内缩处出发，经左底角控制点圆润 -> 接近尖端左点 -> 二次贝塞尔到尖端右点 -> 经右底角控制点回到右底边内缩处，闭合
  const downArrowPath = `M ${downBaseLeftX + downRadius} ${downBaseY} Q ${downBaseLeftX} ${downBaseY} ${downTipX - downRadius} ${downTipY - downRadius} Q ${downTipX} ${downTipY} ${downTipX + downRadius} ${downTipY - downRadius} Q ${downBaseRightX} ${downBaseY} ${downBaseRightX - downRadius} ${downBaseY} Z`

  // 创建上箭头
  const upArrow = new Konva.Path({
    data: upArrowPath,
    fill: sortOrder === 'asc' ? staticParams.sortActiveColor : COLORS.INACTIVE,
    name: 'sort-indicator-up'
  })

  upArrow.on('mouseenter', () => setPointerStyle(stageVars.stage, true, 'pointer'))
  upArrow.on('mouseleave', () => setPointerStyle(stageVars.stage, false, 'default'))
  upArrow.on('click', (_evt: KonvaEventObject<MouseEvent, Konva.Path>) => {
    handleSortAction(columnOption, 'asc')
  })

  // 创建下箭头
  const downArrow = new Konva.Path({
    data: downArrowPath,
    fill: sortOrder === 'desc' ? staticParams.sortActiveColor : COLORS.INACTIVE,
    name: 'sort-indicator-down'
  })

  downArrow.on('mouseenter', () => setPointerStyle(stageVars.stage, true, 'pointer'))
  downArrow.on('mouseleave', () => setPointerStyle(stageVars.stage, false, 'default'))
  downArrow.on('click', (_evt: KonvaEventObject<MouseEvent, Konva.Path>) => {
    handleSortAction(columnOption, 'desc')
  })

  headerGroup.add(upArrow)
  headerGroup.add(downArrow)
}

/**
 * 处理排序逻辑
 * @param {GroupStore.GroupOption | DimensionStore.DimensionOption} columnOption - 列配置
 * @param {'asc' | 'desc'} order - 排序方向
 */
const handleSortAction = (
  columnOption: GroupStore.GroupOption | DimensionStore.DimensionOption,
  order: 'asc' | 'desc'
) => {
  handleMultiColumnSort(columnOption, order)
  handleTableData()
  clearGroups()
}

/**
 * 创建表头文本 - 添加排序支持
 * @param {GroupStore.GroupOption | DimensionStore.DimensionOption} columnOption - 列
 * @param {number} x - 列的x坐标
 * @param {number} width - 列的宽度
 * @param {number} height - 列的高度
 * @param {Konva.Group} headerGroup - 表头组
 */
const createHeaderCellText = (
  columnOption: GroupStore.GroupOption | DimensionStore.DimensionOption,
  x: number,
  headerGroup: Konva.Group
) => {
  const sortOrder = getColumnSortStatus(columnOption.columnName)
  const hasSort = sortOrder !== null

  // 如果有排序，给文本留出箭头空间
  const maxTextWidth = hasSort ? (columnOption.width || 0) - 32 : (columnOption.width || 0) - 16

  const text = truncateText(
    columnOption.displayName || columnOption.columnName,
    maxTextWidth,
    staticParams.headerFontSize,
    staticParams.headerFontFamily
  )

  drawUnifiedText({
    name: 'header-cell-text',
    text,
    x,
    y: 0,
    width: columnOption.width || 0,
    height: staticParams.headerRowHeight,
    fontSize: staticParams.headerFontSize,
    fontFamily: staticParams.headerFontFamily,
    fill: staticParams.headerTextColor,
    align: columnOption.align ?? 'left',
    verticalAlign: columnOption.verticalAlign ?? 'middle',
    group: headerGroup
  })
}

/**
 * 绘制表头部分
 * @param {Konva.Group | null} headerGroup - 表头组
 * @param {Array<GroupStore.GroupOption | DimensionStore.DimensionOption>} headerCols - 表头列配置
 */
export const drawHeaderPart = (
  headerGroup: Konva.Group | null,
  headerCols: Array<GroupStore.GroupOption | DimensionStore.DimensionOption>
) => {
  if (!headerGroup || !stageVars.stage) return

  // 绘制简化的表头
  let x = 0
  const resizerTasks: Array<() => void> = []
  for (let colIndex = 0; colIndex < headerCols.length; colIndex++) {
    const columnOption = headerCols[colIndex]
    const columnWidth = columnOption.width || 0

    if (columnWidth <= 0) {
      x += columnWidth
      continue
    }
    // 创建背景矩形
    drawUnifiedRect({
      name: 'header-cell-rect',
      x,
      y: 0,
      width: columnWidth,
      height: staticParams.headerRowHeight,
      fill: staticParams.headerBackground,
      stroke: staticParams.borderColor,
      strokeWidth: 1,
      listening: false,
      group: headerGroup
    })

    // 创建文本
    createHeaderCellText(columnOption, x, headerGroup)

    // 添加排序icon
    createSortIcon(columnOption, x, headerGroup)

    // 添加过滤icon
    createFilterIcon(columnOption, x, headerGroup)

    // 只先保存任务，不执行；注意闭包中捕获当前列的 x
    const currentX = x

    resizerTasks.push(() => createColumnResizer(columnOption, currentX, headerGroup))

    x += columnWidth
  }
  /**
   * 统一创建手柄
   */
  for (const task of resizerTasks) {
    task()
  }
}
