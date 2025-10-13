import Konva from 'konva'
import { bodyVars, calculateVisibleRows, cellEditorRef, columnsInfo, drawBodyPart } from './body-handler'
import { filterDropdownRef, headerVars } from './header-handler'
import { staticParams, tableData } from './parameter'
import { getStageSize, scheduleLayersBatchDraw, stageVars } from './stage-handler'
import { getSummaryRowHeight, summaryDropdownRef, summaryVars } from './summary-handler'
import { constrainToRange, createGroup, drawUnifiedRect, getTableContainer, setPointerStyle } from './utils'

interface ScrollbarVars {
  /**
   * 滚动条层（滚动条）
   */
  scrollbarLayer: Konva.Layer | null
  /**
   * 垂直滚动条组
   */
  verticalScrollbarGroup: Konva.Group | null
  /**
   * 水平滚动条组
   */
  horizontalScrollbarGroup: Konva.Group | null
  /**
   * 垂直滚动条滑块
   */
  verticalScrollbarThumb: Konva.Rect | null
  /**
   * 水平滚动条滑块
   */
  horizontalScrollbarThumb: Konva.Rect | null
  /**
   * 是否正在垂直拖动滚动条
   */
  isDraggingVerticalThumb: boolean
  /**
   * 是否正在水平拖动滚动条
   */
  isDraggingHorizontalThumb: boolean
  /**
   * 垂直滚动条拖拽起始 Y 坐标
   */
  dragStartY: number
  /**
   * 水平滚动条拖拽起始 X 坐标
   */
  dragStartX: number
  /**
   * 垂直滚动条拖拽起始滚动位置 Y
   */
  stageScrollY: number
  /**
   * 水平滚动条拖拽起始滚动位置 X
   */
  stageScrollX: number
  /**
   * 垂直滚动条拖拽起始滚动位置 Y
   */
  dragStartScrollY: number
  /**
   * 水平滚动条拖拽起始滚动位置 X
   */
  dragStartScrollX: number
}

export const scrollbarVars: ScrollbarVars = {
  /**
   * 滚动条层（滚动条）
   */
  scrollbarLayer: null,

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

  /**
   * 垂直滚动多少像素
   */
  stageScrollY: 0,

  /**
   * 水平滚动多少像素
   */
  stageScrollX: 0
}

/**
 * 创建垂直滚动条组
 * @returns {Konva.Group} 垂直滚动条组
 */
export const createVerticalScrollbarGroup = (): Konva.Group => createGroup('scrollbar', 'vertical')

/**
 * 创建水平滚动条组
 * @returns {Konva.Group} 水平滚动条组
 */
export const createHorizontalScrollbarGroup = (): Konva.Group => createGroup('scrollbar', 'horizontal')

/**
 * 计算滚动范围
 * @returns {Object} 包含最大滚动偏移量的对象
 */
export const calculateScrollRange = () => {
  if (!stageVars.stage) return { maxHorizontalScroll: 0, maxVerticalScroll: 0 }

  const { width: stageWidth, height: stageHeight } = getStageSize()

  // 计算内容高度
  const contentHeight = tableData.value.length * staticParams.bodyRowHeight

  // 初步估算：不预留滚动条空间
  const visibleContentWidthNoV = stageWidth - columnsInfo.leftPartWidth - columnsInfo.rightPartWidth
  const contentHeightNoH = stageHeight - staticParams.headerRowHeight - staticParams.summaryRowHeight
  const prelimMaxX = Math.max(
    0,
    columnsInfo.totalWidth - columnsInfo.leftPartWidth - columnsInfo.rightPartWidth - visibleContentWidthNoV
  )
  const prelimMaxY = Math.max(0, contentHeight - contentHeightNoH)
  const verticalScrollbarSpace = prelimMaxY > 0 ? staticParams.scrollbarSize : 0
  const horizontalScrollbarSpace = prelimMaxX > 0 ? staticParams.scrollbarSize : 0
  // 复算：考虑另一条滚动条占位
  const visibleContentWidth =
    stageWidth - columnsInfo.leftPartWidth - columnsInfo.rightPartWidth - verticalScrollbarSpace
  const maxHorizontalScroll = Math.max(
    0,
    columnsInfo.totalWidth - columnsInfo.leftPartWidth - columnsInfo.rightPartWidth - visibleContentWidth
  )
  const maxVerticalScroll = Math.max(
    0,
    contentHeight -
      (stageHeight - staticParams.headerRowHeight - staticParams.summaryRowHeight - horizontalScrollbarSpace)
  )

  return { maxHorizontalScroll, maxVerticalScroll }
}

