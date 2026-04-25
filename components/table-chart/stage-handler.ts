import Konva from 'konva'
import {
  bodyVars,
  calculateColumnsInfo,
  calculateVisibleRows,
  cellEditorRef,
  columnsInfo,
  createBodyCenterGroup,
  createBodyLeftGroup,
  createBodyRightGroup,
  createCenterBodyClipGroup,
  createLeftBodyClipGroup,
  createRightBodyClipGroup,
  drawBodyPart
} from './body-handler'
import {
  cleanupDragState,
  cleanupResizeState,
  createHeaderCenterGroup,
  createHeaderClipGroup,
  createHeaderLeftGroup,
  createHeaderRightGroup,
  drawHeaderPart,
  filterDropdownRef,
  handleColumnReorder,
  headerVars,
  updateDragIndicator,
  updateResizeIndicator
} from './header-handler'
import { staticParams, tableData } from './parameter'
import {
  calculateScrollRange,
  createHorizontalScrollbarGroup,
  createVerticalScrollbarGroup,
  drawHorizontalScrollbarPart,
  drawVerticalScrollbarPart,
  scrollbarVars,
  updateHorizontalScroll,
  updateVerticalScroll
} from './scrollbar-handler'

import {
  createSummaryCenterGroup,
  createSummaryClipGroup,
  createSummaryLeftGroup,
  createSummaryRightGroup,
  drawSummaryPart,
  getSummaryRowHeight,
  summaryDropdownRef,
  summaryVars
} from './summary-handler'
import { measureTablePerf, updateTablePerfSnapshot } from './perf'
import { clearPool, setPointerStyle } from './utils'

interface StageVars {
  stage: Konva.Stage | null
}

export const stageVars: StageVars = {
  /**
   * Stage 实例
   */
  stage: null
}

/**
 * 获取 Stage 的属性
 * @returns {Object} Stage 属性对象
 */
export const getStageSize = () => {
  if (!stageVars.stage) return { width: 0, height: 0 }
  return {
    width: stageVars.stage.width(),
    height: stageVars.stage.height()
  }
}

const syncTablePerfSnapshot = () => {
  const { width, height } = getStageSize()
  updateTablePerfSnapshot({
    stageWidth: width,
    stageHeight: height,
    columnCount: columnsInfo.leftColumns.length + columnsInfo.centerColumns.length + columnsInfo.rightColumns.length,
    visibleRows: Math.max(0, bodyVars.visibleRowEnd - bodyVars.visibleRowStart + 1),
    bufferRows: staticParams.bufferRows,
    processedRows: tableData.value.length,
    scrollX: scrollbarVars.stageScrollX,
    scrollY: scrollbarVars.stageScrollY
  })
}

const clearHeaderGroups = () => {
  headerVars.headerLayer?.destroyChildren()
  headerVars.leftHeaderGroup = null
  headerVars.centerHeaderGroup = null
  headerVars.rightHeaderGroup = null
  headerVars.resizeIndicatorLine = null
  headerVars.dragDropIndicator = null
}

const clearBodyGroups = () => {
  bodyVars.bodyLayer?.destroyChildren()
  bodyVars.fixedBodyLayer?.destroyChildren()
  bodyVars.leftBodyGroup = null
  bodyVars.centerBodyGroup = null
  bodyVars.rightBodyGroup = null
  bodyVars.highlightRect = null
  bodyVars.visibleRowStart = 0
  bodyVars.visibleRowEnd = 0
  bodyVars.visibleRowCount = 0
}

const clearSummaryGroups = () => {
  summaryVars.summaryLayer?.destroyChildren()
  summaryVars.leftSummaryGroup = null
  summaryVars.centerSummaryGroup = null
  summaryVars.rightSummaryGroup = null
}

const clearScrollbarGroups = () => {
  scrollbarVars.scrollbarLayer?.destroyChildren()
  scrollbarVars.verticalScrollbarGroup = null
  scrollbarVars.horizontalScrollbarGroup = null
  scrollbarVars.verticalScrollbarThumb = null
  scrollbarVars.horizontalScrollbarThumb = null
}

/**
 * 清除分组 清理所有分组
 * @returns {void}
 */
export const clearGroups = () => {
  clearHeaderGroups()
  clearBodyGroups()
  clearSummaryGroups()
  clearScrollbarGroups()
}

/**
 * 初始化 Stage 和所有 Layer
 * @returns {void}
 */
