import Konva from 'konva'
import type { KonvaEventObject } from 'konva/lib/Node'
import { ref } from 'vue'
import { columnsInfo } from './body-handler'
import { filterColumns, getColumnSortStatus, handleMultiColumnSort, handleTableData } from './data-handler'
import { staticParams } from './parameter'
import { scrollbarVars } from './scrollbar-handler'
import { clearGroups, getStageSize, refreshTable, scheduleLayersBatchDraw, stageVars } from './stage-handler'
import {
  LAYOUT_CONSTANTS,
  calculateTextWidth,
  createGroup,
  drawUnifiedRect,
  drawUnifiedText,
  setPointerStyle,
  truncateText
} from './utils'

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
  /**
   * 是否正在拖拽列
   */
  isDraggingColumn: boolean
  /**
   * 正在拖拽的列配置
   */
  draggingColumnName: string | null
  /**
   * 拖拽开始时的鼠标坐标
   */
  dragStartX: number
  /**
   * 开始拖拽时的列宽
   */
  dragStartWidth: number
  /**
   * 拖拽过程中的临时宽度
   */
  dragTempWidth: number
  /**
   * 拖拽插入指示线
   */
  dragDropIndicator: Konva.Rect | null
}

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
  resizeIndicatorLine: null,
  /**
   * 列拖拽相关字段
   */
  isDraggingColumn: false,
  /**
   * 正在拖拽的列配置
   */
  draggingColumnName: null,
  /**
   * 拖拽开始时的鼠标坐标
   */
  dragStartX: 0,
  /**
   * 开始拖拽时的列宽
   */
  dragStartWidth: 0,
  /**
   * 拖拽过程中的临时宽度
   */
  dragTempWidth: 0,
  /**
   * 拖拽插入指示线
   */
  dragDropIndicator: null
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
 * 创建拖拽图标
 * @param {GroupStore.GroupOption | DimensionStore.DimensionOption} columnOption - 列配置
 * @param {number} x - 列的x坐标
 * @param {Konva.Group} headerGroup - 表头组
 */