/**
 * 更新水平滚动
 * @param {number} offsetX - 滚动偏移量（相对模式）或新的滚动位置（绝对模式）
 * @param {boolean} isAbsolute - 是否为绝对位置模式，默认为 false（相对模式）
 * @returns {void}
 */
export const updateHorizontalScroll = (offsetX: number, isAbsolute: boolean = false) => {
  if (!stageVars.stage || !headerVars.centerHeaderGroup || !bodyVars.centerBodyGroup) return
  const { maxHorizontalScroll } = calculateScrollRange()

  // 根据模式计算新的滚动位置
  const newScrollX = isAbsolute ? offsetX : scrollbarVars.stageScrollX + offsetX
  scrollbarVars.stageScrollX = constrainToRange(newScrollX, 0, maxHorizontalScroll)
  const headerX = columnsInfo.leftPartWidth - scrollbarVars.stageScrollX
  const centerX = -scrollbarVars.stageScrollX

  // 主体相关 - 中间区域随横向滚动
  headerVars.centerHeaderGroup.x(headerX)
  bodyVars.centerBodyGroup?.x(centerX)
  summaryVars.centerSummaryGroup?.x(headerX)
  if (stageVars.stage) {
    const { width: stageWidth } = getStageSize()
    const { maxHorizontalScroll: maxHScroll, maxVerticalScroll } = calculateScrollRange()

    // 更新水平滚动条位置
    if (scrollbarVars.horizontalScrollbarThumb && maxHScroll > 0) {
      const visibleWidth =
        stageWidth -
        columnsInfo.leftPartWidth -
        columnsInfo.rightPartWidth -
        (maxVerticalScroll > 0 ? staticParams.scrollbarSize : 0)
      const thumbWidth = Math.max(20, (visibleWidth * visibleWidth) / columnsInfo.centerPartWidth)
      const thumbX = columnsInfo.leftPartWidth + (scrollbarVars.stageScrollX / maxHScroll) * (visibleWidth - thumbWidth)
      scrollbarVars.horizontalScrollbarThumb.x(thumbX)
    }
  }
  // 水平滚动需要更新表头、主体、固定列和汇总行
  scheduleLayersBatchDraw(['header', 'body', 'fixed', 'scrollbar', 'summary'])
}

/**
 * 滚动选项接口
 */
interface ScrollOptions {
  /** 是否为绝对位置设置（拖拽模式） */
  isAbsolute?: boolean
  /** 是否跳过重渲染阈值检查 */
  skipThresholdCheck?: boolean
  /** 强制重渲染 */
  forceRerender?: boolean
}

/**
 * 更新垂直滚动 - 统一的滚动处理方法
 * @param {number} offsetY - 滚动偏移量（增量模式）或绝对位置（绝对模式）
 * @param {ScrollOptions} options - 滚动选项
 * @returns {void}
 */