export const initStage = (tableContainer?: HTMLDivElement | null) => {
  const containerElement = tableContainer || (stageVars.stage?.container() as HTMLDivElement | undefined | null) || null
  if (!containerElement) return
  const width = containerElement.clientWidth
  const height = containerElement.clientHeight

  if (!stageVars.stage) {
    stageVars.stage = new Konva.Stage({ container: containerElement, width, height })
  } else {
    stageVars.stage.size({ width, height })
  }

  // 主体相关
  // 1. 主体内容层（最底层 - 可滚动的body部分）
  if (!bodyVars.bodyLayer) {
    bodyVars.bodyLayer = new Konva.Layer()
    stageVars.stage.add(bodyVars.bodyLayer)
  }

  // 2. 固定列body层（中间层 - 左右固定列的body部分）
  if (!bodyVars.fixedBodyLayer) {
    bodyVars.fixedBodyLayer = new Konva.Layer()
    stageVars.stage.add(bodyVars.fixedBodyLayer)
  }

  // 3. 表头层（高层 - 所有表头，不被遮挡）
  if (!headerVars.headerLayer) {
    headerVars.headerLayer = new Konva.Layer()
    stageVars.stage.add(headerVars.headerLayer)
  }

  // 4. 滚动条层（最高层）
  if (!scrollbarVars.scrollbarLayer) {
    scrollbarVars.scrollbarLayer = new Konva.Layer()
    stageVars.stage.add(scrollbarVars.scrollbarLayer)
  }

  // 5. 滚动条组（根据滚动需求创建）
  const { maxHorizontalScroll, maxVerticalScroll } = calculateScrollRange()

  if (maxVerticalScroll > 0 && !scrollbarVars.verticalScrollbarGroup) {
    scrollbarVars.verticalScrollbarGroup = new Konva.Group()
    scrollbarVars.scrollbarLayer.add(scrollbarVars.verticalScrollbarGroup)
  }

  if (maxHorizontalScroll > 0 && !scrollbarVars.horizontalScrollbarGroup) {
    scrollbarVars.horizontalScrollbarGroup = new Konva.Group()
    scrollbarVars.scrollbarLayer.add(scrollbarVars.horizontalScrollbarGroup)
  }

  // 汇总层
  if (!summaryVars.summaryLayer) {
    summaryVars.summaryLayer = new Konva.Layer()
    stageVars.stage.add(summaryVars.summaryLayer)
  }

  stageVars.stage.setPointersPositions({
    clientX: 0,
    clientY: 0
  })
}

/**
 * 清理所有 Stage 相关资源
 * @returns {void}
 */
export const destroyStage = () => {
  stageVars.stage?.destroy()

  clearPool(bodyVars.leftBodyPools.cellRects)
  clearPool(bodyVars.leftBodyPools.cellTexts)
  clearPool(bodyVars.centerBodyPools.cellRects)
  clearPool(bodyVars.centerBodyPools.cellTexts)
  clearPool(bodyVars.rightBodyPools.cellRects)
  clearPool(bodyVars.rightBodyPools.cellTexts)

  stageVars.stage = null
  // 表头相关
  headerVars.headerLayer = null

  // 主体相关
  bodyVars.bodyLayer = null
  bodyVars.fixedBodyLayer = null
  bodyVars.highlightRect = null
  bodyVars.visibleRowStart = 0
  bodyVars.visibleRowEnd = 0
  bodyVars.visibleRowCount = 0

  // 汇总相关
  summaryVars.summaryLayer = null
  summaryVars.leftSummaryGroup = null
  summaryVars.centerSummaryGroup = null
  summaryVars.rightSummaryGroup = null

  // 滚动条相关
  scrollbarVars.scrollbarLayer = null
  scrollbarVars.verticalScrollbarGroup = null
  scrollbarVars.horizontalScrollbarGroup = null
  scrollbarVars.verticalScrollbarThumb = null
  scrollbarVars.horizontalScrollbarThumb = null
}

/**
 * 刷新表格（可选重置滚动位置）
 * @param {boolean} resetScroll - 是否重置滚动位置
 */
export const refreshTable = (resetScroll: boolean) => {
  measureTablePerf('refreshTable', () => {
    if (resetScroll) {
      scrollbarVars.stageScrollX = 0
      scrollbarVars.stageScrollY = 0
    }
    clearGroups()
    rebuildGroups()
    syncTablePerfSnapshot()
  })
}

/**
 * @desc 刷新表头区域。
 */
