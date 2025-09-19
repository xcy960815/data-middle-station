import Konva from 'konva'
import { editorDropdownHandler } from '../dropdown/editor-dropdown-handler'
import { summaryDropDownHandler } from '../dropdown/summary-dropdown-handler'
import { getFilterDropdownMethods } from '../global-components'
import { konvaStageHandler } from '../konva-stage-handler'
import { chartProps } from '../props'
import { constrainToRange, getTableContainerElement } from '../utils'
import type { Prettify } from '../variable-handlder'
import { variableHandlder } from '../variable-handlder'
import { drawUnifiedRect } from './draw'
import { renderBodyHandler } from './render-body-handler'

interface RenderScrollbarsHandlerProps {
  props: Prettify<Readonly<ExtractPropTypes<typeof chartProps>>>
}

export const renderScrollbarsHandler = ({ props }: RenderScrollbarsHandlerProps) => {
  const { getStageAttr, setPointerStyle } = konvaStageHandler({ props })
  const { getScrollLimits, getSplitColumns, drawBodyPart, calculateVisibleRows } = renderBodyHandler({ props })
  const { tableData, tableVars } = variableHandlder({ props })
  const { summaryRowHeight, updateSummaryDropdownPositionsInTable } = summaryDropDownHandler({ props })
  const { updateCellEditorPositionsInTable } = editorDropdownHandler({ props })
  const { updateFilterDropdownPositionsInTable } = getFilterDropdownMethods()

  /**
   * 创建垂直滚动条
   */
  const drawVerticalScrollbar = () => {
    if (!tableVars.stage || !tableVars.scrollbarLayer) return
    const { width: stageWidth, height: stageHeight } = getStageAttr()
    const { maxScrollX, maxScrollY } = getScrollLimits()

    // 绘制垂直滚动条顶部遮罩（覆盖表头部分）
    const verticalScrollbarTopMask = drawUnifiedRect({
      pools: tableVars.leftBodyPools,
      name: 'vertical-scrollbar-top-mask',
      x: stageWidth - props.scrollbarSize,
      y: 0,
      width: props.scrollbarSize,
      height: props.headerRowHeight,
      fill: props.headerBackground,
      stroke: props.borderColor,
      strokeWidth: 1
    })
    tableVars.scrollbarLayer.add(verticalScrollbarTopMask)

    if (summaryRowHeight.value > 0) {
      // 绘制垂直滚动条底部遮罩（覆盖汇总行部分）
      const verticalScrollbarBottomMask = drawUnifiedRect({
        pools: tableVars.leftBodyPools,
        name: 'vertical-scrollbar-bottom-mask',
        x: stageWidth - props.scrollbarSize,
        y: stageHeight - summaryRowHeight.value - (maxScrollX > 0 ? props.scrollbarSize : 0),
        width: props.scrollbarSize,
        height: summaryRowHeight.value,
        fill: props.summaryBackground,
        stroke: props.borderColor,
        strokeWidth: 1
      })
      tableVars.scrollbarLayer.add(verticalScrollbarBottomMask)
    }

    // 绘制垂直滚动条轨道
    const verticalScrollbarRect = drawUnifiedRect({
      pools: tableVars.leftBodyPools,
      name: 'vertical-scrollbar-track',
      x: stageWidth - props.scrollbarSize,
      y: props.headerRowHeight,
      width: props.scrollbarSize,
      height: stageHeight - props.headerRowHeight - summaryRowHeight.value - (maxScrollX > 0 ? props.scrollbarSize : 0),
      fill: props.scrollbarBackground,
      stroke: props.borderColor,
      strokeWidth: 1
    })
    tableVars.verticalScrollbarGroup?.add(verticalScrollbarRect)

    // 计算垂直滚动条高度
    const trackHeight =
      stageHeight - props.headerRowHeight - summaryRowHeight.value - (maxScrollX > 0 ? props.scrollbarSize : 0)
    const thumbHeight = Math.max(20, (trackHeight * trackHeight) / (tableData.value.length * props.bodyRowHeight))
    // 计算垂直滚动条 Y 坐标
    const thumbY = props.headerRowHeight + (tableVars.stageScrollY / maxScrollY) * (trackHeight - thumbHeight)

    // 绘制垂直滚动条滑块
    tableVars.verticalScrollbarThumbRect = drawUnifiedRect({
      pools: tableVars.leftBodyPools,
      name: 'vertical-scrollbar-thumb',
      x: stageWidth - props.scrollbarSize + 2,
      y: thumbY,
      width: props.scrollbarSize - 4,
      height: thumbHeight,
      fill: props.scrollbarThumbBackground,
      cornerRadius: 2,
      listening: true
    })
    tableVars.verticalScrollbarGroup?.add(tableVars.verticalScrollbarThumbRect)

    // 设置垂直滚动条事件
    setupVerticalScrollbarEvents()
  }

  /**
   * 创建水平滚动条
   */
  const drawHorizontalScrollbar = () => {
    if (!tableVars.stage || !tableVars.scrollbarLayer) return
    const { width: stageWidth, height: stageHeight } = getStageAttr()
    const { maxScrollX, maxScrollY } = getScrollLimits()

    const verticalScrollbarSpaceForHorizontal = maxScrollY > 0 ? props.scrollbarSize : 0
    // 绘制水平滚动条轨道
    const horizontalScrollbarTrack = drawUnifiedRect({
      pools: tableVars.leftBodyPools,
      name: 'horizontal-scrollbar-track',
      x: 0,
      y: stageHeight - props.scrollbarSize,
      width: stageWidth - verticalScrollbarSpaceForHorizontal,
      height: props.scrollbarSize,
      fill: props.scrollbarBackground,
      stroke: props.borderColor,
      strokeWidth: 1
    })

    tableVars.horizontalScrollbarGroup?.add(horizontalScrollbarTrack)

    // 计算水平滚动条宽度
    const { leftWidth, rightWidth, centerWidth } = getSplitColumns()
    const verticalScrollbarSpaceForThumb = maxScrollY > 0 ? props.scrollbarSize : 0
    // 计算水平滚动条宽度
    const visibleWidth = stageWidth - leftWidth - rightWidth - verticalScrollbarSpaceForThumb
    const thumbWidth = Math.max(20, (visibleWidth * visibleWidth) / centerWidth)
    const thumbX = leftWidth + (tableVars.stageScrollX / maxScrollX) * (visibleWidth - thumbWidth)

    // 绘制水平滚动条滑块
    tableVars.horizontalScrollbarThumbRect = drawUnifiedRect({
      pools: tableVars.leftBodyPools,
      name: 'horizontal-scrollbar-thumb',
      x: thumbX,
      y: stageHeight - props.scrollbarSize + 2,
      width: thumbWidth,
      height: props.scrollbarSize - 4,
      fill: props.scrollbarThumbBackground,
      cornerRadius: 2,
      listening: true
    })
    tableVars.horizontalScrollbarGroup?.add(tableVars.horizontalScrollbarThumbRect)

    // 设置水平滚动条事件
    setupHorizontalScrollbarEvents()
  }

  /**
   * 设置垂直滚动条事件
   * @returns {void}
   */
  const setupVerticalScrollbarEvents = () => {
    if (!tableVars.verticalScrollbarThumbRect || !tableVars.stage) return
    /**
     * 设置垂直滚动条拖拽事件
     */

    tableVars.verticalScrollbarThumbRect.on('mousedown', (event: Konva.KonvaEventObject<MouseEvent>) => {
      tableVars.isDraggingVerticalThumb = true
      tableVars.dragStartY = event.evt.clientY
      tableVars.dragStartScrollY = tableVars.stageScrollY
      tableVars.stage!.container().style.cursor = 'grabbing'
      tableVars.stage!.setPointersPositions(event.evt)
    })
    // 启用滚动条悬停效果
    tableVars.verticalScrollbarThumbRect.on('mouseenter', () => {
      if (tableVars.verticalScrollbarThumbRect) {
        tableVars.verticalScrollbarThumbRect.fill(props.scrollbarThumbHoverBackground)
        setPointerStyle(true, 'grab')
      }
      // tableVars.scrollbarLayer?.batchDraw()
    })

    tableVars.verticalScrollbarThumbRect.on('mouseleave', () => {
      if (tableVars.verticalScrollbarThumbRect && !tableVars.isDraggingVerticalThumb) {
        tableVars.verticalScrollbarThumbRect.fill(props.scrollbarThumbBackground)
        setPointerStyle(false, 'grab')
      }
      tableVars.scrollbarLayer?.batchDraw()
    })
  }
  /**
   * 设置水平滚动条事件
   * @returns {void}
   */
  const setupHorizontalScrollbarEvents = () => {
    if (!tableVars.horizontalScrollbarThumbRect || !tableVars.stage) return
    tableVars.horizontalScrollbarThumbRect.on('mousedown', (event: Konva.KonvaEventObject<MouseEvent>) => {
      tableVars.isDraggingHorizontalThumb = true
      tableVars.dragStartX = event.evt.clientX
      tableVars.dragStartScrollX = tableVars.stageScrollX
      tableVars.stage!.container().style.cursor = 'grabbing'
      tableVars.stage!.setPointersPositions(event.evt)
    })

    // 启用滚动条悬停效果
    tableVars.horizontalScrollbarThumbRect.on('mouseenter', () => {
      if (tableVars.horizontalScrollbarThumbRect) {
        tableVars.horizontalScrollbarThumbRect.fill(props.scrollbarThumbHoverBackground)
        setPointerStyle(true, 'grab')
      }
      tableVars.scrollbarLayer?.batchDraw()
    })

    tableVars.horizontalScrollbarThumbRect.on('mouseleave', () => {
      if (tableVars.horizontalScrollbarThumbRect && !tableVars.isDraggingHorizontalThumb) {
        tableVars.horizontalScrollbarThumbRect.fill(props.scrollbarThumbBackground)
        setPointerStyle(false, 'grab')
      }
      tableVars.scrollbarLayer?.batchDraw()
    })
  }

  /**
   * 修复的Layer批量绘制 - 5个真实的Layer，确保表头和汇总固定
   */
  const scheduleLayersBatchDraw = (layers: Array<'header' | 'body' | 'fixed' | 'scrollbar' | 'summary'> = ['body']) => {
    // 简化版本：直接执行绘制，不使用批量优化
    layers.forEach((layerType) => {
      switch (layerType) {
        case 'header':
          tableVars.headerLayer?.batchDraw() // 表头层（固定不滚动）
          break
        case 'body':
          tableVars.bodyLayer?.batchDraw() // 主体内容层（可滚动）
          break
        case 'fixed':
          tableVars.fixedBodyLayer?.batchDraw() // 固定列层（左右固定）
          break
        case 'scrollbar':
          tableVars.scrollbarLayer?.batchDraw() // 滚动条层
          break
        case 'summary':
          tableVars.summaryLayer?.batchDraw() // 汇总行层（底部固定）
          break
      }
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
    const centerX = -tableVars.stageScrollX
    const headerX = -tableVars.stageScrollX

    /**
     * 更新左侧和右侧主体（只有 Y 位置变化）
     * 注意：由于左右body组现在在裁剪组中，Y位置应该相对于裁剪组
     */
    tableVars.leftBodyGroup.y(-tableVars.stageScrollY)
    tableVars.rightBodyGroup.y(-tableVars.stageScrollY)

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
     * 更新汇总组位置（完全参考表头的实现方式）
     * 左右汇总组：固定位置，不滚动
     * 中间汇总组：在裁剪组中，只需要更新x位置跟随滚动
     */
    if (tableVars.leftSummaryGroup) {
      // 左侧汇总组：固定位置，不需要更新（与左侧表头一样）
      // 位置已在创建时设置，保持不变
    }
    if (tableVars.rightSummaryGroup) {
      // 右侧汇总组：固定位置，不需要更新（与右侧表头一样）
      // 位置已在创建时设置，保持不变
    }
    if (tableVars.centerSummaryGroup) {
      // 中间汇总组：在裁剪组中，需要跟随水平滚动（与中间表头一致）
      tableVars.centerSummaryGroup.x(headerX)
      tableVars.centerSummaryGroup.y(0) // 相对于裁剪组
    }

    updateScrollbarPosition()

    // 水平滚动时也需要重绘固定层
    scheduleLayersBatchDraw(['body', 'fixed', 'scrollbar', 'summary'])
    updateFilterDropdownPositionsInTable()
    updateSummaryDropdownPositionsInTable()
  }

  /**
   * 更新横纵滚动条位置
   */
  const updateScrollbarPosition = () => {
    if (!tableVars.stage) return

    const { width: stageWidth, height: stageHeight } = getStageAttr()
    const { maxScrollX, maxScrollY } = getScrollLimits()

    // 更新垂直滚动条位置
    if (tableVars.verticalScrollbarThumbRect && maxScrollY > 0) {
      const trackHeight =
        stageHeight - props.headerRowHeight - summaryRowHeight.value - (maxScrollX > 0 ? props.scrollbarSize : 0)
      const thumbHeight = Math.max(20, (trackHeight * trackHeight) / (tableData.value.length * props.bodyRowHeight))
      const thumbY = props.headerRowHeight + (tableVars.stageScrollY / maxScrollY) * (trackHeight - thumbHeight)
      tableVars.verticalScrollbarThumbRect.y(thumbY)
    }

    // 更新水平滚动条位置
    if (tableVars.horizontalScrollbarThumbRect && maxScrollX > 0) {
      const { leftWidth, rightWidth, centerWidth } = getSplitColumns()
      const visibleWidth = stageWidth - leftWidth - rightWidth - (maxScrollY > 0 ? props.scrollbarSize : 0)
      const thumbWidth = Math.max(20, (visibleWidth * visibleWidth) / centerWidth)
      const thumbX = leftWidth + (tableVars.stageScrollX / maxScrollX) * (visibleWidth - thumbWidth)
      tableVars.horizontalScrollbarThumbRect.x(thumbX)
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
    tableVars.centerSummaryGroup?.x(headerX) // 修复：汇总行应该和表头使用相同的X坐标（headerX）

    updateScrollbarPosition()

    // 水平滚动需要更新表头、主体、固定列和汇总行
    scheduleLayersBatchDraw(['header', 'body', 'fixed', 'scrollbar', 'summary'])
    updateCellEditorPositionsInTable()
    updateFilterDropdownPositionsInTable()
    updateSummaryDropdownPositionsInTable()
  }

  /**
   * 更新垂直滚动
   * @param offsetY 滚动偏移量
   */
  const updateVerticalScroll = (offsetY: number) => {
    if (!tableVars.stage || !tableVars.leftBodyGroup || !tableVars.centerBodyGroup || !tableVars.rightBodyGroup) return

    // 简化版本：直接使用传入的偏移量，不做累积和节流处理
    const actualOffsetY = offsetY

    const { maxScrollY } = getScrollLimits()
    tableVars.stageScrollY = constrainToRange(tableVars.stageScrollY + actualOffsetY, 0, maxScrollY)

    // 简化版本：每次滚动都重新计算和渲染
    const oldVisibleStart = tableVars.visibleRowStart
    const oldVisibleEnd = tableVars.visibleRowEnd
    calculateVisibleRows()

    const visibleRangeChanged =
      tableVars.visibleRowStart !== oldVisibleStart || tableVars.visibleRowEnd !== oldVisibleEnd

    if (visibleRangeChanged) {
      // 重新渲染可视区域
      const { leftCols, centerCols, rightCols } = getSplitColumns()
      tableVars.bodyPositionMapList.length = 0

      // 批量执行重绘操作，减少单独的绘制调用
      const renderOperations = [
        () => drawBodyPart(tableVars.leftBodyGroup, leftCols, tableVars.leftBodyPools),
        () => drawBodyPart(tableVars.centerBodyGroup, centerCols, tableVars.centerBodyPools),
        () => drawBodyPart(tableVars.rightBodyGroup, rightCols, tableVars.rightBodyPools)
      ]

      // 执行所有渲染操作
      renderOperations.forEach((operation) => operation())

      // 重新绘制后，确保点击高亮矩形位于最顶层
      if (tableVars.highlightRect) {
        tableVars.highlightRect.moveToTop()
      }
    }

    // 修复：统一使用相对于裁剪组的坐标系统
    const fixedColumnsY = -tableVars.stageScrollY // 左右固定列相对于裁剪组
    const centerY = -tableVars.stageScrollY

    // 固定列和中间列随垂直滚动
    tableVars.leftBodyGroup.y(fixedColumnsY)
    tableVars.rightBodyGroup.y(fixedColumnsY)
    tableVars.centerBodyGroup.y(centerY)
    updateScrollbarPosition()
    updateCellEditorPositionsInTable()
    scheduleLayersBatchDraw(['body', 'fixed', 'scrollbar', 'summary'])
  }

  /**
   * 处理滚轮事件
   * @param {WheelEvent} e 滚轮事件
   */
  const handleMouseWheel = (e: WheelEvent) => {
    e.preventDefault()

    if (tableVars.stage) tableVars.stage.setPointersPositions(e)

    const hasDeltaX = Math.abs(e.deltaX) > 0
    const hasDeltaY = Math.abs(e.deltaY) > 0

    // 兼容 Shift + 滚轮用于横向滚动（常见于鼠标）
    if (e.shiftKey && !hasDeltaX && hasDeltaY) {
      updateHorizontalScroll(e.deltaY)
      return
    }

    // 实现滚动方向锁定：比较 deltaY 和 deltaX 的绝对值，只执行主要方向的滚动
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      // 主要是上下滚动
      if (hasDeltaY) {
        updateVerticalScroll(e.deltaY)
      }
    } else {
      // 主要是左右滚动
      if (hasDeltaX) {
        updateHorizontalScroll(e.deltaX)
      }
    }
  }

  /**
   * 初始化滚轮事件监听器
   */
  const initWheelListener = () => {
    const tableContainer = getTableContainerElement()
    tableContainer?.addEventListener('wheel', handleMouseWheel, { passive: false })
  }

  /**
   * 清理滚轮事件监听器
   */
  const cleanupWheelListener = () => {
    const tableContainer = getTableContainerElement()
    tableContainer?.removeEventListener('wheel', handleMouseWheel)
  }

  return {
    drawVerticalScrollbar,
    drawHorizontalScrollbar,
    updateScrollbarPosition,
    updateScrollPositions,
    initWheelListener,
    cleanupWheelListener
  }
}