export const updateVerticalScroll = (offsetY: number, options: ScrollOptions = {}) => {
  if (!stageVars.stage || !bodyVars.leftBodyGroup || !bodyVars.centerBodyGroup || !bodyVars.rightBodyGroup) return
  const { isAbsolute = false, skipThresholdCheck = false, forceRerender = false } = options
  const { maxVerticalScroll } = calculateScrollRange()

  // 保存旧的滚动位置和可视范围
  const oldScrollY = scrollbarVars.stageScrollY
  const oldVisibleStart = bodyVars.visibleRowStart
  const oldVisibleEnd = bodyVars.visibleRowEnd

  // 根据模式更新滚动位置
  if (isAbsolute) {
    // 拖拽模式：直接设置绝对位置
    scrollbarVars.stageScrollY = constrainToRange(offsetY, 0, maxVerticalScroll)
  } else {
    // 滚轮模式：增量更新
    scrollbarVars.stageScrollY = constrainToRange(scrollbarVars.stageScrollY + offsetY, 0, maxVerticalScroll)
  }

  // 重新计算可视行范围
  calculateVisibleRows()

  // 判断是否需要重渲染
  const visibleRangeChanged = bodyVars.visibleRowStart !== oldVisibleStart || bodyVars.visibleRowEnd !== oldVisibleEnd

  const significantScroll =
    skipThresholdCheck || Math.abs(scrollbarVars.stageScrollY - oldScrollY) > staticParams.bodyRowHeight * 5

  const needsRerender = forceRerender || visibleRangeChanged || significantScroll

  if (needsRerender) {
    // 重新渲染可视区域
    // 主体相关 - 批量执行重绘操作，减少单独的绘制调用
    const renderOperations = [
      () => drawBodyPart(bodyVars.leftBodyGroup, columnsInfo.leftColumns, bodyVars.leftBodyPools),
      () => drawBodyPart(bodyVars.centerBodyGroup, columnsInfo.centerColumns, bodyVars.centerBodyPools),
      () => drawBodyPart(bodyVars.rightBodyGroup, columnsInfo.rightColumns, bodyVars.rightBodyPools)
    ]

    // 执行所有渲染操作
    renderOperations.forEach((operation) => operation())

    // 重新绘制后，确保点击高亮矩形位于最顶层
    if (bodyVars.highlightRect) {
      bodyVars.highlightRect.moveToTop()
    }
  }

  // 修复：统一使用相对于裁剪组的坐标系统
  const fixedColumnsY = -scrollbarVars.stageScrollY // 左右固定列相对于裁剪组
  const centerY = -scrollbarVars.stageScrollY

  // 主体相关 - 固定列和中间列随垂直滚动
  bodyVars.leftBodyGroup?.y(fixedColumnsY)
  bodyVars.rightBodyGroup?.y(fixedColumnsY)
  bodyVars.centerBodyGroup?.y(centerY)

  /* 更新滚动条位置 */
  if (stageVars.stage) {
    const { height: stageHeight } = getStageSize()
    const { maxHorizontalScroll, maxVerticalScroll: maxVScroll } = calculateScrollRange()

    // 更新垂直滚动条位置
    if (scrollbarVars.verticalScrollbarThumb && maxVScroll > 0) {
      const trackHeight =
        stageHeight -
        staticParams.headerRowHeight -
        staticParams.summaryRowHeight -
        (maxHorizontalScroll > 0 ? staticParams.scrollbarSize : 0)
      const thumbHeight = Math.max(
        20,
        (trackHeight * trackHeight) / (tableData.value.length * staticParams.bodyRowHeight)
      )
      const thumbY =
        staticParams.headerRowHeight + (scrollbarVars.stageScrollY / maxVScroll) * (trackHeight - thumbHeight)
      scrollbarVars.verticalScrollbarThumb.y(thumbY)
    }
  }

  scheduleLayersBatchDraw(['body', 'fixed', 'scrollbar', 'summary'])
}

/**
 * 设置垂直滚动条事件
 * @returns {void}
 */
const setupVerticalScrollbarEvents = () => {
  if (!scrollbarVars.verticalScrollbarThumb || !stageVars.stage) return
  /**
   * 设置垂直滚动条拖拽事件
   * @returns {void}
   */

  scrollbarVars.verticalScrollbarThumb.on('mousedown', (event: Konva.KonvaEventObject<MouseEvent>) => {
    scrollbarVars.isDraggingVerticalThumb = true
    scrollbarVars.dragStartY = event.evt.clientY
    scrollbarVars.dragStartScrollY = scrollbarVars.stageScrollY
    setPointerStyle(stageVars.stage, true, 'grabbing')
    stageVars.stage?.setPointersPositions(event.evt)
  })
  // 启用滚动条悬停效果
  if (!!scrollbarVars.verticalScrollbarThumb) {
    scrollbarVars.verticalScrollbarThumb.on('mouseenter', () => {
      scrollbarVars.verticalScrollbarThumb?.fill(staticParams.scrollbarThumbHoverBackground)
      setPointerStyle(stageVars.stage, true, 'grab')
    })
  }

  if (scrollbarVars.verticalScrollbarThumb && !scrollbarVars.isDraggingVerticalThumb) {
    scrollbarVars.verticalScrollbarThumb.on('mouseleave', () => {
      scrollbarVars.verticalScrollbarThumb?.fill(staticParams.scrollbarThumbBackground)
      setPointerStyle(stageVars.stage, false, 'grab')
    })
  }
}

/**
 * 创建垂直滚动条
 * @returns {void}
 */