export const refreshHeaderSection = () => {
  if (!stageVars.stage) return
  clearHeaderGroups()
  rebuildHeaderGroup()
  scheduleLayersBatchDraw(['header'])
  syncTablePerfSnapshot()
}

/**
 * @desc 刷新表格主体区域。
 */
export const refreshBodySection = () => {
  if (!stageVars.stage) return
  clearBodyGroups()
  rebuildBodyGroup()
  scheduleLayersBatchDraw(['body', 'fixed'])
  syncTablePerfSnapshot()
}

/**
 * @desc 刷新汇总行区域。
 */
export const refreshSummarySection = () => {
  if (!stageVars.stage) return
  clearSummaryGroups()
  rebuildSummaryGroup()
  scheduleLayersBatchDraw(['summary'])
  syncTablePerfSnapshot()
}

/**
 * @desc 刷新滚动条区域。
 */
export const refreshScrollbarSection = () => {
  if (!stageVars.stage) return
  clearScrollbarGroups()
  rebuildVerticalScrollbarGroup()
  rebuildHorizontalScrollbarGroup()
  scheduleLayersBatchDraw(['scrollbar'])
  syncTablePerfSnapshot()
}

/**
 * 重建表头分组
 * @returns {void}
 */
const rebuildHeaderGroup = () => {
  if (!headerVars.headerLayer) return
  measureTablePerf('refreshHeader', () => {
    const headerLayer = headerVars.headerLayer
    if (!headerLayer) return

    const { width: stageWidth } = getStageSize()
    const { maxVerticalScroll } = calculateScrollRange()
    const verticalScrollbarWidth = maxVerticalScroll > 0 ? staticParams.scrollbarSize : 0
    const headerClipGroup = createHeaderClipGroup(0, 0, {
      x: 0,
      y: 0,
      width: stageWidth - columnsInfo.rightPartWidth - verticalScrollbarWidth,
      height: staticParams.headerRowHeight
    })

    headerLayer.add(headerClipGroup)

    headerVars.leftHeaderGroup = createHeaderLeftGroup(0, 0)
    headerVars.centerHeaderGroup = createHeaderCenterGroup(-scrollbarVars.stageScrollX + columnsInfo.leftPartWidth, 0)
    headerVars.rightHeaderGroup = createHeaderRightGroup(
      stageWidth - columnsInfo.rightPartWidth - verticalScrollbarWidth,
      0
    )

    headerClipGroup.add(headerVars.centerHeaderGroup)

    headerLayer.add(headerVars.leftHeaderGroup, headerVars.rightHeaderGroup)

    drawHeaderPart(headerVars.leftHeaderGroup, columnsInfo.leftColumns)
    drawHeaderPart(headerVars.centerHeaderGroup, columnsInfo.centerColumns)
    drawHeaderPart(headerVars.rightHeaderGroup, columnsInfo.rightColumns)
  })
}

/**
 * 重建主体分组
 * @returns {void}
 */
