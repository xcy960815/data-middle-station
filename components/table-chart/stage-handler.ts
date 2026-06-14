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
  drawBodyPart,
  resetBodyState
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
  resetHeaderState,
  updateDragIndicator,
  updateResizeIndicator
} from './header-handler'
import {
  getCurrentTableContext,
  getTableParams,
  getProcessedRows,
  getRuntimeState,
  runWithTableContext,
  updateTableColumnWidth
} from './parameter'
import { resetScrollState, scrollbarVars } from './scrollbar-handler'

import {
  createSummaryCenterGroup,
  createSummaryClipGroup,
  createSummaryLeftGroup,
  createSummaryRightGroup,
  drawSummaryPart,
  getSummaryRowHeight,
  resetSummaryRuntimeState,
  summaryDropdownRef,
  summaryVars
} from './summary-handler'
import { measureTablePerf, updateTablePerfSnapshot } from './perf'
import { clearPool, setPointerStyle } from './utils'

export const stageVars = new Proxy({} as { stage: Konva.Stage | null }, {
  get: (_target, property: 'stage') => getRuntimeState().stage[property],
  set: (_target, property: 'stage', value) => {
    getRuntimeState().stage[property] = value
    return true
  }
})

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
  const groupColumnCount = getTableParams().xAxisFields.length
  const measureColumnCount = getTableParams().yAxisFields.length
  updateTablePerfSnapshot({
    stageWidth: width,
    stageHeight: height,
    groupColumnCount,
    measureColumnCount,
    columnCount: groupColumnCount + measureColumnCount,
    visibleRows: Math.max(0, bodyVars.visibleRowEnd - bodyVars.visibleRowStart + 1),
    bufferRows: getTableParams().bufferRows,
    processedRows: getProcessedRows().value.length,
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

/**
 * 清除分组 清理所有分组
 * @returns {void}
 */
export const clearGroups = () => {
  clearHeaderGroups()
  clearBodyGroups()
  clearSummaryGroups()
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
  resetHeaderState()
  resetBodyState()
  resetSummaryRuntimeState()
  resetScrollState()
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
      // 同步重置原生滚动代理层的 DOM 位置，防止 canvas 与 scrollbar 脱同步
      getRuntimeState().scrollProxyResetHandler?.()
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
 * @desc 刷新滚动条区域。(保留空方法以防别处调用报错，因为代理模式下直接利用原生事件触发刷新)
 */
export const refreshScrollbarSection = () => {
  // Native proxy handles scrollbars
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
    const headerClipGroup = createHeaderClipGroup(0, 0, {
      x: 0,
      y: 0,
      width: stageWidth - columnsInfo.rightPartWidth,
      height: getTableParams().headerRowHeight
    })

    headerLayer.add(headerClipGroup)

    headerVars.leftHeaderGroup = createHeaderLeftGroup(0, 0)
    headerVars.centerHeaderGroup = createHeaderCenterGroup(-scrollbarVars.stageScrollX + columnsInfo.leftPartWidth, 0)
    headerVars.rightHeaderGroup = createHeaderRightGroup(stageWidth - columnsInfo.rightPartWidth, 0)

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
    const bodyClipGroupHeight = stageHeight - getTableParams().headerRowHeight - getSummaryRowHeight()
    const bodyClipGroupWidth = stageWidth - columnsInfo.leftPartWidth - columnsInfo.rightPartWidth
    const centerBodyClipGroup = createCenterBodyClipGroup(columnsInfo.leftPartWidth, getTableParams().headerRowHeight, {
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

    const leftBodyClipGroup = createLeftBodyClipGroup(0, getTableParams().headerRowHeight, {
      x: 0,
      y: 0,
      width: columnsInfo.leftPartWidth,
      height: bodyClipGroupHeight
    })

    const rightBodyClipGroup = createRightBodyClipGroup(
      stageWidth - columnsInfo.rightPartWidth,
      getTableParams().headerRowHeight,
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

    if (getTableParams().enableSummary) {
      const { width: stageWidth, height: stageHeight } = getStageSize()
      const y = stageHeight - getSummaryRowHeight()
      const centerSummaryClipGroup = createSummaryClipGroup(0, y, {
        x: 0,
        y: 0,
        width: stageWidth - columnsInfo.rightPartWidth,
        height: getSummaryRowHeight()
      })

      summaryLayer.add(centerSummaryClipGroup)

      summaryVars.leftSummaryGroup = createSummaryLeftGroup(0, y)
      summaryVars.centerSummaryGroup = createSummaryCenterGroup(
        -scrollbarVars.stageScrollX + columnsInfo.leftPartWidth,
        0
      )
      summaryVars.rightSummaryGroup = createSummaryRightGroup(stageWidth - columnsInfo.rightPartWidth, y)

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
  // 批量绘制所有层 - 按正确的渲染顺序
  scheduleLayersBatchDraw(['body', 'fixed', 'header', 'summary'])
  syncTablePerfSnapshot()
}

/**
 * 全局鼠标移动处理
 * @param {MouseEvent} mouseEvent - 鼠标事件
 */
const handleGlobalMouseMove = (mouseEvent: MouseEvent) => {
  if (!stageVars.stage) return
  stageVars.stage.setPointersPositions(mouseEvent)

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
    measureTablePerf('resizeColumn', () => {
      if (headerVars.resizingColumnName && headerVars.resizeTempWidth > 0) {
        updateTableColumnWidth(headerVars.resizingColumnName, headerVars.resizeTempWidth)
        refreshTable(false)
      }
      cleanupResizeState()
    })
    setPointerStyle(stageVars.stage, false, 'default')
  }
}

/**
 * 全局窗口尺寸变化处理（RAF 防抖：连续 resize 事件中只在最后一帧执行）
 * @returns {void}
 */
let _resizeRAFId: number | null = null

const handleGlobalResize = () => {
  if (_resizeRAFId !== null) {
    cancelAnimationFrame(_resizeRAFId)
  }
  _resizeRAFId = requestAnimationFrame(() => {
    _resizeRAFId = null
    measureTablePerf('windowResize', () => {
      initStage()
      clearGroups()
      rebuildGroups()
    })
  })
}

/**
 * 初始化全局事件监听器
 * @param {HTMLDivElement} container - 表格容器 DOM 元素，用于 ResizeObserver 监听
 * @returns {void}
 */
export const initStageListeners = (container: HTMLDivElement) => {
  const context = getCurrentTableContext()
  const listeners = getRuntimeState().listeners

  // ResizeObserver：监听容器自身尺寸变化（替代 window.resize，可捕获侧栏折叠、flex 布局变更等场景）
  let isFirstResize = true
  listeners.resizeObserver = new ResizeObserver(() => {
    // ResizeObserver 在 observe() 后会立即触发一次初始回调，跳过它
    if (isFirstResize) {
      isFirstResize = false
      return
    }
    runWithTableContext(context, handleGlobalResize)
  })
  listeners.resizeObserver.observe(container)

  listeners.mouseMove = (event) => runWithTableContext(context, () => handleGlobalMouseMove(event))
  listeners.mouseUp = (event) => runWithTableContext(context, () => handleGlobalMouseUp(event))

  // 需要保留鼠标移动监听以支持列宽拖拽功能
  window.addEventListener('mousemove', listeners.mouseMove)
  window.addEventListener('mouseup', listeners.mouseUp)
}

/**
 * 清理全局事件监听器
 * @returns {void}
 */
export const cleanupStageListeners = () => {
  // 取消防抖 RAF，防止组件销毁后仍执行 rebuildGroups
  if (_resizeRAFId !== null) {
    cancelAnimationFrame(_resizeRAFId)
    _resizeRAFId = null
  }
  const listeners = getRuntimeState().listeners
  if (listeners.resizeObserver) {
    listeners.resizeObserver.disconnect()
    listeners.resizeObserver = null
  }
  if (listeners.mouseMove) {
    window.removeEventListener('mousemove', listeners.mouseMove)
    listeners.mouseMove = null
  }
  if (listeners.mouseUp) {
    window.removeEventListener('mouseup', listeners.mouseUp)
    listeners.mouseUp = null
  }
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
    }
  })
}