export const drawVerticalScrollbarPart = () => {
  if (!stageVars.stage || !scrollbarVars.scrollbarLayer) return

  const { width: stageWidth, height: stageHeight } = getStageSize()

  const { maxHorizontalScroll, maxVerticalScroll } = calculateScrollRange()

  // 绘制垂直滚动条顶部遮罩（覆盖表头部分）
  drawUnifiedRect({
    name: 'vertical-scrollbar-top-mask',
    x: stageWidth - staticParams.scrollbarSize,
    y: 0,
    width: staticParams.scrollbarSize,
    height: staticParams.headerRowHeight,
    fill: staticParams.headerBackground,
    stroke: staticParams.borderColor,
    strokeWidth: 1,
    listening: false,
    group: scrollbarVars.scrollbarLayer
  })

  if (getSummaryRowHeight()) {
    // 绘制垂直滚动条底部遮罩（覆盖汇总行部分）
    drawUnifiedRect({
      name: 'vertical-scrollbar-bottom-mask',
      x: stageWidth - staticParams.scrollbarSize,
      y: stageHeight - getSummaryRowHeight() - (maxHorizontalScroll > 0 ? staticParams.scrollbarSize : 0),
      width: staticParams.scrollbarSize,
      height: getSummaryRowHeight(),
      fill: staticParams.summaryBackground,
      stroke: staticParams.borderColor,
      strokeWidth: 1,
      listening: false,
      group: scrollbarVars.scrollbarLayer
    })
  }

  // 绘制垂直滚动条轨道
  drawUnifiedRect({
    name: 'vertical-scrollbar-track',
    x: stageWidth - staticParams.scrollbarSize,
    y: staticParams.headerRowHeight,
    width: staticParams.scrollbarSize,
    height:
      stageHeight -
      staticParams.headerRowHeight -
      getSummaryRowHeight() -
      (maxHorizontalScroll > 0 ? staticParams.scrollbarSize : 0),
    fill: staticParams.scrollbarBackground,
    stroke: staticParams.borderColor,
    strokeWidth: 1,
    listening: false,
    group: scrollbarVars.verticalScrollbarGroup!
  })

  // 计算垂直滚动条高度
  const trackHeight =
    stageHeight -
    staticParams.headerRowHeight -
    getSummaryRowHeight() -
    (maxHorizontalScroll > 0 ? staticParams.scrollbarSize : 0)
  const thumbHeight = Math.max(20, (trackHeight * trackHeight) / (tableData.value.length * staticParams.bodyRowHeight))
  // 计算垂直滚动条 Y 坐标 - 防止除零错误
  const thumbY =
    staticParams.headerRowHeight +
    (maxVerticalScroll > 0 ? (scrollbarVars.stageScrollY / maxVerticalScroll) * (trackHeight - thumbHeight) : 0)

  // 绘制垂直滚动条滑块
  scrollbarVars.verticalScrollbarThumb = drawUnifiedRect({
    name: 'vertical-scrollbar-thumb',
    x: stageWidth - staticParams.scrollbarSize + 2,
    y: thumbY,
    width: staticParams.scrollbarSize - 4,
    height: thumbHeight,
    fill: staticParams.scrollbarThumbBackground,
    cornerRadius: 2,
    listening: true,
    stroke: staticParams.borderColor,
    strokeWidth: 0,
    group: scrollbarVars.verticalScrollbarGroup!
  })

  // 设置垂直滚动条事件
  setupVerticalScrollbarEvents()
}

/**
 * 设置水平滚动条事件
 * @returns {void}
 */
const setupHorizontalScrollbarEvents = () => {
  if (!scrollbarVars.horizontalScrollbarThumb || !stageVars.stage) return
  scrollbarVars.horizontalScrollbarThumb.on('mousedown', (event: Konva.KonvaEventObject<MouseEvent>) => {
    scrollbarVars.isDraggingHorizontalThumb = true
    // 记录开始位置
    scrollbarVars.dragStartX = event.evt.clientX
    scrollbarVars.dragStartScrollX = scrollbarVars.stageScrollX
    setPointerStyle(stageVars.stage, true, 'grabbing')
    stageVars.stage?.setPointersPositions(event.evt)
  })

  // 启用滚动条悬停效果
  scrollbarVars.horizontalScrollbarThumb.on('mouseenter', () => {
    if (!!scrollbarVars.horizontalScrollbarThumb) {
      scrollbarVars.horizontalScrollbarThumb.fill(staticParams.scrollbarThumbHoverBackground)
      setPointerStyle(stageVars.stage, true, 'grab')
    }
  })

  scrollbarVars.horizontalScrollbarThumb.on('mouseleave', () => {
    if (scrollbarVars.horizontalScrollbarThumb && !scrollbarVars.isDraggingHorizontalThumb) {
      scrollbarVars.horizontalScrollbarThumb.fill(staticParams.scrollbarThumbBackground)
      setPointerStyle(stageVars.stage, false, 'grab')
    }
  })
}

