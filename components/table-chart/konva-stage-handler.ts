import Konva from 'konva'
import type { CanvasTableEmits } from './emits'
import { chartProps } from './props'
import { renderBodyHandler } from './render/render-body-handler'
import { renderHeaderHandler } from './render/render-header-handler'
import { renderScrollbarsHandler } from './render/render-scrollbars-handler'
import { renderSummaryHandler } from './render/render-summary-handler'
import { clearPool, constrainToRange, getTableContainerElement } from './utils'
import { variableHandlder, type Prettify } from './variable-handlder'
interface KonvaStageHandlerProps {
  props: Prettify<Readonly<ExtractPropTypes<typeof chartProps>>>
  emits?: <T extends keyof CanvasTableEmits>(event: T, ...args: CanvasTableEmits[T]) => void
}
/**
 * Konva Stage 和 Layer 管理器
 */
export const konvaStageHandler = ({ props, emits }: KonvaStageHandlerProps) => {
  const { tableVars } = variableHandlder({ props })
  const summaryRowHeight = computed(() => (props.enableSummary ? props.summaryHeight : 0))
  const ensureEmits = () => {
    if (!emits) {
      throw new Error('This operation requires emits to be provided to konvaStageHandler')
    }
    return emits
  }
  /**
   * 初始化 Stage 和所有 Layer
   * @returns {void}
   */
  const initStage = () => {
    const tableContainer = getTableContainerElement()
    if (!tableContainer) return
    const width = tableContainer.clientWidth
    const height = tableContainer.clientHeight

    if (!tableVars.stage) {
      tableVars.stage = new Konva.Stage({ container: tableContainer, width, height })
    } else {
      tableVars.stage.size({ width, height })
    }

    if (!tableVars.headerLayer) {
      tableVars.headerLayer = new Konva.Layer()
      tableVars.stage.add(tableVars.headerLayer)
    }

    if (!tableVars.bodyLayer) {
      tableVars.bodyLayer = new Konva.Layer()
      tableVars.stage.add(tableVars.bodyLayer)
    }

    if (!tableVars.fixedBodyLayer) {
      tableVars.fixedBodyLayer = new Konva.Layer()
      tableVars.stage.add(tableVars.fixedBodyLayer)
    }

    if (!tableVars.fixedHeaderLayer) {
      tableVars.fixedHeaderLayer = new Konva.Layer()
      tableVars.stage.add(tableVars.fixedHeaderLayer)
    }

    if (!tableVars.summaryLayer) {
      tableVars.summaryLayer = new Konva.Layer()
      tableVars.stage.add(tableVars.summaryLayer)
    }

    if (!tableVars.fixedSummaryLayer) {
      tableVars.fixedSummaryLayer = new Konva.Layer()
      tableVars.stage.add(tableVars.fixedSummaryLayer)
    }

    if (!tableVars.scrollbarLayer) {
      tableVars.scrollbarLayer = new Konva.Layer()
      tableVars.stage.add(tableVars.scrollbarLayer)
    }

    tableVars.stage.setPointersPositions({
      clientX: 0,
      clientY: 0
    })
  }

  /**
   * 清理所有 Stage 相关资源
   */
  const destroyStage = () => {
    tableVars.stage?.destroy()
    tableVars.stage = null
    tableVars.headerLayer = null
    tableVars.bodyLayer = null
    tableVars.fixedBodyLayer = null
    tableVars.fixedHeaderLayer = null
    tableVars.summaryLayer = null
    tableVars.fixedSummaryLayer = null
    tableVars.scrollbarLayer = null
    tableVars.centerBodyClipGroup = null
    tableVars.highlightRect = null
  }

  /**
   * 设置指针样式的辅助函数
   * @param on 是否显示指针
   */
  const setPointerStyle = (on: boolean, cursor: string) => {
    if (tableVars.stage) tableVars.stage.container().style.cursor = on ? cursor : 'default'
  }

  /**
   * 获取 Stage 的属性
   * @returns {Object}
   */
  const getStageAttr = () => {
    if (!tableVars.stage) return { width: 0, height: 0 }
    return {
      width: tableVars.stage.width(),
      height: tableVars.stage.height()
    }
  }

  /**
   * 刷新表格（可选重置滚动位置）
   * @param resetScroll 是否重置滚动位置
   */
  const refreshTable = (resetScroll: boolean) => {
    const { getScrollLimits, calculateVisibleRows } = renderBodyHandler({ props, emits: ensureEmits() })

    if (resetScroll) {
      tableVars.stageScrollX = 0
      tableVars.stageScrollY = 0
    } else {
      const { maxScrollX, maxScrollY } = getScrollLimits()
      tableVars.stageScrollX = constrainToRange(tableVars.stageScrollX, 0, maxScrollX)
      tableVars.stageScrollY = constrainToRange(tableVars.stageScrollY, 0, maxScrollY)
    }

    calculateVisibleRows()
    clearGroups()
    rebuildGroups()
  }

  /**
   * 全局鼠标移动处理
   */
  const handleGlobalMouseMove = (mouseEvent: MouseEvent) => {
    if (!tableVars.stage) return
    tableVars.stage.setPointersPositions(mouseEvent)

    // 记录鼠标在屏幕中的坐标
    tableVars.lastClientX = mouseEvent.clientX
    tableVars.lastClientY = mouseEvent.clientY

    const { drawBodyPart, recomputeHoverIndexFromPointer, calculateVisibleRows, getScrollLimits, getSplitColumns } =
      renderBodyHandler({ props, emits: ensureEmits() })
    const { updateScrollPositions } = renderScrollbarsHandler({ props, emits: ensureEmits() })
    const { tableData } = variableHandlder({ props })

    // 列宽拖拽中：实时更新覆盖宽度并重建分组
    if (tableVars.isResizingColumn && tableVars.resizingColumnName) {
      const delta = mouseEvent.clientX - tableVars.resizeStartX
      const newWidth = Math.max(props.minAutoColWidth, tableVars.resizeStartWidth + delta)
      tableVars.columnWidthOverrides[tableVars.resizingColumnName] = newWidth
      if (tableVars.resizeNeighborColumnName) {
        const neighborWidth = Math.max(props.minAutoColWidth, tableVars.resizeNeighborStartWidth - delta)
        tableVars.columnWidthOverrides[tableVars.resizeNeighborColumnName] = neighborWidth
      }
      clearGroups()
      rebuildGroups()
      return
    }

    // 手动拖拽导致的垂直滚动
    if (tableVars.isDraggingVerticalThumb) {
      const deltaY = mouseEvent.clientY - tableVars.dragStartY
      const scrollThreshold = props.scrollThreshold
      if (Math.abs(deltaY) < scrollThreshold) return

      const { maxScrollY, maxScrollX } = getScrollLimits()
      const stageHeight = tableVars.stage.height()
      const trackHeight =
        stageHeight -
        props.headerHeight -
        (props.enableSummary ? props.summaryHeight : 0) -
        (maxScrollX > 0 ? props.scrollbarSize : 0)
      const thumbHeight = Math.max(20, (trackHeight * trackHeight) / (tableData.value.length * props.bodyRowHeight))
      const scrollRatio = deltaY / (trackHeight - thumbHeight)
      const newScrollY = tableVars.dragStartScrollY + scrollRatio * maxScrollY

      const oldScrollY = tableVars.stageScrollY
      tableVars.stageScrollY = constrainToRange(newScrollY, 0, maxScrollY)

      // 检查是否需要重新渲染虚拟滚动内容
      const oldVisibleStart = tableVars.visibleRowStart
      const oldVisibleEnd = tableVars.visibleRowEnd
      calculateVisibleRows()

      const needsRerender =
        tableVars.visibleRowStart !== oldVisibleStart ||
        tableVars.visibleRowEnd !== oldVisibleEnd ||
        Math.abs(tableVars.stageScrollY - oldScrollY) > props.bodyRowHeight * 5 // 配合更大的缓冲行数，减少重新渲染频率

      if (needsRerender) {
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
      }

      updateScrollPositions()
      return
    }

    // 手动拖拽导致的水平滚动
    if (tableVars.isDraggingHorizontalThumb) {
      const deltaX = mouseEvent.clientX - tableVars.dragStartX
      const scrollThreshold = props.scrollThreshold
      if (Math.abs(deltaX) < scrollThreshold) return

      const { maxScrollX } = getScrollLimits()
      const { leftWidth, rightWidth, centerWidth } = getSplitColumns()
      const stageWidth = tableVars.stage.width()
      const visibleWidth = stageWidth - leftWidth - rightWidth - props.scrollbarSize
      const thumbWidth = Math.max(20, (visibleWidth * visibleWidth) / centerWidth)
      const scrollRatio = deltaX / (visibleWidth - thumbWidth)
      const newScrollX = tableVars.dragStartScrollX + scrollRatio * maxScrollX

      tableVars.stageScrollX = constrainToRange(newScrollX, 0, maxScrollX)
      updateScrollPositions()
      return
    }
    recomputeHoverIndexFromPointer()
  }

  /**
   * 全局鼠标抬起处理
   */
  const handleGlobalMouseUp = (mouseEvent: MouseEvent) => {
    if (tableVars.stage) tableVars.stage.setPointersPositions(mouseEvent)

    // 滚动条拖拽结束
    if (tableVars.isDraggingVerticalThumb || tableVars.isDraggingHorizontalThumb) {
      tableVars.isDraggingVerticalThumb = false
      tableVars.isDraggingHorizontalThumb = false
      setPointerStyle(false, 'default')
      if (tableVars.verticalScrollbarThumbRect && !tableVars.isDraggingVerticalThumb)
        tableVars.verticalScrollbarThumbRect.fill(props.scrollbarThumb)
      if (tableVars.horizontalScrollbarThumbRect && !tableVars.isDraggingHorizontalThumb)
        tableVars.horizontalScrollbarThumbRect.fill(props.scrollbarThumb)
      tableVars.scrollbarLayer?.batchDraw()
    }

    // 列宽拖拽结束
    if (tableVars.isResizingColumn) {
      tableVars.isResizingColumn = false
      tableVars.resizingColumnName = null
      tableVars.resizeNeighborColumnName = null
      setPointerStyle(false, 'default')
      clearGroups()
      rebuildGroups()
    }
  }

  /**
   * 全局窗口尺寸变化处理
   */
  const handleGlobalResize = () => {
    initStage()
    const { calculateVisibleRows } = renderBodyHandler({ props, emits: ensureEmits() })
    calculateVisibleRows()
    clearGroups()
    rebuildGroups()
  }

  /**
   * 清除分组 清理所有分组
   * @returns {void}
   */
  const clearGroups = () => {
    tableVars.headerLayer?.destroyChildren()
    tableVars.bodyLayer?.destroyChildren()
    tableVars.summaryLayer?.destroyChildren()
    tableVars.fixedHeaderLayer?.destroyChildren()
    tableVars.fixedBodyLayer?.destroyChildren()
    tableVars.fixedSummaryLayer?.destroyChildren()
    tableVars.scrollbarLayer?.destroyChildren()
    clearPool(tableVars.leftBodyPools.cellRects)
    clearPool(tableVars.leftBodyPools.cellTexts)
    clearPool(tableVars.centerBodyPools.cellRects)
    clearPool(tableVars.centerBodyPools.cellTexts)
    clearPool(tableVars.rightBodyPools.cellRects)
    clearPool(tableVars.rightBodyPools.cellTexts)

    /**
     * 重置滚动条引用
     */
    tableVars.verticalScrollbarGroup = null
    tableVars.horizontalScrollbarGroup = null
    tableVars.verticalScrollbarThumbRect = null
    tableVars.horizontalScrollbarThumbRect = null

    /**
     * 重置中心区域剪辑组引用
     */
    tableVars.centerBodyClipGroup = null

    /**
     * 重置单元格选择
     */
    tableVars.highlightRect = null

    /**
     * 重置虚拟滚动状态
     */
    tableVars.visibleRowStart = 0
    tableVars.visibleRowEnd = 0
    tableVars.visibleRowCount = 0

    /**
     * 重置汇总组引用
     */
    tableVars.leftSummaryGroup = null
    tableVars.centerSummaryGroup = null
    tableVars.rightSummaryGroup = null

    /**
     * 重置悬浮高亮
     */
    tableVars.hoveredRowIndex = null
    tableVars.hoveredColIndex = null
  }

  /**
   * 重建分组
   * @returns {void}
   */
  const rebuildGroups = () => {
    if (
      !tableVars.stage ||
      !tableVars.headerLayer ||
      !tableVars.fixedHeaderLayer ||
      !tableVars.bodyLayer ||
      !tableVars.fixedBodyLayer ||
      !tableVars.summaryLayer ||
      !tableVars.fixedSummaryLayer ||
      !tableVars.scrollbarLayer
    ) {
      return
    }

    // 必须提供 emits 才能完整重建（用于下拉与交互）
    if (!emits) {
      throw new Error('rebuildGroups requires emits to be provided to konvaStageHandler')
    }

    const { drawHeaderPart } = renderHeaderHandler({ props })
    const { drawBodyPart, getSplitColumns, getScrollLimits } = renderBodyHandler({ props, emits })
    const { drawSummaryPart } = renderSummaryHandler({ props })
    const { createScrollbars } = renderScrollbarsHandler({ props, emits })

    const { leftCols, centerCols, rightCols, leftWidth, centerWidth, rightWidth } = getSplitColumns()
    const { width: stageWidth, height: stageHeight } = getStageAttr()
    const { maxScrollX, maxScrollY } = getScrollLimits()
    const verticalScrollbarSpace = maxScrollY > 0 ? props.scrollbarSize : 0
    const horizontalScrollbarSpace = maxScrollX > 0 ? props.scrollbarSize : 0

    if (!tableVars.centerBodyClipGroup) {
      const clipHeight = stageHeight - props.headerHeight - summaryRowHeight.value - horizontalScrollbarSpace
      tableVars.centerBodyClipGroup = createCenterBodyClipGroup(leftWidth, props.headerHeight, {
        x: 0,
        y: 0,
        width: stageWidth - leftWidth - rightWidth - verticalScrollbarSpace,
        height: clipHeight
      })
      tableVars.bodyLayer.add(tableVars.centerBodyClipGroup)
    }

    tableVars.leftHeaderGroup = createHeaderLeftGroups(0, 0)
    tableVars.centerHeaderGroup = createHeaderCenterGroups(leftWidth - tableVars.stageScrollX, 0)
    tableVars.rightHeaderGroup = createHeaderRightGroups(stageWidth - rightWidth - verticalScrollbarSpace, 0)

    tableVars.leftBodyGroup = createBodyLeftGroups(0, props.headerHeight - tableVars.stageScrollY)
    tableVars.centerBodyGroup = createBodyCenterGroups(-tableVars.stageScrollX, -tableVars.stageScrollY)
    tableVars.rightBodyGroup = createBodyRightGroups(
      stageWidth - rightWidth - verticalScrollbarSpace,
      props.headerHeight - tableVars.stageScrollY
    )

    tableVars.headerLayer.add(tableVars.centerHeaderGroup)
    tableVars.fixedHeaderLayer.add(tableVars.leftHeaderGroup, tableVars.rightHeaderGroup)

    if (props.enableSummary) {
      const summaryY = stageHeight - summaryRowHeight.value - horizontalScrollbarSpace
      tableVars.leftSummaryGroup = createSummaryLeftGroups(0, summaryY)
      tableVars.centerSummaryGroup = createSummaryCenterGroups(leftWidth - tableVars.stageScrollX, summaryY)
      tableVars.rightSummaryGroup = createSummaryRightGroups(stageWidth - rightWidth - verticalScrollbarSpace, summaryY)
      tableVars.summaryLayer.add(tableVars.centerSummaryGroup)
      tableVars.fixedSummaryLayer.add(tableVars.leftSummaryGroup, tableVars.rightSummaryGroup)
    } else {
      tableVars.leftSummaryGroup = null
      tableVars.centerSummaryGroup = null
      tableVars.rightSummaryGroup = null
    }

    tableVars.centerBodyClipGroup.add(tableVars.centerBodyGroup)
    tableVars.fixedBodyLayer.add(tableVars.leftBodyGroup, tableVars.rightBodyGroup)

    tableVars.headerPositionMapList.length = 0
    // 绘制表头
    drawHeaderPart(tableVars.leftHeaderGroup, leftCols, 0, tableVars.headerPositionMapList, 0)
    drawHeaderPart(tableVars.centerHeaderGroup, centerCols, leftCols.length, tableVars.headerPositionMapList, leftWidth)
    drawHeaderPart(
      tableVars.rightHeaderGroup,
      rightCols,
      leftCols.length + centerCols.length,
      tableVars.headerPositionMapList,
      leftWidth + centerWidth
    )

    tableVars.bodyPositionMapList.length = 0
    // 绘制主体
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

    // 绘制底部 summary
    if (props.enableSummary) {
      tableVars.summaryPositionMapList.length = 0
      drawSummaryPart(tableVars.leftSummaryGroup, leftCols, 0, tableVars.summaryPositionMapList, 0)
      drawSummaryPart(
        tableVars.centerSummaryGroup,
        centerCols,
        leftCols.length,
        tableVars.summaryPositionMapList,
        leftWidth
      )
      drawSummaryPart(
        tableVars.rightSummaryGroup,
        rightCols,
        leftCols.length + centerCols.length,
        tableVars.summaryPositionMapList,
        leftWidth + centerWidth
      )
    }

    createScrollbars()

    tableVars.headerLayer.batchDraw()
    tableVars.bodyLayer?.batchDraw()
    tableVars.fixedBodyLayer?.batchDraw()
    tableVars.fixedHeaderLayer?.batchDraw()
    tableVars.summaryLayer?.batchDraw()
    tableVars.fixedSummaryLayer?.batchDraw()
    tableVars.scrollbarLayer?.batchDraw()
  }

  // 暴露到全局状态，供其他模块调用（仅在提供 emits 时设置，以避免无 emits 实例覆盖）
  if (emits) {
    tableVars.rebuildGroupsFn = rebuildGroups
  }

  /**
   * 创建左侧表头组
   * @param {number} x
   * @param {number} y
   * @returns {Konva.Group}
   */
  const createHeaderLeftGroups = (x: number, y: number) => {
    const leftHeaderGroup = new Konva.Group({
      x: 0,
      y: 0,
      name: 'left-header-group'
    })
    return leftHeaderGroup
  }

  /**
   * 创建中间表头组
   * @param {number} x
   * @param {number} y
   * @returns {Konva.Group}
   */
  const createHeaderCenterGroups = (x: number, y: number) => {
    const centerHeaderGroup = new Konva.Group({
      x: x,
      y: y,
      name: 'center-header-group'
    })
    return centerHeaderGroup
  }

  /**
   * 创建右侧表头组
   * @param {number} x
   * @param {number} y
   * @returns {Konva.Group}
   */
  const createHeaderRightGroups = (x: number, y: number) => {
    const rightHeaderGroup = new Konva.Group({
      x: x,
      y: y,
      name: 'right-header-group'
    })
    return rightHeaderGroup
  }

  /**
   * 创建左侧表体组
   * @param {number} x
   * @param {number} y
   * @returns {Konva.Group}
   */
  const createBodyLeftGroups = (x: number, y: number) => {
    const leftBodyGroup = new Konva.Group({
      x: x,
      y: y,
      name: 'left-body-group'
    })
    return leftBodyGroup
  }

  /**
   * 创建中间表体组
   * @param {number} x
   * @param {number} y
   * @returns {Konva.Group}
   */
  const createBodyCenterGroups = (x: number, y: number) => {
    const centerBodyGroup = new Konva.Group({
      x: x,
      y: y,
      name: 'center-body-group'
    })
    return centerBodyGroup
  }

  /**
   * 创建右侧表体组
   * @param {number} x
   * @param {number} y
   * @returns {Konva.Group}
   */
  const createBodyRightGroups = (x: number, y: number) => {
    const rightBodyGroup = new Konva.Group({
      x: x,
      y: y,
      name: 'right-body-group'
    })
    return rightBodyGroup
  }

  /**
   * 创建左侧汇总组
   * @param {number} x
   * @param {number} y
   * @returns {Konva.Group}
   */
  const createSummaryLeftGroups = (x: number, y: number) => {
    const leftSummaryGroup = new Konva.Group({
      x: x,
      y: y,
      name: 'left-summary-group'
    })
    return leftSummaryGroup
  }

  /**
   * 创建中间汇总组
   * @param {number} x
   * @param {number} y
   * @returns {Konva.Group}
   */
  const createSummaryCenterGroups = (x: number, y: number) => {
    const centerSummaryGroup = new Konva.Group({
      x: x,
      y: y,
      name: 'center-summary-group'
    })
    return centerSummaryGroup
  }

  /**
   * 创建右侧汇总组
   * @param {number} x
   * @param {number} y
   * @returns {Konva.Group}
   */
  const createSummaryRightGroups = (x: number, y: number) => {
    const rightSummaryGroup = new Konva.Group({
      x: x,
      y: y,
      name: 'right-summary-group'
    })
    return rightSummaryGroup
  }

  /**
   * 创建中间表体剪辑组
   * @param x
   * @param y
   * @param clip
   * @returns {Konva.Group}
   */
  const createCenterBodyClipGroup = (
    x: number,
    y: number,
    clip: {
      x: number
      y: number
      width: number
      height: number
    }
  ) => {
    const centerBodyClipGroup = new Konva.Group({
      x: x,
      y: y,
      name: 'center-body-clip-group',
      clip: clip
    })
    return centerBodyClipGroup
  }

  /**
   * 初始化全局事件监听器
   */
  const initStageListeners = () => {
    // 仅在提供 emits 时，注册依赖 emits 的全局事件监听器
    if (!emits) return
    window.addEventListener('resize', handleGlobalResize)
    window.addEventListener('mousemove', handleGlobalMouseMove)
    window.addEventListener('mouseup', handleGlobalMouseUp)
  }

  /**
   * 清理全局事件监听器
   */
  const cleanupStageListeners = () => {
    if (!emits) return
    window.removeEventListener('resize', handleGlobalResize)
    window.removeEventListener('mousemove', handleGlobalMouseMove)
    window.removeEventListener('mouseup', handleGlobalMouseUp)
  }

  return {
    initStage,
    destroyStage,
    getStageAttr,
    rebuildGroups,
    refreshTable,
    handleGlobalMouseMove,
    handleGlobalMouseUp,
    handleGlobalResize,
    clearGroups,
    initStageListeners,
    cleanupStageListeners,
    setPointerStyle
  }
}