export const createDragIcon = (
  columnOption: GroupStore.GroupOption | DimensionStore.DimensionOption,
  x: number,
  headerGroup: Konva.Group
) => {
  // 固定列不显示拖拽图标
  if (columnOption.fixed || !columnOption.draggable) return

  const dragIconHeight = staticParams.dragIconHeight
  const dragIconWidth = staticParams.dragIconWidth
  const iconX = x + staticParams.textPaddingHorizontal
  const iconY = (staticParams.headerRowHeight - dragIconHeight) / 2

  // 添加背景矩形增加可点击区域和调试可见性 - 直接添加到headerGroup
  const dragIconRect = drawUnifiedRect({
    name: `drag-icon-bg-${columnOption.columnName}`,
    x: iconX,
    y: iconY,
    width: dragIconWidth,
    height: dragIconHeight,
    fill: 'transparent',
    stroke: 'rgba(0,0,0,0.2)',
    strokeWidth: 0,
    listening: true,
    group: headerGroup
  })

  const dragIconDotSize = staticParams.dragIconDotSize
  const startX = iconX + 2
  const startY = iconY + 3

  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 2; col++) {
      const dotX = startX + col * 5
      const dotY = startY + row * 6
      const dotCircle = new Konva.Circle({
        name: `drag-dot-${columnOption.columnName}-${row}-${col}`,
        x: dotX,
        y: dotY,
        radius: dragIconDotSize / 2,
        fill: 'rgba(0,0,0,0.1)',
        listening: false
      })

      headerGroup.add(dotCircle)
    }
  }

  // 添加悬停效果到背景矩形
  dragIconRect.on('mouseenter', (event: KonvaEventObject<MouseEvent, Konva.Rect>) => {
    if (!headerVars.isDraggingColumn) {
      setPointerStyle(stageVars.stage, true, 'grab')
    }
  })

  dragIconRect.on('mouseleave', (event: KonvaEventObject<MouseEvent, Konva.Rect>) => {
    if (!headerVars.isDraggingColumn) {
      setPointerStyle(stageVars.stage, false, 'default')
    }
  })
  // 添加拖拽事件到背景矩形
  dragIconRect.on('mousedown', (event: KonvaEventObject<MouseEvent, Konva.Rect>) => {
    event.cancelBubble = true
    // 设置拖拽状态
    headerVars.isDraggingColumn = true
    headerVars.draggingColumnName = columnOption.columnName
    headerVars.dragStartX = event.evt.clientX
    setPointerStyle(stageVars.stage, true, 'grabbing')
  })
  return dragIconRect
}

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
const createResizerIcon = (
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
  console.log('x', x)

  // 计算文本起始位置（为拖拽图标留出空间）
  const textStartX = x //+ TEXT_SPACING_CONSTANTS.TEXT_PADDING_HORIZONTAL

  // 使用统一的文本宽度计算函数
  const maxTextWidth = calculateTextWidth.forHeaderCell(columnOption)

  const text = truncateText(
    columnOption.displayName || columnOption.columnName,
    maxTextWidth,
    staticParams.headerFontSize,
    staticParams.headerFontFamily
  )

  drawUnifiedText({
    name: 'header-cell-text',
    text,
    x: textStartX,
    y: 0,
    width: columnOption.width || 0,
    height: staticParams.headerRowHeight,
    fontSize: staticParams.headerFontSize,
    fontFamily: staticParams.headerFontFamily,
    fill: staticParams.headerTextColor,
    // align: columnOption.align ?? 'left',
    align: 'left',
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

    // 添加拖拽图标
    createDragIcon(columnOption, x, headerGroup)

    // 创建文本
    createHeaderCellText(columnOption, x, headerGroup)

    // 添加排序icon
    createSortIcon(columnOption, x, headerGroup)

    // 添加过滤icon
    createFilterIcon(columnOption, x, headerGroup)

    // 只先保存任务，不执行；注意闭包中捕获当前列的 x
    const currentX = x

    // 这么做是为了不让下一个rect 覆盖 resizer rect
    resizerTasks.push(() => createResizerIcon(columnOption, currentX, headerGroup))

    x += columnWidth
  }
  /**
   * 统一创建手柄
   */
  for (const createResizerTask of resizerTasks) {
    createResizerTask()
  }
}

/**
 * 更新列宽调整指示线
 * @returns {void}
 */
export const updateResizeIndicator = (): void => {
  if (!headerVars.isResizingColumn || !headerVars.resizingColumnName) return

  const { height: stageHeight, width: stageWidth } = getStageSize()

  // 找到目标列并确定其所在分区
  const targetColumnInLeft = columnsInfo.leftColumns.find((c) => c.columnName === headerVars.resizingColumnName)
  const targetColumnInCenter = columnsInfo.centerColumns.find((c) => c.columnName === headerVars.resizingColumnName)
  const targetColumnInRight = columnsInfo.rightColumns.find((c) => c.columnName === headerVars.resizingColumnName)

  let indicatorX = 0

  if (targetColumnInLeft) {
    // 左固定列：从0开始累加
    for (const col of columnsInfo.leftColumns) {
      if (col.columnName === headerVars.resizingColumnName) {
        indicatorX += headerVars.resizeTempWidth
        break
      }
      indicatorX += col.width || 0
    }
  } else if (targetColumnInCenter) {
    // 中间列：从左固定列宽度开始，减去滚动偏移
    indicatorX = columnsInfo.leftPartWidth
    for (const col of columnsInfo.centerColumns) {
      if (col.columnName === headerVars.resizingColumnName) {
        indicatorX += headerVars.resizeTempWidth
        break
      }
      indicatorX += col.width || 0
    }
    indicatorX -= scrollbarVars.stageScrollX
  } else if (targetColumnInRight) {
    // 右固定列：从舞台右侧开始，往左累加
    indicatorX = stageWidth - columnsInfo.rightPartWidth
    for (const col of columnsInfo.rightColumns) {
      if (col.columnName === headerVars.resizingColumnName) {
        indicatorX += headerVars.resizeTempWidth
        break
      }
      indicatorX += col.width || 0
    }
  } else {
    return // 未找到目标列
  }

  // 创建或更新指示线
  if (!headerVars.resizeIndicatorLine) {
    headerVars.resizeIndicatorLine = new Konva.Line({
      points: [indicatorX, 0, indicatorX, stageHeight],
      stroke: '#4A90E2',
      strokeWidth: 2,
      dash: [5, 5],
      listening: false
    })
    headerVars.headerLayer?.add(headerVars.resizeIndicatorLine)
  } else {
    headerVars.resizeIndicatorLine.points([indicatorX, 0, indicatorX, stageHeight])
  }

  headerVars.headerLayer?.batchDraw()
}

/**
 * 更新列拖拽指示器
 * @returns {void}
 */
export const updateDragIndicator = (): void => {
  if (!headerVars.isDraggingColumn || !headerVars.draggingColumnName) return

  const { height: stageHeight } = getStageSize()
  const stagePos = stageVars.stage?.getPointerPosition()

  if (!stagePos) return

  // 计算目标插入位置
  const targetInfo = calculateDropTarget(stagePos.x)

  if (targetInfo.canDrop) {
    // 获取被拖拽列的宽度
    const allColumns = [...columnsInfo.leftColumns, ...columnsInfo.centerColumns, ...columnsInfo.rightColumns]
    const draggingColumn = allColumns.find((col) => col.columnName === headerVars.draggingColumnName)
    const dragWidth = draggingColumn?.width || 100

    // 创建或更新插入指示矩形
    if (!headerVars.dragDropIndicator) {
      headerVars.dragDropIndicator = new Konva.Rect({
        name: 'drag-drop-indicator',
        x: targetInfo.insertX,
        y: 0,
        width: dragWidth,
        height: stageHeight,
        fill: 'rgba(74, 144, 226, 0.2)', // 半透明蓝色填充
        stroke: '#4A90E2',
        strokeWidth: 2,
        dash: [5, 5], // 虚线边框
        listening: false
      })
      headerVars.headerLayer?.add(headerVars.dragDropIndicator)
    } else {
      // 更新位置和尺寸
      headerVars.dragDropIndicator.x(targetInfo.insertX)
      headerVars.dragDropIndicator.y(0)
      headerVars.dragDropIndicator.width(dragWidth)
      headerVars.dragDropIndicator.height(stageHeight)
      headerVars.dragDropIndicator.visible(true)
    }
  } else {
    // 如果不能放置，隐藏指示器
    if (headerVars.dragDropIndicator) {
      headerVars.dragDropIndicator.visible(false)
    }
  }

  headerVars.headerLayer?.batchDraw()
}

/**
 * 计算拖拽目标位置
 * @param {number} mouseX - 鼠标X坐标
 * @returns {object} 目标信息
 */
const calculateDropTarget = (mouseX: number): { targetIndex: number; insertX: number; canDrop: boolean } => {
  const allColumns = [...columnsInfo.leftColumns, ...columnsInfo.centerColumns, ...columnsInfo.rightColumns]
  let currentX = 0
  let targetIndex = -1
  let insertX = 0
  let canDrop = false

  // 考虑滚动偏移
  const scrollOffset = scrollbarVars.stageScrollX || 0
  const adjustedMouseX = mouseX + scrollOffset

  // 计算每列的累积位置
  for (let i = 0; i < allColumns.length; i++) {
    const column = allColumns[i]
    const columnWidth = column.width || 0
    const columnStart = currentX
    const columnEnd = currentX + columnWidth
    const columnCenter = columnStart + columnWidth / 2

    // 如果鼠标在列的左半部分，插入到列之前
    if (adjustedMouseX >= columnStart && adjustedMouseX < columnCenter) {
      targetIndex = i
      insertX = columnStart - scrollOffset
      canDrop = true
      break
    }
    // 如果鼠标在列的右半部分，插入到列之后
    else if (adjustedMouseX >= columnCenter && adjustedMouseX < columnEnd) {
      targetIndex = i + 1
      insertX = columnEnd - scrollOffset
      canDrop = true
      break
    }

    currentX += columnWidth
  }

  // 如果鼠标在所有列的右侧，插入到最后
  if (!canDrop && adjustedMouseX >= currentX) {
    targetIndex = allColumns.length
    insertX = currentX - scrollOffset
    canDrop = true
  }

  // 确保不会插入到被拖拽列的原位置
  if (canDrop && headerVars.draggingColumnName) {
    const draggingIndex = allColumns.findIndex((col) => col.columnName === headerVars.draggingColumnName)
    if (draggingIndex !== -1 && (targetIndex === draggingIndex || targetIndex === draggingIndex + 1)) {
      canDrop = false
    }
  }

  return { targetIndex, insertX, canDrop }
}

/**
 * 处理列拖拽完成后的重排序
 * @param {number} mouseX - 鼠标X坐标
 */
export const handleColumnReorder = (mouseX: number) => {
  if (!headerVars.isDraggingColumn || !headerVars.draggingColumnName) {
    return false
  }

  // 计算目标位置
  const { targetIndex, canDrop } = calculateDropTarget(mouseX)

  if (!canDrop) {
    return false
  }

  // 获取所有列配置
  const allFields = [...staticParams.xAxisFields, ...staticParams.yAxisFields]
  const draggingIndex = allFields.findIndex((field) => field.columnName === headerVars.draggingColumnName)

  if (draggingIndex === -1) {
    return false
  }

  // 获取被拖拽的列配置
  const draggingField = allFields[draggingIndex]

  // 从原位置移除
  allFields.splice(draggingIndex, 1)

  // 调整目标索引（如果目标位置在被拖拽列之后，需要减1）
  let adjustedTargetIndex = targetIndex
  if (targetIndex > draggingIndex) {
    adjustedTargetIndex = targetIndex - 1
  }

  // 插入到新位置
  allFields.splice(adjustedTargetIndex, 0, draggingField)

  // 更新 staticParams 中的列配置
  // 需要重新分离 xAxisFields 和 yAxisFields
  const newXAxisFields: GroupStore.GroupOption[] = []
  const newYAxisFields: DimensionStore.DimensionOption[] = []

  allFields.forEach((field) => {
    // 根据原始类型判断是 xAxisFields 还是 yAxisFields
    const isXAxisField = staticParams.xAxisFields.some((xField) => xField.columnName === field.columnName)
    if (isXAxisField) {
      newXAxisFields.push(field as GroupStore.GroupOption)
    } else {
      newYAxisFields.push(field as DimensionStore.DimensionOption)
    }
  })

  // 更新配置
  staticParams.xAxisFields = newXAxisFields
  staticParams.yAxisFields = newYAxisFields

  refreshTable(false)
}

/**
 * 清理列拖拽状态
 */
export const cleanupDragState = (): void => {
  if (headerVars.dragDropIndicator) {
    headerVars.dragDropIndicator.destroy()
    headerVars.dragDropIndicator = null
  }

  // 重置状态变量
  headerVars.isDraggingColumn = false
  headerVars.draggingColumnName = null
  headerVars.dragStartX = 0
  headerVars.dragStartWidth = 0
  headerVars.dragTempWidth = 0

  scheduleLayersBatchDraw(['header'])
}

/**
 * 清理列宽调整状态
 */
export const cleanupResizeState = (): void => {
  // 清理调整指示线
  if (headerVars.resizeIndicatorLine) {
    headerVars.resizeIndicatorLine.destroy()
    headerVars.resizeIndicatorLine = null
  }

  // 重置状态
  headerVars.isResizingColumn = false
  headerVars.resizingColumnName = null
  headerVars.resizeTempWidth = 0

  // 重绘图层
  if (headerVars.headerLayer) {
    headerVars.headerLayer.batchDraw()
  }
}