/**
 * 创建水平滚动条
 * @returns {void}
 */
export const drawHorizontalScrollbarPart = () => {
  if (!stageVars.stage || !scrollbarVars.scrollbarLayer) return
  const { width: stageWidth, height: stageHeight } = getStageSize()
  const { maxHorizontalScroll, maxVerticalScroll } = calculateScrollRange()

  const verticalScrollbarSpaceForHorizontal = maxVerticalScroll > 0 ? staticParams.scrollbarSize : 0
  // 绘制水平滚动条轨道
  drawUnifiedRect({
    name: 'horizontal-scrollbar-track',
    x: 0,
    y: stageHeight - staticParams.scrollbarSize,
    width: stageWidth - verticalScrollbarSpaceForHorizontal,
    height: staticParams.scrollbarSize,
    fill: staticParams.scrollbarBackground,
    stroke: staticParams.borderColor,
    strokeWidth: 1,
    listening: false,
    group: scrollbarVars.horizontalScrollbarGroup!
  })

  // 计算水平滚动条宽度
  const verticalScrollbarSpaceForThumb = maxVerticalScroll > 0 ? staticParams.scrollbarSize : 0
  // 计算水平滚动条宽度
  const visibleWidth =
    stageWidth - columnsInfo.leftPartWidth - columnsInfo.rightPartWidth - verticalScrollbarSpaceForThumb
  const thumbWidth = Math.max(20, (visibleWidth * visibleWidth) / columnsInfo.centerPartWidth)
  const thumbX =
    columnsInfo.leftPartWidth +
    (maxHorizontalScroll > 0 ? (scrollbarVars.stageScrollX / maxHorizontalScroll) * (visibleWidth - thumbWidth) : 0)

  // 绘制水平滚动条滑块
  scrollbarVars.horizontalScrollbarThumb = drawUnifiedRect({
    name: 'horizontal-scrollbar-thumb',
    x: thumbX,
    y: stageHeight - staticParams.scrollbarSize + 2,
    width: thumbWidth,
    height: staticParams.scrollbarSize - 4,
    fill: staticParams.scrollbarThumbBackground,
    cornerRadius: 2,
    listening: true,
    stroke: staticParams.borderColor,
    strokeWidth: 0,
    group: scrollbarVars.horizontalScrollbarGroup!
  })

  // 设置水平滚动条事件
  setupHorizontalScrollbarEvents()
}

/**
 * 处理滚轮事件
 * @param {WheelEvent} wheelEvent - 滚轮事件
 * @returns {void}
 */
const handleMouseWheel = (wheelEvent: WheelEvent) => {
  wheelEvent.preventDefault()

  if (stageVars.stage) stageVars.stage.setPointersPositions(wheelEvent)
  if (filterDropdownRef.value) filterDropdownRef.value.closeFilterDropdown()
  if (summaryDropdownRef.value) summaryDropdownRef.value.closeSummaryDropdown()
  if (cellEditorRef.value) cellEditorRef.value.closeEditor()
  const hasDeltaX = Math.abs(wheelEvent.deltaX) > 0
  const hasDeltaY = Math.abs(wheelEvent.deltaY) > 0

  // 兼容 Shift + 滚轮用于横向滚动（常见于鼠标）
  if (wheelEvent.shiftKey && !hasDeltaX && hasDeltaY) {
    updateHorizontalScroll(wheelEvent.deltaY)
    return
  }

  // 实现滚动方向锁定：比较 deltaY 和 deltaX 的绝对值，只执行主要方向的滚动
  if (Math.abs(wheelEvent.deltaY) > Math.abs(wheelEvent.deltaX)) {
    // 主要是上下滚动
    if (hasDeltaY) {
      updateVerticalScroll(wheelEvent.deltaY)
    }
  } else {
    // 主要是左右滚动
    if (hasDeltaX) {
      updateHorizontalScroll(wheelEvent.deltaX)
    }
  }
}

/**
 * 初始化滚轮事件监听器
 * @returns {void}
 */
export const initWheelListener = () => {
  const tableContainer = getTableContainer()
  tableContainer?.addEventListener('wheel', handleMouseWheel, { passive: false })
}

/**
 * 清理滚轮事件监听器
 * @returns {void}
 */
export const cleanupWheelListener = () => {
  const tableContainer = getTableContainer()
  tableContainer?.removeEventListener('wheel', handleMouseWheel)
}
