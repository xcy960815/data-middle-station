import Konva from 'konva'
import { editorDropdownHandler } from '../dropdown/editor-dropdown-handler'
import { filterDropdownHandler } from '../dropdown/filter-dropdown-handler'
import { summaryDropDownHandler } from '../dropdown/summary-dropdown-handler'
import { konvaStageHandler } from '../konva-stage-handler'
import { chartProps } from '../props'
import { highlightHandler } from '../render/heightlight-handler'
import { constrainToRange, getTableContainerElement } from '../utils'
import type { Prettify } from '../variable-handlder'
import { tableVars, variableHandlder } from '../variable-handlder'
import { renderBodyHandler } from './render-body-handler'

import type { CanvasTableEmits } from '../emits'

interface RenderScrollbarsHandlerProps {
  props: Prettify<Readonly<ExtractPropTypes<typeof chartProps>>>
  emits: <T extends keyof CanvasTableEmits>(event: T, ...args: CanvasTableEmits[T]) => void
}

export const renderScrollbarsHandler = ({ props, emits }: RenderScrollbarsHandlerProps) => {
  const { getStageAttr } = konvaStageHandler({ props })
  const { getScrollLimits, getSplitColumns, recomputeHoverIndexFromPointer, drawBodyPart, calculateVisibleRows } =
    renderBodyHandler({ props, emits })
  const { tableData } = variableHandlder({ props })
  const { getSummaryRowHeight, updateSummaryDropdownPositionsInTable } = summaryDropDownHandler({ props })
  const { updateCellEditorPositionsInTable } = editorDropdownHandler({ props })
  const { updateFilterDropdownPositionsInTable } = filterDropdownHandler({ props, emits })
  const { updateHoverRects } = highlightHandler({ props })

  /**
   * 创建滚动条
   */
  const createScrollbars = () => {
    if (!tableVars.stage || !tableVars.scrollbarLayer) return
    const { width: stageWidth, height: stageHeight } = getStageAttr()
    const { maxScrollX, maxScrollY } = getScrollLimits()

    if (maxScrollY > 0) {
      // 绘制垂直滚动条顶部遮罩
      const verticalScrollbarHeaderMask = new Konva.Rect({
        x: stageWidth - props.scrollbarSize,
        y: 0,
        width: props.scrollbarSize,
        height: props.headerHeight,
        fill: props.headerBackground
      })
      tableVars.scrollbarLayer.add(verticalScrollbarHeaderMask)
      // 绘制垂直滚动条底部遮罩
      const verticalScrollbarFooterMask = new Konva.Rect({
        x: stageWidth - props.scrollbarSize,
        y: stageHeight - getSummaryRowHeight() - (maxScrollX > 0 ? props.scrollbarSize : 0),
        width: props.scrollbarSize,
        height: getSummaryRowHeight(),
        fill: props.summaryBackground,
        stroke: props.borderColor,
        strokeWidth: 1
      })

      if (getSummaryRowHeight() > 0) tableVars.scrollbarLayer.add(verticalScrollbarFooterMask)

      // 创建垂直滚动条组
      tableVars.verticalScrollbarGroup = new Konva.Group()
      tableVars.scrollbarLayer.add(tableVars.verticalScrollbarGroup)
      // 绘制垂直滚动条轨道
      const verticalScrollbarTrack = new Konva.Rect({
        x: stageWidth - props.scrollbarSize,
        y: props.headerHeight,
        width: props.scrollbarSize,
        height: stageHeight - props.headerHeight - getSummaryRowHeight() - (maxScrollX > 0 ? props.scrollbarSize : 0),
        fill: props.scrollbarBackground,
        stroke: props.borderColor,
        strokeWidth: 1
      })
      tableVars.verticalScrollbarGroup.add(verticalScrollbarTrack)

      // 计算垂直滚动条高度
      const trackHeight =
        stageHeight - props.headerHeight - getSummaryRowHeight() - (maxScrollX > 0 ? props.scrollbarSize : 0)
      const thumbHeight = Math.max(20, (trackHeight * trackHeight) / (tableData.value.length * props.bodyRowHeight))
      // 计算垂直滚动条 Y 坐标
      const thumbY = props.headerHeight + (tableVars.stageScrollY / maxScrollY) * (trackHeight - thumbHeight)

      // 绘制垂直滚动条滑块
      tableVars.verticalScrollbarThumb = new Konva.Rect({
        x: stageWidth - props.scrollbarSize + 2,
        y: thumbY,
        width: props.scrollbarSize - 4,
        height: thumbHeight,
        fill: props.scrollbarThumb,
        cornerRadius: 2,
        draggable: false
      })
      tableVars.verticalScrollbarGroup.add(tableVars.verticalScrollbarThumb)

      // 设置垂直滚动条事件
      setupVerticalScrollbarEvents()
    }

    // 水平滚动条
    if (maxScrollX > 0) {
      // 创建水平滚动条组
      tableVars.horizontalScrollbarGroup = new Konva.Group()
      tableVars.scrollbarLayer.add(tableVars.horizontalScrollbarGroup)

      const verticalScrollbarSpaceForHorizontal = maxScrollY > 0 ? props.scrollbarSize : 0
      // 绘制水平滚动条轨道
      const horizontalScrollbarTrack = new Konva.Rect({
        x: 0,
        y: stageHeight - props.scrollbarSize,
        width: stageWidth - verticalScrollbarSpaceForHorizontal,
        height: props.scrollbarSize,
        fill: props.scrollbarBackground,
        stroke: props.borderColor,
        strokeWidth: 1
      })
      tableVars.horizontalScrollbarGroup.add(horizontalScrollbarTrack)

      // 计算水平滚动条宽度
      const { leftWidth, rightWidth, centerWidth } = getSplitColumns()
      const verticalScrollbarSpaceForThumb = maxScrollY > 0 ? props.scrollbarSize : 0
      // 计算水平滚动条宽度
      const visibleWidth = stageWidth - leftWidth - rightWidth - verticalScrollbarSpaceForThumb
      const thumbWidth = Math.max(20, (visibleWidth * visibleWidth) / centerWidth)
      const thumbX = leftWidth + (tableVars.stageScrollX / maxScrollX) * (visibleWidth - thumbWidth)

      // 绘制水平滚动条滑块
      tableVars.horizontalScrollbarThumb = new Konva.Rect({
        x: thumbX,
        y: stageHeight - props.scrollbarSize + 2,
        width: thumbWidth,
        height: props.scrollbarSize - 4,
        fill: props.scrollbarThumb,
        cornerRadius: 2,
        draggable: false
      })
      tableVars.horizontalScrollbarGroup.add(tableVars.horizontalScrollbarThumb)
      // 设置水平滚动条事件
      setupHorizontalScrollbarEvents()
    }
  }

  /**
   * 设置垂直滚动条事件
   * @returns {void}
   */
  const setupVerticalScrollbarEvents = () => {
    if (!tableVars.verticalScrollbarThumb || !tableVars.stage) return
    /**
     * 设置垂直滚动条拖拽事件
     */
    tableVars.verticalScrollbarThumb.on('mousedown', (event) => {
      tableVars.isDraggingVerticalThumb = true
      tableVars.dragStartY = event.evt.clientY
      tableVars.dragStartScrollY = tableVars.stageScrollY
      tableVars.stage!.container().style.cursor = 'grabbing'
      tableVars.stage!.setPointersPositions(event.evt)
    })
    /**
     * 设置垂直滚动条鼠标进入事件
     */
    tableVars.verticalScrollbarThumb.on('mouseenter', () => {
      if (tableVars.verticalScrollbarThumb) tableVars.verticalScrollbarThumb.fill(props.scrollbarThumbHover)
      tableVars.scrollbarLayer?.batchDraw()
    })

    /**
     * 设置垂直滚动条鼠标离开事件
     */
    tableVars.verticalScrollbarThumb.on('mouseleave', () => {
      if (tableVars.verticalScrollbarThumb && !tableVars.isDraggingVerticalThumb)
        tableVars.verticalScrollbarThumb.fill(props.scrollbarThumb)
      tableVars.scrollbarLayer?.batchDraw()
    })
  }
  /**
   * 设置水平滚动条事件
   * @returns {void}
   */
  const setupHorizontalScrollbarEvents = () => {
    if (!tableVars.horizontalScrollbarThumb || !tableVars.stage) return
    tableVars.horizontalScrollbarThumb.on('mousedown', (event) => {
      tableVars.isDraggingHorizontalThumb = true
      tableVars.dragStartX = event.evt.clientX
      tableVars.dragStartScrollX = tableVars.stageScrollX
      tableVars.stage!.container().style.cursor = 'grabbing'

      // 设置指针位置到 stage，避免 Konva 警告
      tableVars.stage!.setPointersPositions(event.evt)
    })

    tableVars.horizontalScrollbarThumb.on('mouseenter', () => {
      if (tableVars.horizontalScrollbarThumb) tableVars.horizontalScrollbarThumb.fill(props.scrollbarThumbHover)
      tableVars.scrollbarLayer?.batchDraw()
    })

    tableVars.horizontalScrollbarThumb.on('mouseleave', () => {
      if (tableVars.horizontalScrollbarThumb && !tableVars.isDraggingHorizontalThumb)
        tableVars.horizontalScrollbarThumb.fill(props.scrollbarThumb)
      tableVars.scrollbarLayer?.batchDraw()
    })
  }

  /**
   * 更新滚动位置
   * @returns {void}
   */
  const updateScrollPositions = () => {
    if (
      !tableVars.leftBodyGroup ||
      !tableVars.centerBodyGroup ||
      !tableVars.rightBodyGroup ||
      !tableVars.centerHeaderGroup
    )
      return

    const { leftWidth } = getSplitColumns()
    const bodyY = props.headerHeight - tableVars.stageScrollY
    const centerX = -tableVars.stageScrollX
    const headerX = leftWidth - tableVars.stageScrollX
    const summaryY = tableVars.stage
      ? tableVars.stage.height() - getSummaryRowHeight() - (getScrollLimits().maxScrollX > 0 ? props.scrollbarSize : 0)
      : 0

    /**
     * 更新左侧和右侧主体（只有 Y 位置变化）
     */
    tableVars.leftBodyGroup.y(bodyY)
    tableVars.rightBodyGroup.y(bodyY)

    /**
     * 更新中间主体（X 和 Y 位置变化）
     */
    tableVars.centerBodyGroup.x(centerX)
    tableVars.centerBodyGroup.y(-tableVars.stageScrollY)

    /**
     * 更新中心表头（只有 X 位置变化）
     */
    tableVars.centerHeaderGroup.x(headerX)

    /**
     * 更新底部 summary 组位置
     */
    if (tableVars.leftSummaryGroup) tableVars.leftSummaryGroup.y(summaryY)
    if (tableVars.rightSummaryGroup) tableVars.rightSummaryGroup.y(summaryY)
    if (tableVars.centerSummaryGroup) tableVars.centerSummaryGroup.y(summaryY)

    updateScrollbarPosition()
    tableVars.headerLayer?.batchDraw()
    tableVars.bodyLayer?.batchDraw()
    tableVars.fixedBodyLayer?.batchDraw()
    tableVars.fixedHeaderLayer?.batchDraw()
    tableVars.summaryLayer?.batchDraw()
    tableVars.fixedSummaryLayer?.batchDraw()

    // 滚动时更新弹框位置
    // updateFilterDropdownPositionsInTable()
    // updateSummaryDropdownPositionsInTable()
  }

  /**
   * 更新横纵滚动条位置
   */
  const updateScrollbarPosition = () => {
    if (!tableVars.stage) return

    const { width: stageWidth, height: stageHeight } = getStageAttr()
    const { maxScrollX, maxScrollY } = getScrollLimits()

    // 更新垂直滚动条位置
    if (tableVars.verticalScrollbarThumb && maxScrollY > 0) {
      const trackHeight =
        stageHeight - props.headerHeight - getSummaryRowHeight() - (maxScrollX > 0 ? props.scrollbarSize : 0)
      const thumbHeight = Math.max(20, (trackHeight * trackHeight) / (tableData.value.length * props.bodyRowHeight))
      const thumbY = props.headerHeight + (tableVars.stageScrollY / maxScrollY) * (trackHeight - thumbHeight)
      tableVars.verticalScrollbarThumb.y(thumbY)
    }

    // 更新水平滚动条位置
    if (tableVars.horizontalScrollbarThumb && maxScrollX > 0) {
      const { leftWidth, rightWidth, centerWidth } = getSplitColumns()
      const visibleWidth = stageWidth - leftWidth - rightWidth - (maxScrollY > 0 ? props.scrollbarSize : 0)
      const thumbWidth = Math.max(20, (visibleWidth * visibleWidth) / centerWidth)
      const thumbX = leftWidth + (tableVars.stageScrollX / maxScrollX) * (visibleWidth - thumbWidth)
      tableVars.horizontalScrollbarThumb.x(thumbX)
    }

    tableVars.scrollbarLayer?.batchDraw()
  }

  /**
   * 更新水平滚动
   * @param offsetX 滚动偏移量
   */
  const updateHorizontalScroll = (offsetX: number) => {
    if (!tableVars.stage || !tableVars.centerHeaderGroup || !tableVars.centerBodyGroup) return
    const { maxScrollX } = getScrollLimits()
    const { leftWidth } = getSplitColumns()
    tableVars.stageScrollX = constrainToRange(tableVars.stageScrollX + offsetX, 0, maxScrollX)

    const headerX = leftWidth - tableVars.stageScrollX
    const centerX = -tableVars.stageScrollX

    // 中间区域随横向滚动
    tableVars.centerHeaderGroup.x(headerX)
    tableVars.centerBodyGroup.x(centerX)
    tableVars.centerSummaryGroup?.x(headerX)

    updateScrollbarPosition()

    tableVars.headerLayer?.batchDraw()
    tableVars.bodyLayer?.batchDraw()
    tableVars.summaryLayer?.batchDraw()
    recomputeHoverIndexFromPointer()
    updateHoverRects()
    updateCellEditorPositionsInTable()
    // 横向滚动时更新弹框位置
    updateFilterDropdownPositionsInTable()
    updateSummaryDropdownPositionsInTable()
  }

  /**
   * 更新垂直滚动
   * @param offsetY 滚动偏移量
   */
  const updateVerticalScroll = (offsetY: number) => {
    if (!tableVars.stage || !tableVars.leftBodyGroup || !tableVars.centerBodyGroup || !tableVars.rightBodyGroup) return
    const { maxScrollY } = getScrollLimits()
    const oldScrollY = tableVars.stageScrollY
    tableVars.stageScrollY = constrainToRange(tableVars.stageScrollY + offsetY, 0, maxScrollY)

    // 检查是否需要重新渲染（滚动超过一定阈值或可视区域改变）
    const oldVisibleStart = tableVars.visibleRowStart
    const oldVisibleEnd = tableVars.visibleRowEnd
    calculateVisibleRows()

    const needsRerender =
      tableVars.visibleRowStart !== oldVisibleStart ||
      tableVars.visibleRowEnd !== oldVisibleEnd ||
      Math.abs(tableVars.stageScrollY - oldScrollY) > props.bodyRowHeight * 2 // 滚动超过2行时强制重新渲染

    if (needsRerender) {
      // 重新渲染可视区域
      const { leftCols, centerCols, rightCols, leftWidth, centerWidth } = getSplitColumns()
      tableVars.bodyPositionMapList.length = 0
      drawBodyPart(tableVars.leftBodyGroup, leftCols, tableVars.leftBodyPools, 0, tableVars.bodyPositionMapList, 0)
      drawBodyPart(
        tableVars.centerBodyGroup,
        centerCols,
        tableVars.centerBodyPools,
        leftCols.length,
        tableVars.bodyPositionMapList,
        leftWidth
      )
      drawBodyPart(
        tableVars.rightBodyGroup,
        rightCols,
        tableVars.rightBodyPools,
        leftCols.length + centerCols.length,
        tableVars.bodyPositionMapList,
        leftWidth + centerWidth
      )

      // 重新绘制后，确保点击高亮矩形位于最顶层
      if (tableVars.highlightRect) {
        tableVars.highlightRect.moveToTop()
        tableVars.bodyLayer?.batchDraw()
      }
    }

    const bodyY = props.headerHeight - tableVars.stageScrollY
    const centerY = -tableVars.stageScrollY

    // 固定列和中间列随垂直滚动
    tableVars.leftBodyGroup.y(bodyY)
    tableVars.rightBodyGroup.y(bodyY)
    tableVars.centerBodyGroup.y(centerY)
    updateScrollbarPosition()
    recomputeHoverIndexFromPointer()
    updateCellEditorPositionsInTable()
    tableVars.bodyLayer?.batchDraw()
    tableVars.fixedBodyLayer?.batchDraw()
    tableVars.summaryLayer?.batchDraw()
    tableVars.fixedSummaryLayer?.batchDraw()
  }

  /**
   * 处理滚轮事件
   * @param {WheelEvent} e 滚轮事件
   */
  const handleMouseWheel = (e: WheelEvent) => {
    e.preventDefault()

    if (tableVars.stage) tableVars.stage.setPointersPositions(e)
    // 同步最后一次客户端坐标，用于遮罩与区域判断
    tableVars.lastClientX = e.clientX
    tableVars.lastClientY = e.clientY

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

  onMounted(() => {
    const tableContainer = getTableContainerElement()
    tableContainer?.addEventListener('wheel', handleMouseWheel, { passive: false })
  })

  onBeforeUnmount(() => {
    const tableContainer = getTableContainerElement()
    tableContainer?.removeEventListener('wheel', handleMouseWheel)
  })

  return {
    createScrollbars,
    updateScrollbarPosition,
    updateScrollPositions
  }
}
