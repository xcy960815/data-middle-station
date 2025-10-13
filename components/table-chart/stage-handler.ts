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
  createHeaderCenterGroup,
  createHeaderClipGroup,
  createHeaderLeftGroup,
  createHeaderRightGroup,
  drawHeaderPart,
  filterDropdownRef,
  headerVars
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
import { clearPool, getTableContainer, setPointerStyle } from './utils'

/**
 * 更新列宽调整指示线（直接调用，不使用 RAF 节流）
 * @returns {void}
 */
const updateResizeIndicator = () => {
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

/**
 * 清除分组 清理所有分组
 * @returns {void}
 */
export const clearGroups = () => {
  // 表头相关
  headerVars.headerLayer?.destroyChildren()

  // 主体相关
  bodyVars.bodyLayer?.destroyChildren()
  bodyVars.fixedBodyLayer?.destroyChildren()
  // 清理 Body 对象池
  clearPool(bodyVars.leftBodyPools.cellRects)
  clearPool(bodyVars.leftBodyPools.cellTexts)
  clearPool(bodyVars.centerBodyPools.cellRects)
  clearPool(bodyVars.centerBodyPools.cellTexts)
  clearPool(bodyVars.rightBodyPools.cellRects)
  clearPool(bodyVars.rightBodyPools.cellTexts)
  // 重置单元格选择与虚拟滚动状态
  bodyVars.highlightRect = null
  bodyVars.visibleRowStart = 0
  bodyVars.visibleRowEnd = 0
  bodyVars.visibleRowCount = 0

  // 汇总相关
  summaryVars.summaryLayer?.destroyChildren()
  summaryVars.leftSummaryGroup = null
  summaryVars.centerSummaryGroup = null
  summaryVars.rightSummaryGroup = null

  // 滚动条相关
  scrollbarVars.scrollbarLayer?.destroyChildren()
  scrollbarVars.verticalScrollbarGroup = null
  scrollbarVars.horizontalScrollbarGroup = null
  scrollbarVars.verticalScrollbarThumb = null
  scrollbarVars.horizontalScrollbarThumb = null
}

/**
 * 初始化 Stage 和所有 Layer
 * @returns {void}
 */
export const initStage = () => {
  const tableContainer = getTableContainer()
  if (!tableContainer) return
  const width = tableContainer.clientWidth
  const height = tableContainer.clientHeight

  if (!stageVars.stage) {
    stageVars.stage = new Konva.Stage({ container: tableContainer, width, height })
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

  // ========== 滚动条相关 ==========

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
  if (resetScroll) {
    scrollbarVars.stageScrollX = 0
    scrollbarVars.stageScrollY = 0
  }
  clearGroups()
  rebuildGroups()
}

/**
 * 重建表头分组
 * @returns {void}
 */
const rebuildHeaderGroup = () => {
  if (!headerVars.headerLayer) return
  const { width: stageWidth } = getStageSize()
  const { maxVerticalScroll } = calculateScrollRange()
  const verticalScrollbarWidth = maxVerticalScroll > 0 ? staticParams.scrollbarSize : 0
  // 为中间表头也创建裁剪组，防止表头横向滚动时遮挡固定列
  const headerClipGroup = createHeaderClipGroup(0, 0, {
    x: 0,
    y: 0,
    width: stageWidth - columnsInfo.rightPartWidth - verticalScrollbarWidth,
    height: staticParams.headerRowHeight
  })

  headerVars.headerLayer.add(headerClipGroup)

  headerVars.leftHeaderGroup = createHeaderLeftGroup(0, 0)
  headerVars.centerHeaderGroup = createHeaderCenterGroup(-scrollbarVars.stageScrollX + columnsInfo.leftPartWidth, 0)
  headerVars.rightHeaderGroup = createHeaderRightGroup(
    stageWidth - columnsInfo.rightPartWidth - verticalScrollbarWidth,
    0
  )

  headerClipGroup.add(headerVars.centerHeaderGroup)

  headerVars.headerLayer.add(headerVars.leftHeaderGroup, headerVars.rightHeaderGroup)

  // 绘制表头
  drawHeaderPart(headerVars.leftHeaderGroup, columnsInfo.leftColumns)
  drawHeaderPart(headerVars.centerHeaderGroup, columnsInfo.centerColumns)
  drawHeaderPart(headerVars.rightHeaderGroup, columnsInfo.rightColumns)
}

/**
 * 重建主体分组
 * @returns {void}
 */
const rebuildBodyGroup = () => {
  if (!bodyVars.bodyLayer || !bodyVars.fixedBodyLayer) return
  const { width: stageWidth, height: stageHeight } = getStageSize()
  const { maxHorizontalScroll, maxVerticalScroll } = calculateScrollRange()
  const verticalScrollbarWidth = maxVerticalScroll > 0 ? staticParams.scrollbarSize : 0
  const horizontalScrollbarHeight = maxHorizontalScroll > 0 ? staticParams.scrollbarSize : 0
  // 为中间可滚动区域创建裁剪组，防止遮挡固定列
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

  bodyVars.bodyLayer.add(centerBodyClipGroup)
  bodyVars.leftBodyGroup = createBodyLeftGroup(0, 0) // 现在相对于裁剪组，初始位置为0
  bodyVars.centerBodyGroup = createBodyCenterGroup(-scrollbarVars.stageScrollX, -scrollbarVars.stageScrollY)
  bodyVars.rightBodyGroup = createBodyRightGroup(0, 0) // 现在相对于裁剪组，初始位置为0

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

  // 调整左右body组的位置，使其相对于裁剪组
  bodyVars.leftBodyGroup.x(0)
  bodyVars.leftBodyGroup.y(-scrollbarVars.stageScrollY)
  bodyVars.rightBodyGroup.x(0)
  bodyVars.rightBodyGroup.y(-scrollbarVars.stageScrollY)

  bodyVars.fixedBodyLayer.add(leftBodyClipGroup, rightBodyClipGroup) // 添加裁剪组到固定层

  // 计算可视行范围
  calculateVisibleRows()

  // 主体相关 - 绘制所有主体部分
  drawBodyPart(bodyVars.leftBodyGroup, columnsInfo.leftColumns, bodyVars.leftBodyPools)
  drawBodyPart(bodyVars.centerBodyGroup, columnsInfo.centerColumns, bodyVars.centerBodyPools)
  drawBodyPart(bodyVars.rightBodyGroup, columnsInfo.rightColumns, bodyVars.rightBodyPools)
}

/**
 * 重建汇总分组
 * @returns {void}
 */
const rebuildSummaryGroup = () => {
  if (!summaryVars.summaryLayer) return

  // 创建汇总行组（完全参考header的实现方式）
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

    summaryVars.summaryLayer.add(centerSummaryClipGroup)

    summaryVars.leftSummaryGroup = createSummaryLeftGroup(0, y) // 直接定位到汇总行位置
    summaryVars.centerSummaryGroup = createSummaryCenterGroup(
      -scrollbarVars.stageScrollX + columnsInfo.leftPartWidth,
      0
    )
    summaryVars.rightSummaryGroup = createSummaryRightGroup(
      stageWidth - columnsInfo.rightPartWidth - verticalScrollbarWidth,
      y
    )

    centerSummaryClipGroup.add(summaryVars.centerSummaryGroup)
    summaryVars.summaryLayer.add(summaryVars.leftSummaryGroup, summaryVars.rightSummaryGroup)

    drawSummaryPart(summaryVars.leftSummaryGroup, columnsInfo.leftColumns)
    drawSummaryPart(summaryVars.centerSummaryGroup, columnsInfo.centerColumns)
    drawSummaryPart(summaryVars.rightSummaryGroup, columnsInfo.rightColumns)
  } else {
    summaryVars.leftSummaryGroup = null
    summaryVars.centerSummaryGroup = null
    summaryVars.rightSummaryGroup = null
  }
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
    // Account for vertical scrollbar only if present
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

  // 列宽调整结束 - 应用最终宽度
  if (headerVars.isResizingColumn) {
    // 应用最终宽度
    const allFields = [...staticParams.xAxisFields, ...staticParams.yAxisFields]
    const targetField = allFields.find((f) => f.columnName === headerVars.resizingColumnName)

    if (targetField && headerVars.resizeTempWidth > 0) {
      targetField.width = headerVars.resizeTempWidth
      // 会触发watch 走重新渲染表格的逻辑
    }

    // 清理调整指示线
    if (headerVars.resizeIndicatorLine) {
      headerVars.resizeIndicatorLine.destroy()
      headerVars.resizeIndicatorLine = null
      headerVars.headerLayer?.batchDraw()
    }

    // 重置状态
    headerVars.isResizingColumn = false
    headerVars.resizingColumnName = null
    headerVars.resizeTempWidth = 0
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
