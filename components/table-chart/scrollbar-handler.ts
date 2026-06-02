import Konva from 'konva'
import { bodyVars, calculateVisibleRows, cellEditorRef, columnsInfo, drawBodyPart } from './body-handler'
import { filterDropdownRef, headerVars } from './header-handler'
import {
  bindCurrentTableContext,
  getCurrentTableContext,
  getTableParams,
  getProcessedRows,
  getRuntimeState,
  runWithTableContext
} from './parameter'
import { measureTablePerf, updateTablePerfSnapshot } from './perf'
import { getStageSize, scheduleLayersBatchDraw, stageVars } from './stage-handler'
import { getSummaryRowHeight, summaryDropdownRef, summaryVars } from './summary-handler'
import { constrainToRange, createGroup, drawUnifiedRect, setPointerStyle } from './utils'
import type { ScrollbarState } from './runtime-state'

export const scrollbarVars = new Proxy({} as ScrollbarState, {
  get: (_target, property: keyof ScrollbarState) => getRuntimeState().scrollbar[property],
  set: (_target, property: keyof ScrollbarState, value) => {
    getRuntimeState().scrollbar[property] = value as never
    return true
  }
})

export const resetScrollbarState = () => {
  scrollbarVars.scrollbarLayer = null
  scrollbarVars.verticalScrollbarGroup = null
  scrollbarVars.horizontalScrollbarGroup = null
  scrollbarVars.verticalScrollbarThumb = null
  scrollbarVars.horizontalScrollbarThumb = null
  scrollbarVars.isDraggingVerticalThumb = false
  scrollbarVars.isDraggingHorizontalThumb = false
  scrollbarVars.dragStartY = 0
  scrollbarVars.dragStartX = 0
  scrollbarVars.dragStartScrollY = 0
  scrollbarVars.dragStartScrollX = 0
  scrollbarVars.stageScrollY = 0
  scrollbarVars.stageScrollX = 0
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
  const contentHeight = getProcessedRows().value.length * getTableParams().bodyRowHeight
  const summaryRowHeight = getSummaryRowHeight()

  // 初步估算：不预留滚动条空间
  const visibleContentWidthNoV = stageWidth - columnsInfo.leftPartWidth - columnsInfo.rightPartWidth
  const contentHeightNoH = stageHeight - getTableParams().headerRowHeight - summaryRowHeight
  const prelimMaxX = Math.max(
    0,
    columnsInfo.totalWidth - columnsInfo.leftPartWidth - columnsInfo.rightPartWidth - visibleContentWidthNoV
  )
  const prelimMaxY = Math.max(0, contentHeight - contentHeightNoH)
  const verticalScrollbarSpace = prelimMaxY > 0 ? getTableParams().scrollbarSize : 0
  const horizontalScrollbarSpace = prelimMaxX > 0 ? getTableParams().scrollbarSize : 0
  // 复算：考虑另一条滚动条占位
  const visibleContentWidth =
    stageWidth - columnsInfo.leftPartWidth - columnsInfo.rightPartWidth - verticalScrollbarSpace
  const maxHorizontalScroll = Math.max(
    0,
    columnsInfo.totalWidth - columnsInfo.leftPartWidth - columnsInfo.rightPartWidth - visibleContentWidth
  )
  const maxVerticalScroll = Math.max(
    0,
    contentHeight - (stageHeight - getTableParams().headerRowHeight - summaryRowHeight - horizontalScrollbarSpace)
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
  measureTablePerf('horizontalScroll', () => {
    const centerHeaderGroup = headerVars.centerHeaderGroup
    const centerBodyGroup = bodyVars.centerBodyGroup
    if (!centerHeaderGroup || !centerBodyGroup) return

    const { maxHorizontalScroll } = calculateScrollRange()

    const newScrollX = isAbsolute ? offsetX : scrollbarVars.stageScrollX + offsetX
    scrollbarVars.stageScrollX = constrainToRange(newScrollX, 0, maxHorizontalScroll)
    const headerX = columnsInfo.leftPartWidth - scrollbarVars.stageScrollX
    const centerX = -scrollbarVars.stageScrollX

    centerHeaderGroup.x(headerX)
    centerBodyGroup.x(centerX)
    summaryVars.centerSummaryGroup?.x(headerX)
    if (stageVars.stage) {
      const { width: stageWidth } = getStageSize()
      const { maxHorizontalScroll: maxHScroll, maxVerticalScroll } = calculateScrollRange()

      if (scrollbarVars.horizontalScrollbarThumb && maxHScroll > 0) {
        const visibleWidth =
          stageWidth -
          columnsInfo.leftPartWidth -
          columnsInfo.rightPartWidth -
          (maxVerticalScroll > 0 ? getTableParams().scrollbarSize : 0)
        const thumbWidth = Math.max(20, (visibleWidth * visibleWidth) / columnsInfo.centerPartWidth)
        const thumbX =
          columnsInfo.leftPartWidth + (scrollbarVars.stageScrollX / maxHScroll) * (visibleWidth - thumbWidth)
        scrollbarVars.horizontalScrollbarThumb.x(thumbX)
      }
    }
    scheduleLayersBatchDraw(['header', 'body', 'fixed', 'scrollbar', 'summary'])
    updateTablePerfSnapshot({
      scrollX: scrollbarVars.stageScrollX
    })
  })
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
  measureTablePerf('verticalScroll', () => {
    const { isAbsolute = false, skipThresholdCheck = false, forceRerender = false } = options
    const { maxVerticalScroll } = calculateScrollRange()

    const oldScrollY = scrollbarVars.stageScrollY
    const oldVisibleStart = bodyVars.visibleRowStart
    const oldVisibleEnd = bodyVars.visibleRowEnd

    if (isAbsolute) {
      scrollbarVars.stageScrollY = constrainToRange(offsetY, 0, maxVerticalScroll)
    } else {
      scrollbarVars.stageScrollY = constrainToRange(scrollbarVars.stageScrollY + offsetY, 0, maxVerticalScroll)
    }

    calculateVisibleRows()

    const visibleRangeChanged = bodyVars.visibleRowStart !== oldVisibleStart || bodyVars.visibleRowEnd !== oldVisibleEnd
    const significantScroll =
      skipThresholdCheck || Math.abs(scrollbarVars.stageScrollY - oldScrollY) > getTableParams().bodyRowHeight * 5
    const needsRerender = forceRerender || visibleRangeChanged || significantScroll

    if (needsRerender) {
      const renderOperations = [
        () => drawBodyPart(bodyVars.leftBodyGroup, columnsInfo.leftColumns, bodyVars.leftBodyPools),
        () => drawBodyPart(bodyVars.centerBodyGroup, columnsInfo.centerColumns, bodyVars.centerBodyPools),
        () => drawBodyPart(bodyVars.rightBodyGroup, columnsInfo.rightColumns, bodyVars.rightBodyPools)
      ]

      renderOperations.forEach((operation) => operation())

      if (bodyVars.highlightRect) {
        bodyVars.highlightRect.moveToTop()
      }
    }

    const fixedColumnsY = -scrollbarVars.stageScrollY
    const centerY = -scrollbarVars.stageScrollY

    bodyVars.leftBodyGroup?.y(fixedColumnsY)
    bodyVars.rightBodyGroup?.y(fixedColumnsY)
    bodyVars.centerBodyGroup?.y(centerY)

    if (stageVars.stage) {
      const { height: stageHeight } = getStageSize()
      const { maxHorizontalScroll, maxVerticalScroll: maxVScroll } = calculateScrollRange()

      if (scrollbarVars.verticalScrollbarThumb && maxVScroll > 0) {
        const trackHeight =
          stageHeight -
          getTableParams().headerRowHeight -
          getSummaryRowHeight() -
          (maxHorizontalScroll > 0 ? getTableParams().scrollbarSize : 0)
        const thumbHeight = Math.max(
          20,
          (trackHeight * trackHeight) / (getProcessedRows().value.length * getTableParams().bodyRowHeight)
        )
        const thumbY =
          getTableParams().headerRowHeight + (scrollbarVars.stageScrollY / maxVScroll) * (trackHeight - thumbHeight)
        scrollbarVars.verticalScrollbarThumb.y(thumbY)
      }
    }

    scheduleLayersBatchDraw(['body', 'fixed', 'scrollbar', 'summary'])
    updateTablePerfSnapshot({
      visibleRows: Math.max(0, bodyVars.visibleRowEnd - bodyVars.visibleRowStart + 1),
      scrollY: scrollbarVars.stageScrollY
    })
  })
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

  scrollbarVars.verticalScrollbarThumb.on(
    'mousedown',
    bindCurrentTableContext((event: Konva.KonvaEventObject<MouseEvent>) => {
      scrollbarVars.isDraggingVerticalThumb = true
      scrollbarVars.dragStartY = event.evt.clientY
      scrollbarVars.dragStartScrollY = scrollbarVars.stageScrollY
      setPointerStyle(stageVars.stage, true, 'grabbing')
      stageVars.stage?.setPointersPositions(event.evt)
    })
  )
  // 启用滚动条悬停效果
  if (scrollbarVars.verticalScrollbarThumb) {
    scrollbarVars.verticalScrollbarThumb.on(
      'mouseenter',
      bindCurrentTableContext(() => {
        scrollbarVars.verticalScrollbarThumb?.fill(getTableParams().scrollbarThumbHoverBackground)
        setPointerStyle(stageVars.stage, true, 'grab')
      })
    )
  }

  if (scrollbarVars.verticalScrollbarThumb && !scrollbarVars.isDraggingVerticalThumb) {
    scrollbarVars.verticalScrollbarThumb.on(
      'mouseleave',
      bindCurrentTableContext(() => {
        scrollbarVars.verticalScrollbarThumb?.fill(getTableParams().scrollbarThumbBackground)
        setPointerStyle(stageVars.stage, false, 'grab')
      })
    )
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
    x: stageWidth - getTableParams().scrollbarSize,
    y: 0,
    width: getTableParams().scrollbarSize,
    height: getTableParams().headerRowHeight,
    fill: getTableParams().headerBackground,
    stroke: getTableParams().borderColor,
    strokeWidth: 1,
    listening: false,
    group: scrollbarVars.scrollbarLayer
  })

  if (getSummaryRowHeight()) {
    // 绘制垂直滚动条底部遮罩（覆盖汇总行部分）
    drawUnifiedRect({
      name: 'vertical-scrollbar-bottom-mask',
      x: stageWidth - getTableParams().scrollbarSize,
      y: stageHeight - getSummaryRowHeight() - (maxHorizontalScroll > 0 ? getTableParams().scrollbarSize : 0),
      width: getTableParams().scrollbarSize,
      height: getSummaryRowHeight(),
      fill: getTableParams().summaryBackground,
      stroke: getTableParams().borderColor,
      strokeWidth: 1,
      listening: false,
      group: scrollbarVars.scrollbarLayer
    })
  }

  // 绘制垂直滚动条轨道
  drawUnifiedRect({
    name: 'vertical-scrollbar-track',
    x: stageWidth - getTableParams().scrollbarSize,
    y: getTableParams().headerRowHeight,
    width: getTableParams().scrollbarSize,
    height:
      stageHeight -
      getTableParams().headerRowHeight -
      getSummaryRowHeight() -
      (maxHorizontalScroll > 0 ? getTableParams().scrollbarSize : 0),
    fill: getTableParams().scrollbarBackground,
    stroke: getTableParams().borderColor,
    strokeWidth: 1,
    listening: false,
    group: scrollbarVars.verticalScrollbarGroup!
  })

  // 计算垂直滚动条高度
  const trackHeight =
    stageHeight -
    getTableParams().headerRowHeight -
    getSummaryRowHeight() -
    (maxHorizontalScroll > 0 ? getTableParams().scrollbarSize : 0)
  const thumbHeight = Math.max(
    20,
    (trackHeight * trackHeight) / (getProcessedRows().value.length * getTableParams().bodyRowHeight)
  )
  // 计算垂直滚动条 Y 坐标 - 防止除零错误
  const thumbY =
    getTableParams().headerRowHeight +
    (maxVerticalScroll > 0 ? (scrollbarVars.stageScrollY / maxVerticalScroll) * (trackHeight - thumbHeight) : 0)

  // 绘制垂直滚动条滑块
  scrollbarVars.verticalScrollbarThumb = drawUnifiedRect({
    name: 'vertical-scrollbar-thumb',
    x: stageWidth - getTableParams().scrollbarSize + 2,
    y: thumbY,
    width: getTableParams().scrollbarSize - 4,
    height: thumbHeight,
    fill: getTableParams().scrollbarThumbBackground,
    cornerRadius: 2,
    listening: true,
    stroke: getTableParams().borderColor,
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
  scrollbarVars.horizontalScrollbarThumb.on(
    'mousedown',
    bindCurrentTableContext((event: Konva.KonvaEventObject<MouseEvent>) => {
      scrollbarVars.isDraggingHorizontalThumb = true
      // 记录开始位置
      scrollbarVars.dragStartX = event.evt.clientX
      scrollbarVars.dragStartScrollX = scrollbarVars.stageScrollX
      setPointerStyle(stageVars.stage, true, 'grabbing')
      stageVars.stage?.setPointersPositions(event.evt)
    })
  )

  // 启用滚动条悬停效果
  scrollbarVars.horizontalScrollbarThumb.on(
    'mouseenter',
    bindCurrentTableContext(() => {
      if (scrollbarVars.horizontalScrollbarThumb) {
        scrollbarVars.horizontalScrollbarThumb.fill(getTableParams().scrollbarThumbHoverBackground)
        setPointerStyle(stageVars.stage, true, 'grab')
      }
    })
  )

  scrollbarVars.horizontalScrollbarThumb.on(
    'mouseleave',
    bindCurrentTableContext(() => {
      if (scrollbarVars.horizontalScrollbarThumb && !scrollbarVars.isDraggingHorizontalThumb) {
        scrollbarVars.horizontalScrollbarThumb.fill(getTableParams().scrollbarThumbBackground)
        setPointerStyle(stageVars.stage, false, 'grab')
      }
    })
  )
}

/**
 * 创建水平滚动条
 * @returns {void}
 */
export const drawHorizontalScrollbarPart = () => {
  if (!stageVars.stage || !scrollbarVars.scrollbarLayer) return
  const { width: stageWidth, height: stageHeight } = getStageSize()
  const { maxHorizontalScroll, maxVerticalScroll } = calculateScrollRange()

  const verticalScrollbarSpaceForHorizontal = maxVerticalScroll > 0 ? getTableParams().scrollbarSize : 0
  // 绘制水平滚动条轨道
  drawUnifiedRect({
    name: 'horizontal-scrollbar-track',
    x: 0,
    y: stageHeight - getTableParams().scrollbarSize,
    width: stageWidth - verticalScrollbarSpaceForHorizontal,
    height: getTableParams().scrollbarSize,
    fill: getTableParams().scrollbarBackground,
    stroke: getTableParams().borderColor,
    strokeWidth: 1,
    listening: false,
    group: scrollbarVars.horizontalScrollbarGroup!
  })

  // 计算水平滚动条宽度
  const verticalScrollbarSpaceForThumb = maxVerticalScroll > 0 ? getTableParams().scrollbarSize : 0
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
    y: stageHeight - getTableParams().scrollbarSize + 2,
    width: thumbWidth,
    height: getTableParams().scrollbarSize - 4,
    fill: getTableParams().scrollbarThumbBackground,
    cornerRadius: 2,
    listening: true,
    stroke: getTableParams().borderColor,
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
export const initWheelListener = (tableContainer: HTMLDivElement | null) => {
  if (!tableContainer) return

  const context = getCurrentTableContext()
  const listeners = getRuntimeState().listeners
  listeners.wheel = (event) => runWithTableContext(context, () => handleMouseWheel(event))
  tableContainer.addEventListener('wheel', listeners.wheel, { passive: false })
}

/**
 * 清理滚轮事件监听器
 * @returns {void}
 */
export const cleanupWheelListener = (tableContainer: HTMLDivElement | null) => {
  const listeners = getRuntimeState().listeners
  if (!tableContainer || !listeners.wheel) return

  tableContainer.removeEventListener('wheel', listeners.wheel)
  listeners.wheel = null
}