const rebuildBodyGroup = () => {
  if (!bodyVars.bodyLayer || !bodyVars.fixedBodyLayer) return
  measureTablePerf('refreshBody', () => {
    const bodyLayer = bodyVars.bodyLayer
    const fixedBodyLayer = bodyVars.fixedBodyLayer
    if (!bodyLayer || !fixedBodyLayer) return

    const { width: stageWidth, height: stageHeight } = getStageSize()
    const { maxHorizontalScroll, maxVerticalScroll } = calculateScrollRange()
    const verticalScrollbarWidth = maxVerticalScroll > 0 ? staticParams.scrollbarSize : 0
    const horizontalScrollbarHeight = maxHorizontalScroll > 0 ? staticParams.scrollbarSize : 0
    const bodyClipGroupHeight =
      stageHeight - staticParams.headerRowHeight - getSummaryRowHeight() - horizontalScrollbarHeight
    const bodyClipGroupWidth =
      stageWidth - columnsInfo.leftPartWidth - columnsInfo.rightPartWidth - verticalScrollbarWidth
    const centerBodyClipGroup = createCenterBodyClipGroup(columnsInfo.leftPartWidth, staticParams.headerRowHeight, {
      x: 0,
      y: 0,
      width: bodyClipGroupWidth,
      height: bodyClipGroupHeight
    })

    bodyLayer.add(centerBodyClipGroup)
    bodyVars.leftBodyGroup = createBodyLeftGroup(0, 0)
    bodyVars.centerBodyGroup = createBodyCenterGroup(-scrollbarVars.stageScrollX, -scrollbarVars.stageScrollY)
    bodyVars.rightBodyGroup = createBodyRightGroup(0, 0)

    centerBodyClipGroup.add(bodyVars.centerBodyGroup)

    const leftBodyClipGroup = createLeftBodyClipGroup(0, staticParams.headerRowHeight, {
      x: 0,
      y: 0,
      width: columnsInfo.leftPartWidth,
      height: bodyClipGroupHeight
    })

    const rightBodyClipGroup = createRightBodyClipGroup(
      stageWidth - columnsInfo.rightPartWidth - verticalScrollbarWidth,
      staticParams.headerRowHeight,
      {
        x: 0,
        y: 0,
        width: columnsInfo.rightPartWidth,
        height: bodyClipGroupHeight
      }
    )

    leftBodyClipGroup.add(bodyVars.leftBodyGroup)
    rightBodyClipGroup.add(bodyVars.rightBodyGroup)

    bodyVars.leftBodyGroup.x(0)
    bodyVars.leftBodyGroup.y(-scrollbarVars.stageScrollY)
    bodyVars.rightBodyGroup.x(0)
    bodyVars.rightBodyGroup.y(-scrollbarVars.stageScrollY)

    fixedBodyLayer.add(leftBodyClipGroup, rightBodyClipGroup)

    calculateVisibleRows()

    drawBodyPart(bodyVars.leftBodyGroup, columnsInfo.leftColumns, bodyVars.leftBodyPools)
    drawBodyPart(bodyVars.centerBodyGroup, columnsInfo.centerColumns, bodyVars.centerBodyPools)
    drawBodyPart(bodyVars.rightBodyGroup, columnsInfo.rightColumns, bodyVars.rightBodyPools)
  })
}

/**
 * 重建汇总分组
 * @returns {void}
 */
const rebuildSummaryGroup = () => {
  if (!summaryVars.summaryLayer) return
  measureTablePerf('refreshSummary', () => {
    const summaryLayer = summaryVars.summaryLayer
    if (!summaryLayer) return

    if (staticParams.enableSummary) {
      const { width: stageWidth, height: stageHeight } = getStageSize()
      const { maxHorizontalScroll, maxVerticalScroll } = calculateScrollRange()
      const verticalScrollbarWidth = maxVerticalScroll > 0 ? staticParams.scrollbarSize : 0
      const horizontalScrollbarHeight = maxHorizontalScroll > 0 ? staticParams.scrollbarSize : 0
      const y = stageHeight - getSummaryRowHeight() - horizontalScrollbarHeight
      const centerSummaryClipGroup = createSummaryClipGroup(0, y, {
        x: 0,
        y: 0,
        width: stageWidth - columnsInfo.rightPartWidth - verticalScrollbarWidth,
        height: getSummaryRowHeight()
      })

      summaryLayer.add(centerSummaryClipGroup)

      summaryVars.leftSummaryGroup = createSummaryLeftGroup(0, y)
      summaryVars.centerSummaryGroup = createSummaryCenterGroup(
        -scrollbarVars.stageScrollX + columnsInfo.leftPartWidth,
        0
      )
      summaryVars.rightSummaryGroup = createSummaryRightGroup(
        stageWidth - columnsInfo.rightPartWidth - verticalScrollbarWidth,
        y
      )

      centerSummaryClipGroup.add(summaryVars.centerSummaryGroup)
      summaryLayer.add(summaryVars.leftSummaryGroup, summaryVars.rightSummaryGroup)

      drawSummaryPart(summaryVars.leftSummaryGroup, columnsInfo.leftColumns)
      drawSummaryPart(summaryVars.centerSummaryGroup, columnsInfo.centerColumns)
      drawSummaryPart(summaryVars.rightSummaryGroup, columnsInfo.rightColumns)
    } else {
      summaryVars.leftSummaryGroup = null
      summaryVars.centerSummaryGroup = null
      summaryVars.rightSummaryGroup = null
    }
  })
}

/**
 * 重建垂直滚动条分组
 * @returns {void}
 */
const rebuildVerticalScrollbarGroup = () => {
  if (!scrollbarVars.scrollbarLayer) return
  const { maxVerticalScroll } = calculateScrollRange()
  if (maxVerticalScroll > 0) {
    scrollbarVars.verticalScrollbarGroup = createVerticalScrollbarGroup()
    scrollbarVars.scrollbarLayer.add(scrollbarVars.verticalScrollbarGroup)
    drawVerticalScrollbarPart()
  }
}

/**
 * 重建水平滚动条分组
 * @returns {void}
 */
const rebuildHorizontalScrollbarGroup = () => {
  if (!scrollbarVars.scrollbarLayer) return
  const { maxHorizontalScroll } = calculateScrollRange()
  if (maxHorizontalScroll > 0) {
    scrollbarVars.horizontalScrollbarGroup = createHorizontalScrollbarGroup()
    scrollbarVars.scrollbarLayer.add(scrollbarVars.horizontalScrollbarGroup)
    drawHorizontalScrollbarPart()
  }
}

/**
 * 重建所有分组
 * @returns {void}
 */
export const rebuildGroups = () => {
  if (!stageVars.stage) return
  // 首先计算列信息
  calculateColumnsInfo()
  rebuildHeaderGroup()
  rebuildBodyGroup()
  rebuildSummaryGroup()
  rebuildVerticalScrollbarGroup()
  rebuildHorizontalScrollbarGroup()
  // 批量绘制所有层 - 按正确的渲染顺序
  scheduleLayersBatchDraw(['body', 'fixed', 'header', 'summary', 'scrollbar'])
  syncTablePerfSnapshot()
}

/**
 * 全局鼠标移动处理
 * @param {MouseEvent} mouseEvent - 鼠标事件
 */
const handleGlobalMouseMove = (mouseEvent: MouseEvent) => {
  if (!stageVars.stage) return
  stageVars.stage.setPointersPositions(mouseEvent)

  // 手动拖拽导致的垂直滚动
  if (scrollbarVars.isDraggingVerticalThumb) {
    const deltaY = mouseEvent.clientY - scrollbarVars.dragStartY
    const { maxVerticalScroll, maxHorizontalScroll } = calculateScrollRange()
    const { height: stageHeight } = getStageSize()
    const trackHeight =
      stageHeight -
      staticParams.headerRowHeight -
      (staticParams.enableSummary ? staticParams.summaryRowHeight : 0) -
      (maxHorizontalScroll > 0 ? staticParams.scrollbarSize : 0)
    const thumbHeight = Math.max(
      20,
      (trackHeight * trackHeight) / (tableData.value.length * staticParams.bodyRowHeight)
    )
    const scrollRatio = deltaY / (trackHeight - thumbHeight)
    const newScrollY = scrollbarVars.dragStartScrollY + scrollRatio * maxVerticalScroll

    // 使用统一的垂直滚动方法 - 拖拽模式
    updateVerticalScroll(newScrollY, {
      isAbsolute: true,
      skipThresholdCheck: true // 拖拽时保持原有的阈值检查逻辑
    })
    filterDropdownRef.value?.closeFilterDropdown()
    summaryDropdownRef.value?.closeSummaryDropdown()
    cellEditorRef.value?.closeEditor()
    return
  }

  // 手动拖拽导致的水平滚动
  if (scrollbarVars.isDraggingHorizontalThumb) {
    const deltaX = mouseEvent.clientX - scrollbarVars.dragStartX
    const { maxHorizontalScroll } = calculateScrollRange()
    const { width: stageWidth } = getStageSize()
    const { maxVerticalScroll } = calculateScrollRange()
    const verticalScrollbarSpace = maxVerticalScroll > 0 ? staticParams.scrollbarSize : 0
    const visibleWidth = stageWidth - columnsInfo.leftPartWidth - columnsInfo.rightPartWidth - verticalScrollbarSpace
    const thumbWidth = Math.max(20, (visibleWidth * visibleWidth) / columnsInfo.centerPartWidth)
    const scrollRatio = deltaX / (visibleWidth - thumbWidth)
    const newScrollX = scrollbarVars.dragStartScrollX + scrollRatio * maxHorizontalScroll

    // 使用统一的水平滚动方法，传入绝对位置
    updateHorizontalScroll(newScrollX, true)
    filterDropdownRef.value?.closeFilterDropdown()
    summaryDropdownRef.value?.closeSummaryDropdown()
    cellEditorRef.value?.closeEditor()
    return
  }

  // 列拖拽移动处理
  if (headerVars.isDraggingColumn) {
    const deltaX = mouseEvent.clientX - headerVars.dragStartX
    headerVars.dragTempWidth = headerVars.dragStartWidth + deltaX
    updateDragIndicator()
    // 关闭其他弹窗
    filterDropdownRef.value?.closeFilterDropdown()
    summaryDropdownRef.value?.closeSummaryDropdown()
    cellEditorRef.value?.closeEditor()
    return
  }

  // 列宽调整处理 - 直接更新指示线位置
  if (headerVars.isResizingColumn) {
    const deltaX = mouseEvent.clientX - headerVars.resizeStartX
    headerVars.resizeTempWidth = headerVars.resizeStartWidth + deltaX
    updateResizeIndicator()
    filterDropdownRef.value?.closeFilterDropdown()
    summaryDropdownRef.value?.closeSummaryDropdown()
    cellEditorRef.value?.closeEditor()
    return
  }
}

/**
 * 全局鼠标抬起处理
 * @param {MouseEvent} mouseEvent - 鼠标事件
 */
const handleGlobalMouseUp = (mouseEvent: MouseEvent) => {
  if (stageVars.stage) stageVars.stage.setPointersPositions(mouseEvent)

  // 垂直滚动条拖拽结束
  if (scrollbarVars.isDraggingVerticalThumb) {
    scrollbarVars.isDraggingVerticalThumb = false
    setPointerStyle(stageVars.stage, false, 'default')
    if (scrollbarVars.verticalScrollbarThumb) {
      scrollbarVars.verticalScrollbarThumb.fill(staticParams.scrollbarThumbBackground)
    }
    scheduleLayersBatchDraw(['scrollbar'])
  }

  // 横向滚动条拖拽结束
  if (scrollbarVars.isDraggingHorizontalThumb) {
    scrollbarVars.isDraggingHorizontalThumb = false
    setPointerStyle(stageVars.stage, false, 'default')
    if (scrollbarVars.horizontalScrollbarThumb) {
      scrollbarVars.horizontalScrollbarThumb.fill(staticParams.scrollbarThumbBackground)
    }
    scheduleLayersBatchDraw(['scrollbar'])
  }

  // 列拖拽结束处理
  if (headerVars.isDraggingColumn) {
    handleColumnReorder(mouseEvent.offsetX)
    // 清理拖拽状态
    cleanupDragState()
    setPointerStyle(stageVars.stage, false, 'default')
    return
  }

  // 列宽调整结束 - 应用最终宽度
  if (headerVars.isResizingColumn) {
    // 应用最终宽度
    const allFields = [...staticParams.xAxisFields, ...staticParams.yAxisFields]
    const targetField = allFields.find((f) => f.columnName === headerVars.resizingColumnName)

    if (targetField && headerVars.resizeTempWidth > 0) {
      targetField.width = headerVars.resizeTempWidth
      // 会触发watch 走重新渲染表格的逻辑
    }

    // 使用统一的清理函数
    cleanupResizeState()
    setPointerStyle(stageVars.stage, false, 'default')
  }
}

/**
 * 全局窗口尺寸变化处理
 * @returns {void}
 */
const handleGlobalResize = () => {
  initStage()
  clearGroups()
  rebuildGroups()
}

/**
 * 初始化全局事件监听器
 * @returns {void}
 */
export const initStageListeners = () => {
  window.addEventListener('resize', handleGlobalResize)
  // 需要保留鼠标移动监听以支持列宽拖拽功能
  window.addEventListener('mousemove', handleGlobalMouseMove)
  window.addEventListener('mouseup', handleGlobalMouseUp)
}

/**
 * 清理全局事件监听器
 * @returns {void}
 */
export const cleanupStageListeners = () => {
  window.removeEventListener('resize', handleGlobalResize)
  // 清理鼠标移动监听
  window.removeEventListener('mousemove', handleGlobalMouseMove)
  window.removeEventListener('mouseup', handleGlobalMouseUp)
}

/**
 * 修复的Layer批量绘制 - 5个真实的Layer，确保表头和汇总固定
 * @param {Array<'header' | 'body' | 'fixed' | 'scrollbar' | 'summary'>} layers - 要绘制的层
 */
export const scheduleLayersBatchDraw = (
  layers: Array<'header' | 'body' | 'fixed' | 'scrollbar' | 'summary'> = ['body']
) => {
  layers.forEach((layerType) => {
    switch (layerType) {
      // 表头相关
      case 'header':
        headerVars.headerLayer?.batchDraw()
        break
      // 主体相关
      case 'body':
        bodyVars.bodyLayer?.batchDraw()
        break
      case 'fixed':
        bodyVars.fixedBodyLayer?.batchDraw()
        break
      // 汇总相关
      case 'summary':
        summaryVars.summaryLayer?.batchDraw()
        break
      // 滚动条相关
      case 'scrollbar':
        scrollbarVars.scrollbarLayer?.batchDraw()
        break
    }
  })
}
