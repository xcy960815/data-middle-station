<template>
  <div id="table-container" class="table-container" :style="tableContainerStyle"></div>

  <!-- 过滤器下拉（多选） -->
  <teleport to="body">
    <div
      ref="filterDropdownRef"
      v-show="filterDropdown.visible"
      class="dms-filter-dropdown"
      :style="filterDropdownStyle"
    >
      <el-select
        v-model="filterDropdown.selectedValues"
        multiple
        filterable
        collapse-tags
        collapse-tags-tooltip
        size="small"
        placeholder="选择过滤值"
        style="width: 160px"
        @change="handleSelectedFilter"
        @blur="closeFilterDropdown"
        @keydown.stop
      >
        <el-option v-for="opt in filterDropdown.options" :key="opt" :label="opt === '' ? '(空)' : opt" :value="opt" />
      </el-select>
    </div>
  </teleport>
  <!-- 汇总行下拉（单选） -->
  <teleport to="body">
    <div
      ref="summaryDropdownRef"
      v-show="summaryDropdown.visible"
      class="dms-summary-dropdown"
      :style="summaryDropdownStyle"
    >
      <el-select
        v-model="summaryDropdown.selectedValue"
        size="small"
        placeholder="选择汇总"
        style="width: 160px"
        @change="handleSelectedSummary"
        @blur="closeSummaryDropdown"
        @keydown.stop
      >
        <el-option v-for="opt in summaryDropdown.options" :key="opt.value" :label="opt.label" :value="opt.value" />
      </el-select>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { ElOption, ElSelect } from 'element-plus'
import Konva from 'konva'
import { onBeforeUnmount, onMounted } from 'vue'
import { drawBodyHandler } from './draw-body'
import { drawSummaryHandler } from './draw-summary'
import { filterDropdownHandler } from './filter-dropdown-handler'
import { chartProps } from './props'
import { summaryDropDownHandler } from './summary-dropdown-handler'
import {
  adjustHexColorBrightness,
  clearGroups,
  constrainToRange,
  getFromPool,
  getTableContainerElement,
  getTextX,
  isTopMostInTable,
  paletteOptions,
  setPointerStyle,
  truncateText
} from './utils'
import { type KonvaNodePools, type PositionMap, createTableState, tableVars } from './variable'
/**
 * 创建或更新行和列的 hover 高亮矩形
 */
const updateHoverRects = () => {
  if (!tableVars.stage) return
  // 根据配置和当前悬停状态创建高亮效果
  if (props.enableRowHoverHighlight && tableVars.hoveredRowIndex !== null) {
    // 清除之前的高亮
    resetHighlightRects('row')
    getColOrRowHighlightRects('row', tableVars.hoveredRowIndex)
  } else {
    resetHighlightRects('row')
  }
  if (props.enableColHoverHighlight && tableVars.hoveredColIndex !== null) {
    // 清除之前的高亮
    resetHighlightRects('column')
    getColOrRowHighlightRects('column', tableVars.hoveredColIndex)
  } else {
    resetHighlightRects('column')
  }
}

/**
 * 重建分组
 * @returns {void}
 */
const rebuildGroups = () => {
  if (
    !tableVars.stage ||
    !tableVars.headerLayer ||
    !tableVars.bodyLayer ||
    !tableVars.fixedBodyLayer ||
    !tableVars.fixedHeaderLayer ||
    !tableVars.scrollbarLayer ||
    !tableVars.summaryLayer ||
    !tableVars.fixedSummaryLayer
  )
    return

  // 清空位置映射列表，准备重建
  tableVars.headerPositionMapList.length = 0
  tableVars.bodyPositionMapList.length = 0
  tableVars.summaryPositionMapList.length = 0

  const { leftCols, centerCols, rightCols, leftWidth, centerWidth, rightWidth } = getSplitColumns()
  const stageWidth = tableVars.stage.width()
  const stageHeight = tableVars.stage.height()
  const { maxScrollX, maxScrollY } = getScrollLimits()
  const verticalScrollbarSpace = maxScrollY > 0 ? props.scrollbarSize : 0
  const horizontalScrollbarSpace = maxScrollX > 0 ? props.scrollbarSize : 0

  if (!tableVars.centerBodyClipGroup) {
    const clipHeight = stageHeight - props.headerHeight - getSummaryRowHeight() - horizontalScrollbarSpace
    tableVars.centerBodyClipGroup = new Konva.Group({
      x: leftWidth,
      y: props.headerHeight,
      clip: {
        x: 0,
        y: 0,
        width: stageWidth - leftWidth - rightWidth - verticalScrollbarSpace,
        height: clipHeight
      }
    })
    tableVars.bodyLayer.add(tableVars.centerBodyClipGroup)
  }

  tableVars.leftHeaderGroup = new Konva.Group({ x: 0, y: 0, name: 'left-header-group' })

  tableVars.centerHeaderGroup = new Konva.Group({ x: leftWidth - tableVars.scrollX, y: 0, name: 'center-header-group' })

  tableVars.rightHeaderGroup = new Konva.Group({
    x: stageWidth - rightWidth - verticalScrollbarSpace,
    y: 0,
    name: 'right-header-group'
  })

  tableVars.leftBodyGroup = new Konva.Group({
    x: 0,
    y: props.headerHeight - tableVars.stageScrollY,
    name: 'left-body-group'
  })

  tableVars.centerBodyGroup = new Konva.Group({
    x: -tableVars.scrollX,
    y: -tableVars.stageScrollY,
    name: 'center-body-group'
  })

  tableVars.rightBodyGroup = new Konva.Group({
    x: stageWidth - rightWidth - verticalScrollbarSpace,
    y: props.headerHeight - tableVars.stageScrollY,
    name: 'right-body-group'
  })

  /**
   * 添加中心滚动表头到表头层（底层）
   */
  tableVars.headerLayer.add(tableVars.centerHeaderGroup)

  /**
   * 添加固定表头到固定表头层（顶层）
   */
  tableVars.fixedHeaderLayer.add(tableVars.leftHeaderGroup, tableVars.rightHeaderGroup)

  // 构建底部 summary 组（受开关控制）
  if (props.enableSummary) {
    const summaryY = stageHeight - getSummaryRowHeight() - horizontalScrollbarSpace
    tableVars.leftSummaryGroup = new Konva.Group({ x: 0, y: summaryY, name: 'left-summary-group' })

    tableVars.centerSummaryGroup = new Konva.Group({
      x: leftWidth - tableVars.scrollX,
      y: summaryY,
      name: 'center-summary-group'
    })

    tableVars.rightSummaryGroup = new Konva.Group({
      x: stageWidth - rightWidth - verticalScrollbarSpace,
      y: summaryY,
      name: 'right-summary-group'
    })
    // 中间 summary 放到底层，固定左右 summary 放顶层
    tableVars.summaryLayer.add(tableVars.centerSummaryGroup)
    tableVars.fixedSummaryLayer.add(tableVars.leftSummaryGroup, tableVars.rightSummaryGroup)
  } else {
    tableVars.leftSummaryGroup = null
    tableVars.centerSummaryGroup = null
    tableVars.rightSummaryGroup = null
  }

  /**
   * 添加中心滚动内容到剪辑组
   */
  tableVars.centerBodyClipGroup.add(tableVars.centerBodyGroup)

  /**
   * 添加固定列到固定层（顶层）
   */
  tableVars.fixedBodyLayer.add(tableVars.leftBodyGroup, tableVars.rightBodyGroup)

  tableVars.headerPositionMapList.length = 0
  /**
   * 绘制左侧表头部分
   */
  drawHeaderPart(tableVars.leftHeaderGroup, leftCols, 0, tableVars.headerPositionMapList, 0)
  /**
   * 绘制中间表头部分
   */
  drawHeaderPart(tableVars.centerHeaderGroup, centerCols, leftCols.length, tableVars.headerPositionMapList, leftWidth)
  /**
   * 绘制右侧表头部分
   */
  drawHeaderPart(
    tableVars.rightHeaderGroup,
    rightCols,
    leftCols.length + centerCols.length,
    tableVars.headerPositionMapList,
    leftWidth + centerWidth
  )

  tableVars.bodyPositionMapList.length = 0
  /**
   * 绘制左侧主体部分
   */
  drawBodyPart(tableVars.leftBodyGroup, leftCols, tableVars.leftBodyPools, 0, tableVars.bodyPositionMapList, 0)
  /**
   * 绘制中间主体部分
   */
  drawBodyPart(
    tableVars.centerBodyGroup,
    centerCols,
    tableVars.centerBodyPools,
    leftCols.length,
    tableVars.bodyPositionMapList,
    leftWidth
  )
  /**
   * 绘制右侧主体部分
   */
  drawBodyPart(
    tableVars.rightBodyGroup,
    rightCols,
    tableVars.rightBodyPools,
    leftCols.length + centerCols.length,
    tableVars.bodyPositionMapList,
    leftWidth + centerWidth
  )

  /**
   * 绘制底部 summary
   */
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

const props = defineProps(chartProps)

const {
  filterState,
  filterDropdownRef,
  filterDropdownStyle,
  filterDropdown,
  updateFilterDropdownPositions,
  closeFilterDropdown,
  handleFilterDropdownScroll,
  openFilterDropdown,
  handleSelectedFilter
} = filterDropdownHandler({ updateHoverRects, clearGroups, rebuildGroups })

const { tableData, sortColumns, activeData, tableColumns, tableContainerStyle } = createTableState({
  props,
  filterState
})

const {
  summaryState,
  summaryDropdownRef,
  summaryDropdownStyle,
  summaryDropdown,
  updateSummaryDropdownPositions,
  closeSummaryDropdown,
  getSummaryRowHeight,
  handleSummaryDropdownScroll,
  openSummaryDropdown,
  handleSelectedSummary
} = summaryDropDownHandler({ updateHoverRects, clearGroups, rebuildGroups, props })

const { drawSummaryPart } = drawSummaryHandler({ props, summaryState, activeData, openSummaryDropdown })

const { createHighlightRect, calculateVisibleRows, recoverKonvaNode, getScrollLimits, getSplitColumns } =
  drawBodyHandler({ props, activeData, tableColumns, getSummaryRowHeight })

/**
 * 定义事件
 */
const emits = defineEmits<{
  'cell-click': [{ rowIndex: number; colIndex: number; colKey: string; rowData: ChartDataVo.ChartData }]
  'action-click': [{ rowIndex: number; action: string; rowData: ChartDataVo.ChartData }]
  'render-chart-start': []
  'render-chart-end': []
}>()

/**
 * 判断坐标是否在表格区域内（排除滚动条区域）
 * @param clientX 客户端X坐标
 * @param clientY 客户端Y坐标
 * @returns 是否在表格区域内
 */
const isInTableArea = (clientX: number, clientY: number) => {
  if (!tableVars.stage) return false

  // 转换为 stage 坐标
  const pointerPosition = tableVars.stage.getPointerPosition()
  if (!pointerPosition) return false

  const stageWidth = tableVars.stage.width()
  const stageHeight = tableVars.stage.height()
  const { maxScrollX, maxScrollY } = getScrollLimits()

  // 计算表格有效区域（排除滚动条）
  const effectiveWidth = maxScrollY > 0 ? stageWidth - props.scrollbarSize : stageWidth
  const effectiveHeight = maxScrollX > 0 ? stageHeight - props.scrollbarSize : stageHeight

  return (
    pointerPosition.x >= 0 &&
    pointerPosition.x < effectiveWidth &&
    pointerPosition.y >= 0 &&
    pointerPosition.y < effectiveHeight
  )
}

/**
 * 点击外部关闭（允许点击 Element Plus 下拉面板）
 * @param e 鼠标事件
 * @returns {void}
 */
const onGlobalMousedown = (e: MouseEvent) => {
  if (tableVars.stage) tableVars.stage.setPointersPositions(e)
  if (!filterDropdown.visible && !summaryDropdown.visible) return
  const panel = filterDropdownRef.value
  const panelSummary = summaryDropdownRef.value
  const target = e.target as HTMLElement | null
  if (!target) return
  // 点击自身面板内：不关闭
  if ((panel && panel.contains(target)) || (panelSummary && panelSummary.contains(target))) return
  // 点击 el-select 下拉面板：不关闭
  const inElSelectDropdown = target.closest('.el-select-dropdown, .el-select__popper')
  if (!inElSelectDropdown) {
    filterDropdown.visible = false
    summaryDropdown.visible = false
  }
}

/**
 * 为按钮矩形绑定“原生按钮”式动效（hover/active 阴影与亮度变化）
 */
const bindButtonInteractions = (
  rect: Konva.Rect,
  options: {
    baseFill: string
    baseStroke: string
    layer: Konva.Layer | null
    disabled?: boolean
  }
) => {
  let isHovering = false
  const hoverFill = adjustHexColorBrightness(options.baseFill, 8)
  const activeFill = adjustHexColorBrightness(options.baseFill, -8)
  const original = { x: rect.x(), y: rect.y(), w: rect.width(), h: rect.height() }

  const applyNormal = () => {
    rect.fill(options.baseFill)
    rect.shadowOpacity(0)
    rect.shadowBlur(0)
    rect.shadowOffset({ x: 0, y: 0 })
    rect.to({ x: original.x, y: original.y, scaleX: 1, scaleY: 1, duration: 0.08, easing: Konva.Easings.EaseInOut })
    options.layer?.batchDraw()
  }
  const applyHover = () => {
    rect.fill(hoverFill)
    rect.shadowColor(options.baseFill)
    rect.shadowOpacity(0.25)
    rect.shadowBlur(8)
    rect.shadowOffset({ x: 0, y: 1 })
    rect.to({ x: original.x, y: original.y, scaleX: 1, scaleY: 1, duration: 0.08, easing: Konva.Easings.EaseInOut })
    options.layer?.batchDraw()
  }
  const applyActive = () => {
    rect.fill(activeFill)
    rect.shadowColor(options.baseFill)
    rect.shadowOpacity(0.2)
    rect.shadowBlur(4)
    rect.shadowOffset({ x: 0, y: 0 })
    const sx = 0.98
    const sy = 0.98
    const dx = (original.w * (1 - sx)) / 2
    const dy = (original.h * (1 - sy)) / 2
    rect.to({
      x: original.x + dx,
      y: original.y + dy,
      scaleX: sx,
      scaleY: sy,
      duration: 0.06,
      easing: Konva.Easings.EaseInOut
    })
    options.layer?.batchDraw()
  }

  // 清理旧事件并绑定
  rect.off('mouseenter.buttonfx')
  rect.off('mouseleave.buttonfx')
  rect.off('mousedown.buttonfx')
  rect.off('mouseup.buttonfx')

  if (options.disabled) {
    rect.opacity(0.6)
    rect.on('mouseenter.buttonfx', () => {
      setPointerStyle(tableVars.stage, false, 'not-allowed')
    })
    rect.on('mouseleave.buttonfx', () => {
      setPointerStyle(tableVars.stage, false, 'default')
    })
    return
  }

  rect.opacity(1)
  rect.on('mouseenter.buttonfx', () => {
    isHovering = true
    setPointerStyle(tableVars.stage, true, 'pointer')
    applyHover()
  })
  rect.on('mouseleave.buttonfx', () => {
    isHovering = false
    setPointerStyle(tableVars.stage, false, 'default')
    applyNormal()
  })
  rect.on('mousedown.buttonfx', () => {
    applyActive()
  })
  rect.on('mouseup.buttonfx', () => {
    if (isHovering) applyHover()
    else applyNormal()
  })
}

/**
 * 处理单元格点击，更新选中状态并抛出事件
 * @param {number} rowIndex 行索引
 * @param {number} colIndex 列索引
 * @param {GroupStore.GroupOption | DimensionStore.DimensionOption} col 列配置
 * @param {number} cellX 单元格 X 坐标
 * @param {number} cellY 单元格 Y 坐标
 * @param {number} cellWidth 单元格宽度
 * @param {number} cellHeight 单元格高度
 * @param {Konva.Group} group 分组
 */
const handleCellClick = (
  rowIndex: number,
  colIndex: number,
  col: GroupStore.GroupOption | DimensionStore.DimensionOption,
  cellX: number,
  cellY: number,
  cellWidth: number,
  cellHeight: number,
  group: Konva.Group
) => {
  tableVars.selectedCell = { rowIndex, colIndex, colKey: col.columnName }
  if (rowIndex >= tableVars.visibleRowStart && rowIndex <= tableVars.visibleRowEnd) {
    createHighlightRect(cellX, cellY, cellWidth, cellHeight, group)
  } else if (tableVars.highlightRect) {
    tableVars.highlightRect.destroy()
    tableVars.highlightRect = null
  }

  const rowData = activeData.value[rowIndex]
  emits('cell-click', { rowIndex, colIndex, colKey: col.columnName, rowData })
}

/**
 * 初始化state
 * @returns {void}
 */
const initStage = () => {
  emits('render-chart-start')

  // 等待demo节点发生变更再触发该方法

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

  // 创建汇总图层与固定汇总图层（位于滚动条层之下）
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
 * 创建滚动条
 */
const createScrollbars = () => {
  if (!tableVars.stage || !tableVars.scrollbarLayer) return
  const stageWidth = tableVars.stage.width()
  const stageHeight = tableVars.stage.height()
  const { maxScrollX, maxScrollY } = getScrollLimits()

  if (maxScrollY > 0) {
    // 绘制垂直滚动条顶部遮罩
    const verticalScrollbarHeaderMask = new Konva.Rect({
      x: stageWidth - props.scrollbarSize,
      y: 0,
      width: props.scrollbarSize,
      height: props.headerHeight,
      fill: props.headerBackground,
      stroke: '', // 移除边框，避免与表头边框冲突
      strokeWidth: 0
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
    const thumbX = leftWidth + (tableVars.scrollX / maxScrollX) * (visibleWidth - thumbWidth)

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
 * 绘制表头部分
 * @param group 分组
 * @param cols 列
 * @param startColIndex 起始列索引
 * @param positionMapList 位置映射列表
 * @param startX 起始 X 坐标
 */
const drawHeaderPart = (
  headerGroup: Konva.Group | null,
  headerCols: Array<GroupStore.GroupOption | DimensionStore.DimensionOption>,
  startColIndex: number,
  positionMapList: PositionMap[],
  stageStartX: number
) => {
  if (!headerGroup) return

  const headerGroupWidth = headerCols.reduce((acc, c) => acc + (c.width || 0), 0)
  const headerBackgroundRect = new Konva.Rect({
    x: 0,
    y: 0,
    width: headerGroupWidth,
    height: props.headerHeight,
    fill: props.headerBackground
  })

  headerGroup.add(headerBackgroundRect)

  let x = 0
  headerCols.forEach((col, colIndex) => {
    const headerCellRect = new Konva.Rect({
      x,
      y: 0,
      width: col.width || 0,
      height: props.headerHeight,
      stroke: props.borderColor,
      strokeWidth: 1,
      listening: false
    })
    headerCellRect.setAttr('col-index', colIndex + startColIndex)
    headerCellRect.setAttr('row-index', 0)
    headerGroup.add(headerCellRect)
    // 记录表头单元格位置信息（使用舞台坐标）
    positionMapList.push({
      x: stageStartX + x,
      y: 0,
      width: col.width || 0,
      height: props.headerHeight,
      rowIndex: 0,
      colIndex: colIndex + startColIndex
    })

    // 如果该列当前参与排序，则给表头单元格一个高亮背景（多列排序）
    const isSortColumn = sortColumns.value.find((s) => s.columnName === col.columnName)
    headerCellRect.fill(isSortColumn ? props.headerSortActiveBackground : props.headerBackground)

    // 预留右侧区域（排序箭头 + 过滤图标），避免与文本重叠
    // 预留约 40px 给右侧图标
    const maxTextWidth = (col.width || 0) - 40
    const fontFamily = props.headerFontFamily
    const fontSize = typeof props.headerFontSize === 'string' ? parseFloat(props.headerFontSize) : props.headerFontSize
    const displayName = col.displayName || col.columnName
    const truncatedTitle = truncateText(displayName, maxTextWidth, fontSize, fontFamily)
    const headerCellText = new Konva.Text({
      x: getTextX(x),
      y: props.headerHeight / 2,
      text: truncatedTitle,
      fontSize: fontSize,
      fontFamily: fontFamily,
      fill: props.headerTextColor,
      align: col.align || 'left',
      verticalAlign: 'middle',
      listening: false
    })
    headerCellText.offsetY(headerCellText.height() / 2)
    headerGroup.add(headerCellText)

    const centerY = props.headerHeight / 2

    // 如果用户当前列开启排序
    if (col.sortable) {
      // 排序箭头（三角形 ▲/▼），更紧凑与清晰（多列排序）
      const foundSort = sortColumns.value.find((s) => s.columnName === col.columnName)
      const inactiveColor = '#C0C4CC'
      const upColor = foundSort?.order === 'asc' ? props.sortableColor : inactiveColor
      const downColor = foundSort?.order === 'desc' ? props.sortableColor : inactiveColor

      // 右侧预留区域：排序箭头 + 过滤图标（加大横向间距）
      const arrowX = x + (col.width || 0) - 34

      const arrowSize = 5
      const gap = 2
      // 上三角（升序 asc）
      const upTriangle = new Konva.RegularPolygon({
        x: arrowX,
        y: centerY - (arrowSize + gap) / 2,
        sides: 3,
        radius: arrowSize,
        rotation: 0,
        fill: upColor,
        listening: true
      })
      // 下三角（降序 desc）
      const downTriangle = new Konva.RegularPolygon({
        x: arrowX,
        y: centerY + (arrowSize + gap) / 2,
        sides: 3,
        radius: arrowSize,
        rotation: 180,
        fill: downColor,
        listening: true
      })
      headerGroup.add(upTriangle)
      headerGroup.add(downTriangle)

      // 排序箭头也显示小手
      upTriangle.on('mouseenter', () => setPointerStyle(tableVars.stage, true, 'pointer'))
      upTriangle.on('mouseleave', () => setPointerStyle(tableVars.stage, false, 'default'))
      downTriangle.on('mouseenter', () => setPointerStyle(tableVars.stage, true, 'pointer'))
      downTriangle.on('mouseleave', () => setPointerStyle(tableVars.stage, false, 'default'))

      // 排序箭头点击事件：只在点击箭头时触发排序
      const handleSortClick = (event: Konva.KonvaEventObject<MouseEvent>, order: 'asc' | 'desc') => {
        if (tableVars.isResizingColumn) return
        const e = event.evt
        const hasModifier = !!(e && (e.shiftKey || e.ctrlKey || e.metaKey))
        const idx = sortColumns.value.findIndex((s) => s.columnName === col.columnName)

        if (hasModifier) {
          // 多列模式：在原序列中追加/切换/移除该列
          if (idx === -1) {
            sortColumns.value = [...sortColumns.value, { columnName: col.columnName, order }]
          } else {
            const next = [...sortColumns.value]
            if (next[idx].order === order) {
              // 如果点击的是相同顺序，则移除该列
              next.splice(idx, 1)
            } else {
              // 否则切换到新顺序
              next[idx] = { columnName: col.columnName, order }
            }
            sortColumns.value = next
          }
        } else {
          // 单列模式：仅对当前列循环 asc -> desc -> remove
          if (idx === -1) {
            sortColumns.value = [{ columnName: col.columnName, order }]
          } else if (sortColumns.value[idx].order === order) {
            // 如果点击的是相同顺序，则移除该列
            sortColumns.value = []
          } else {
            // 否则切换到新顺序
            sortColumns.value = [{ columnName: col.columnName, order }]
          }
        }
        clearGroups()
        rebuildGroups()
      }

      // 升序事件（点击箭头）
      upTriangle.on('click', (evt) => handleSortClick(evt, 'asc'))
      // 降序事件（点击箭头）
      downTriangle.on('click', (evt) => handleSortClick(evt, 'desc'))
    }

    // 如果用户当前列开启过滤
    if (col.filterable) {
      const hasFilter = !!(filterState[col.columnName] && filterState[col.columnName].size > 0)
      const filterColor = hasFilter ? props.sortableColor : '#C0C4CC'
      const filterX = x + (col.width || 0) - 12
      // 绘制过滤器图标（漏斗形状）
      const filterIcon = new Konva.Shape({
        x: filterX - 6,
        y: centerY - 6,
        width: 16,
        height: 16,
        listening: true,
        name: `filter-icon-${col.columnName}`,
        sceneFunc: (context, shape) => {
          context.beginPath()
          // 漏斗上边缘（宽）
          context.moveTo(2, 2)
          context.lineTo(14, 2)
          // 漏斗中间收缩部分
          context.lineTo(11, 7)
          context.lineTo(11, 12)
          // 漏斗下边缘（窄）
          context.lineTo(5, 12)
          context.lineTo(5, 7)
          context.closePath()

          context.fillStrokeShape(shape)
        },
        stroke: filterColor,
        strokeWidth: 1.5,
        fill: hasFilter ? filterColor : 'transparent'
      })
      // 鼠标进入图标时，显示手型
      filterIcon.on('mouseenter', () => setPointerStyle(tableVars.stage, true, 'pointer'))
      // 鼠标离开图标时，恢复默认指针
      filterIcon.on('mouseleave', () => setPointerStyle(tableVars.stage, false, 'default'))

      headerGroup.add(filterIcon)

      // 点击图标：以 DOM 下拉框方式展示可选值
      filterIcon.on('click', (evt) => {
        const values = new Set<string>()
        tableData.value.forEach((r) => values.add(String(r[col.columnName] ?? '')))
        const options = Array.from(values)
        const current = filterState[col.columnName] ? Array.from(filterState[col.columnName]!) : []
        const optionUnion = Array.from(new Set<string>([...options, ...current]))
        openFilterDropdown(evt, col.columnName, optionUnion, current)
      })
    }

    // 列宽拖拽手柄（位于单元格右边缘，优先响应）
    const RESIZER_WIDTH = 6
    const resizer = new Konva.Rect({
      x: x + (col.width || 0) - RESIZER_WIDTH / 2,
      y: 0,
      width: RESIZER_WIDTH,
      height: props.headerHeight,
      fill: 'transparent',
      listening: true,
      draggable: false,
      name: `col-resizer-${col.columnName}`
    })
    headerGroup.add(resizer)

    resizer.on('mouseenter', () => setPointerStyle(tableVars.stage, true, 'col-resize'))
    resizer.on('mouseleave', () => {
      if (!tableVars.isResizingColumn) setPointerStyle(tableVars.stage, false, 'default')
    })
    // 鼠标按下时，开始拖拽列宽
    resizer.on('mousedown', (evt) => {
      tableVars.isResizingColumn = true
      tableVars.resizingColumnName = col.columnName
      tableVars.resizeStartX = evt.evt.clientX
      tableVars.resizeStartWidth = col.width || 0
      // 找到同组内紧随其后的列，作为跟随调整的邻居列
      const neighbor = headerCols[colIndex + 1]
      if (neighbor) {
        tableVars.resizeNeighborColumnName = neighbor.columnName
        tableVars.resizeNeighborStartWidth = neighbor.width || 0
      } else {
        tableVars.resizeNeighborColumnName = null
        tableVars.resizeNeighborStartWidth = 0
      }
      setPointerStyle(tableVars.stage, true, 'col-resize')
    })

    x += col.width || 0
  })
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
    tableVars.dragStartScrollX = tableVars.scrollX
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

const drawBackgroundRect = (
  bodyGroup: Konva.Group,
  bodyCols: Array<GroupStore.GroupOption | DimensionStore.DimensionOption>,
  pools: KonvaNodePools,
  rowIndex: number
) => {
  // 分组总宽度
  const groupTotalWidth = bodyCols.reduce((acc, c) => acc + (c.width || 0), 0)
  const backgroundRect = getFromPool(
    pools.backgroundRects,
    () => new Konva.Rect({ listening: false, name: 'background-rect' })
  )
  // y坐标
  const y = rowIndex * props.bodyRowHeight
  backgroundRect.name('background-rect')
  backgroundRect.setAttr('row-index', null)
  backgroundRect.setAttr('col-index', null)
  backgroundRect.x(0)
  backgroundRect.y(y)
  backgroundRect.width(groupTotalWidth)
  backgroundRect.height(props.bodyRowHeight)
  const backgroundColor = rowIndex % 2 === 0 ? props.bodyBackgroundOdd : props.bodyBackgroundEven
  backgroundRect.fill(backgroundColor)
  bodyGroup.add(backgroundRect)
  backgroundRect.moveToBottom()
}

/**
 *
 * 画body区域 只渲染可视区域的行
 * @param {Konva.Group | null} group 分组
 * @param {Array<GroupStore.GroupOption | DimensionStore.DimensionOption>} cols 列
 * @param {ObjectPools} pools 对象池
 * @param {number} startColIndex 起始列索引
 * @param {PositionMap[]} positionMapList 位置映射列表
 * @param {number} stageStartX 舞台起始X坐标
 * @returns {void}
 */
const drawBodyPart = (
  bodyGroup: Konva.Group | null,
  bodyCols: Array<GroupStore.GroupOption | DimensionStore.DimensionOption>,
  pools: KonvaNodePools,
  startColIndex: number,
  positionMapList: PositionMap[],
  stageStartX: number
) => {
  if (!tableVars.stage || !bodyGroup) return

  calculateVisibleRows()

  recoverKonvaNode(bodyGroup, pools)

  // 渲染可视区域的行
  for (let rowIndex = tableVars.visibleRowStart; rowIndex <= tableVars.visibleRowEnd; rowIndex++) {
    const row = activeData.value[rowIndex]
    // 绘制背景矩形
    drawBackgroundRect(bodyGroup, bodyCols, pools, rowIndex)
    // y坐标
    const y = rowIndex * props.bodyRowHeight
    // 渲染每列的单元格
    let x = 0
    for (let colIndex = 0; colIndex < bodyCols.length; colIndex++) {
      const col = bodyCols[colIndex]

      const hasSpanMethod = typeof props.spanMethod === 'function'
      let spanRow = 1
      let spanCol = 1
      let coveredBySpanMethod = false
      const globalColIndex = tableColumns.value.findIndex((c) => c.columnName === col.columnName)
      if (hasSpanMethod) {
        const res = props.spanMethod({ row, column: col, rowIndex, colIndex: globalColIndex })
        if (Array.isArray(res)) {
          spanRow = Math.max(0, Number(res[0]) || 0)
          spanCol = Math.max(0, Number(res[1]) || 0)
        } else if (res && typeof res === 'object') {
          spanRow = Math.max(0, Number(res.rowspan) || 0)
          spanCol = Math.max(0, Number(res.colspan) || 0)
        }
        // 只要任一维度为 0，即视为被合并覆盖（与常见表格合并语义一致）
        if (spanRow === 0 || spanCol === 0) coveredBySpanMethod = true
      }

      const shouldDraw = !hasSpanMethod || !coveredBySpanMethod

      if (!shouldDraw) {
        x += col.width || 0
        continue
      }

      const computedRowSpan = hasSpanMethod ? spanRow : 1

      const cellHeight = computedRowSpan * props.bodyRowHeight

      // 计算合并单元格的宽度（此处暂未实现跨列合并的宽度累加，保持原逻辑）
      let cellWidth = col.width || 0

      // 记录可视区域内主体单元格位置信息（使用舞台坐标）
      positionMapList.push({
        x: stageStartX + x,
        y: y + props.headerHeight,
        width: cellWidth,
        height: cellHeight,
        rowIndex: rowIndex + 1,
        colIndex: colIndex + startColIndex
      })
      // 若为合并单元格（跨行或跨列），在行斑马纹之上绘制统一背景色，避免内部出现条纹断层
      if (hasSpanMethod && (computedRowSpan > 1 || spanCol > 1)) {
        const mergedCellRect = getFromPool(
          pools.backgroundRects,
          () => new Konva.Rect({ listening: false, name: 'merged-cell-rect' })
        )
        mergedCellRect.name('merged-cell-rect')
        mergedCellRect.setAttr('row-index', rowIndex + 1)
        mergedCellRect.setAttr('col-index', colIndex + startColIndex)
        mergedCellRect.x(x)
        mergedCellRect.y(y)
        mergedCellRect.width(cellWidth)
        mergedCellRect.height(cellHeight)
        // 使用起始行的背景色以保持整体风格一致
        mergedCellRect.fill(rowIndex % 2 === 0 ? props.bodyBackgroundOdd : props.bodyBackgroundEven)
        mergedCellRect.stroke(props.borderColor)
        mergedCellRect.strokeWidth(1)
        bodyGroup.add(mergedCellRect)

        // 在合并单元格中绘制文本
        const rawValue = row && typeof row === 'object' ? row[col.columnName] : undefined
        const value = String(rawValue ?? '')
        const maxTextWidth = cellWidth - 16
        const fontFamily = props.bodyFontFamily
        const fontSize = typeof props.bodyFontSize === 'string' ? parseFloat(props.bodyFontSize) : props.bodyFontSize
        const truncatedValue = truncateText(value, maxTextWidth, fontSize, fontFamily)
        const mergedCellText = getFromPool(
          pools.mergedCellTexts,
          () => new Konva.Text({ listening: false, name: 'merged-cell-text' })
        )
        mergedCellText.name('merged-cell-text')
        mergedCellText.setAttr('row-index', null)
        mergedCellText.setAttr('col-index', null)
        mergedCellText.x(getTextX(x))
        mergedCellText.y(y + cellHeight / 2)
        mergedCellText.text(truncatedValue)
        mergedCellText.fontSize(fontSize)
        mergedCellText.fontFamily(fontFamily)
        // 填充文字颜色
        mergedCellText.fill(props.bodyTextColor)
        mergedCellText.align('left')
        mergedCellText.verticalAlign('middle')
        mergedCellText.offsetY(mergedCellText.height() / 2)
        bodyGroup.add(mergedCellText)
      } else {
        const cellRect = getFromPool(pools.cellRects, () => new Konva.Rect({ listening: true, name: 'cell-rect' }))
        cellRect.name('cell-rect')
        cellRect.setAttr('row-index', rowIndex + 1)
        cellRect.setAttr('col-index', colIndex + startColIndex)
        cellRect.x(x)
        cellRect.y(y)
        cellRect.width(cellWidth)
        cellRect.height(cellHeight)
        cellRect.stroke(props.borderColor)
        cellRect.strokeWidth(1)

        // 清除之前的事件监听器
        cellRect.off('click')

        // 添加点击事件
        cellRect.on('click', () => {
          // 默认不启用"相同值合并"，因此不需要基于跨度推断点击行
          handleCellClick(rowIndex, colIndex, col, cellRect.x(), cellRect.y(), cellWidth, cellHeight, bodyGroup)
        })

        bodyGroup.add(cellRect)

        // 如果是操作列，绘制按钮；否则绘制文本
        if (col.columnName === 'action') {
          const actions = col.actions
          const gap = 6
          const buttonHeight = Math.max(22, Math.min(28, cellHeight - 8))
          const fontSize = typeof props.bodyFontSize === 'string' ? parseFloat(props.bodyFontSize) : props.bodyFontSize
          // 估算单个按钮宽度基于文本长度
          const estimateButtonWidth = (text: string) => {
            const temp = new Konva.Text({
              text,
              fontSize: fontSize,
              fontFamily: props.bodyFontFamily
            })
            const w = temp.width() + 16
            temp.destroy()
            return constrainToRange(w, 48, 120)
          }

          if (actions && actions.length > 0) {
            const widths = actions.map((a) => estimateButtonWidth(a.label))
            const totalButtonsWidth = widths.reduce((a, b) => a + b, 0) + gap * (actions.length - 1)
            let startX = x + (cellWidth - totalButtonsWidth) / 2
            const centerY = y + (cellHeight - buttonHeight) / 2
            actions.forEach((action, idx) => {
              const w = widths[idx]
              const theme = paletteOptions[action.type || 'primary'] || paletteOptions.primary
              const buttonRect = getFromPool(
                pools.backgroundRects,
                () => new Konva.Rect({ listening: true, name: `button-rect` })
              )
              buttonRect.off('click')
              buttonRect.off('mouseenter')
              buttonRect.off('mouseleave')
              // 按钮矩形不应携带行/列索引，避免被误纳入 hover 高亮集合
              buttonRect.setAttr('row-index', null)
              buttonRect.setAttr('col-index', null)
              buttonRect.x(startX)
              buttonRect.y(centerY)
              buttonRect.width(w)
              buttonRect.height(buttonHeight)
              buttonRect.cornerRadius(4)
              buttonRect.fill(theme.fill)
              buttonRect.stroke(theme.stroke)
              buttonRect.strokeWidth(1)
              const isDisabled =
                typeof action.disabled === 'function'
                  ? action.disabled(activeData.value[rowIndex], rowIndex)
                  : !!action.disabled
              bindButtonInteractions(buttonRect, {
                baseFill: theme.fill,
                baseStroke: theme.stroke,
                layer: bodyGroup.getLayer(),
                disabled: isDisabled
              })
              buttonRect.on('click', () => {
                if (isDisabled) return
                const rowData = activeData.value[rowIndex]
                emits('action-click', { rowIndex, action: action.key, rowData })
              })
              bodyGroup.add(buttonRect)
              const fontSize =
                typeof props.bodyFontSize === 'string' ? parseFloat(props.bodyFontSize) : props.bodyFontSize
              const buttonText = getFromPool(
                pools.cellTexts,
                () => new Konva.Text({ listening: false, name: 'button-text' })
              )
              buttonText.x(startX + w / 2)
              buttonText.y(centerY + buttonHeight / 2)
              buttonText.text(action.label)
              buttonText.fontSize(fontSize)
              buttonText.fontFamily(props.bodyFontFamily)
              buttonText.fill(theme.text)
              buttonText.opacity(isDisabled ? 0.6 : 1)
              buttonText.align('center')
              buttonText.verticalAlign('middle')
              buttonText.offset({ x: buttonText.width() / 2, y: buttonText.height() / 2 })
              bodyGroup.add(buttonText)

              startX += w + gap
            })
          }
        } else {
          // 创建文本
          const rawValue = row && typeof row === 'object' ? row[col.columnName] : undefined
          const value = String(rawValue ?? '')
          const maxTextWidth = cellWidth - 16
          const fontFamily = props.bodyFontFamily
          const fontSize = typeof props.bodyFontSize === 'string' ? parseFloat(props.bodyFontSize) : props.bodyFontSize

          const truncatedValue = truncateText(value, maxTextWidth, fontSize, fontFamily)

          const cellText = getFromPool(pools.cellTexts, () => new Konva.Text({ listening: false, name: 'cell-text' }))
          cellText.name('cell-text')
          cellText.setAttr('row-index', null)
          cellText.setAttr('col-index', null)
          cellText.x(getTextX(x))
          cellText.y(y + cellHeight / 2)
          cellText.text(truncatedValue)
          cellText.fontSize(fontSize)
          cellText.fontFamily(fontFamily)
          cellText.fill(props.bodyTextColor)
          cellText.align('left')
          cellText.verticalAlign('middle')
          cellText.offsetY(cellText.height() / 2)
          bodyGroup.add(cellText)

          const colShowOverflow = col.showOverflowTooltip
          const enableTooltip = colShowOverflow !== undefined ? colShowOverflow : false
          if (enableTooltip && truncatedValue !== value) {
            // 悬浮提示：仅在文本被截断时创建 Konva.Tooltip 等价层
            // 这里用浏览器原生 title 实现，命中区域为单元格矩形
            // Konva 没有内置 tooltip，避免复杂度，先用 title
            cellRect.off('mouseenter.tooltip')
            cellRect.on('mouseenter.tooltip', () => {
              if (!tableVars.stage) return
              // 设置 container 的 title
              tableVars.stage.container().setAttribute('title', String(rawValue ?? ''))
            })
            cellRect.off('mouseleave.tooltip')
            cellRect.on('mouseleave.tooltip', () => {
              if (!tableVars.stage) return
              // 清除 title，避免全局悬浮
              tableVars.stage.container().removeAttribute('title')
            })
          }
        }
      }
      x += col.width || 0
    }
  }

  // 检查是否需要重新创建高亮（选中的单元格在当前可视区域内）
  // if (selectedCell && selectedCell.rowIndex >= visibleRowStart && selectedCell.rowIndex <= visibleRowEnd) {
  //   // 找到选中的列在当前组中的位置
  //   const selectedColIndex = bodyCols.findIndex((col) => col.columnName === selectedCell!.colKey)
  //   if (selectedColIndex >= 0) {
  //     // 计算高亮位置
  //     let highlightX = 0
  //     for (let i = 0; i < selectedColIndex; i++) {
  //       highlightX += bodyCols[i].width || 0
  //     }
  //     const col = bodyCols[selectedColIndex]
  //     // 默认宽/高
  //     let highlightWidth = col.width || 0
  //     let highlightY = selectedCell!.rowIndex * props.bodyRowHeight
  //     let highlightHeight = props.bodyRowHeight

  //     // 若存在 spanMethod，以其为准
  //     if (typeof props.spanMethod === 'function') {
  //       const res = props.spanMethod({
  //         row: activeData.value[selectedCell!.rowIndex],
  //         column: col,
  //         rowIndex: selectedCell!.rowIndex,
  //         // 选中高亮也应传全局列索引
  //         colIndex: tableColumns.value.findIndex((c) => c.columnName === col.columnName)
  //       })
  //       let spanRow = 1
  //       let spanCol = 1
  //       if (Array.isArray(res)) {
  //         spanRow = Math.max(0, Number(res[0]) || 0)
  //         spanCol = Math.max(0, Number(res[1]) || 0)
  //       } else if (res && typeof res === 'object') {
  //         spanRow = Math.max(0, Number(res.rowspan) || 0)
  //         spanCol = Math.max(0, Number(res.colspan) || 0)
  //       }
  //       if (spanRow > 0 && spanCol > 0) {
  //         const drawEnd = Math.min(selectedCell!.rowIndex + spanRow - 1, visibleRowEnd)
  //         highlightHeight = (drawEnd - selectedCell!.rowIndex + 1) * props.bodyRowHeight
  //         // 计算跨列宽度
  //         let acc = 0
  //         for (let c = selectedColIndex; c < Math.min(selectedColIndex + spanCol, bodyCols.length); c++) {
  //           acc += bodyCols[c].width || 0
  //         }
  //         highlightWidth = acc
  //       }
  //     }
  //     // 重新创建高亮
  //     createHighlightRect(highlightX, highlightY, highlightWidth, highlightHeight, bodyGroup)
  //   }
  // }
  // 渲染完成后，重新计算 行下标 列下标
  recomputeHoverIndexFromPointer()
}

/**
 * 基于当前指针位置重新计算 行下标 列下标
 * @returns {void}
 */
const recomputeHoverIndexFromPointer = () => {
  if (
    !tableVars.stage ||
    (!props.enableRowHoverHighlight && !props.enableColHoverHighlight) ||
    filterDropdown.visible ||
    summaryDropdown.visible
  ) {
    return
  }

  // 清除高亮的辅助函数
  const clearHoverHighlight = () => {
    if (tableVars.hoveredRowIndex !== null || tableVars.hoveredColIndex !== null) {
      tableVars.hoveredRowIndex = null
      tableVars.hoveredColIndex = null
      updateHoverRects()
    }
  }

  // 检查各种边界条件，如果不符合则清除高亮并返回
  if (!isTopMostInTable(tableVars.lastClientX, tableVars.lastClientY)) {
    clearHoverHighlight()
    return
  }

  const pointerPosition = tableVars.stage.getPointerPosition()
  if (!pointerPosition) {
    clearHoverHighlight()
    return
  }

  /**
   * 检查鼠标是否在表格区域内（排除滚动条区域）
   */
  if (!isInTableArea(tableVars.lastClientX, tableVars.lastClientY)) {
    clearHoverHighlight()
    return
  }

  const localY = pointerPosition.y + tableVars.stageScrollY
  const localX = pointerPosition.x + tableVars.scrollX
  // 计算鼠标所在的行索引
  const positionMapList = [
    ...tableVars.headerPositionMapList,
    ...tableVars.bodyPositionMapList,
    ...tableVars.summaryPositionMapList
  ]
  const positionOption = positionMapList.find(
    (item) => localX >= item.x && localX <= item.x + item.width && localY >= item.y && localY <= item.y + item.height
  )
  let newHoveredRowIndex = null
  let newHoveredColIndex = null
  if (positionOption) {
    newHoveredRowIndex = positionOption.rowIndex
    newHoveredColIndex = positionOption.colIndex
  }
  const rowChanged = newHoveredRowIndex !== tableVars.hoveredRowIndex
  const colChanged = newHoveredColIndex !== tableVars.hoveredColIndex
  if (rowChanged) {
    tableVars.hoveredRowIndex = newHoveredRowIndex
  }
  if (colChanged) {
    tableVars.hoveredColIndex = newHoveredColIndex
  }

  if (rowChanged || colChanged) {
    updateHoverRects()
  }
}

/**
 * 清除所有高亮效果
 * @param type 类型：row 行，column 列
 * @returns {void}
 */
const resetHighlightRects = (type: 'row' | 'column') => {
  if (!tableVars.stage) return
  if (type === 'row') {
    tableVars.rowHighlightRects?.forEach((rect) => {
      rect.fill(null)
    })
    tableVars.rowHighlightRects = null
  } else {
    tableVars.colHighlightRects?.forEach((rect) => {
      rect.fill(null)
    })
    tableVars.colHighlightRects = null
  }
}

/**
 * 获取指定行需要高亮的所有矩形
 * @param rowIndex 行索引
 * @returns 矩形数组
 */
const getColOrRowHighlightRects = (type: 'row' | 'column', index: number) => {
  // 初始化高亮矩形数组
  if (type === 'row') {
    if (!tableVars.rowHighlightRects) tableVars.rowHighlightRects = []
  } else {
    if (!tableVars.colHighlightRects) tableVars.colHighlightRects = []
  }

  const allGroups = [
    tableVars.leftHeaderGroup,
    tableVars.centerHeaderGroup,
    tableVars.rightHeaderGroup,
    tableVars.leftBodyGroup,
    tableVars.centerBodyGroup,
    tableVars.rightBodyGroup,
    tableVars.leftSummaryGroup,
    tableVars.centerSummaryGroup,
    tableVars.rightSummaryGroup
  ]
  allGroups.forEach((group) => {
    if (!group) return
    group.children.forEach((child) => {
      if (!(child instanceof Konva.Rect)) return
      // 排除非单元格矩形：行背景与操作按钮
      const nodeName = child.name?.() || ''
      if (nodeName === 'background-rect' || nodeName === 'action-button' || nodeName.startsWith?.('action-button-'))
        return
      if (type === 'row') {
        // 检查行索引
        const attr = child.getAttr('row-index')
        if (typeof attr === 'number' && attr === index) {
          // 避免重复添加
          if (!tableVars.rowHighlightRects!.includes(child)) {
            tableVars.rowHighlightRects!.push(child)
          }
        }
      } else {
        // 检查列索引
        const attr = child.getAttr('col-index')
        if (typeof attr === 'number' && attr === index) {
          // 避免重复添加
          if (!tableVars.colHighlightRects!.includes(child)) {
            tableVars.colHighlightRects!.push(child)
          }
        }
      }
    })
  })

  // 应用高亮效果
  applyHighlightToAllRects()
}

/**
 * 应用高亮效果到所有相关矩形
 */
const applyHighlightToAllRects = () => {
  // 首先处理行高亮
  if (tableVars.rowHighlightRects) {
    tableVars.rowHighlightRects.forEach((rect) => {
      rect.fill(props.highlightRowBackground)
    })
  }

  // 然后处理列高亮
  if (tableVars.colHighlightRects) {
    tableVars.colHighlightRects.forEach((rect) => {
      rect.fill(props.highlightColBackground)
    })
  }

  // 最后处理交叉矩形：找到既在行高亮数组又在列高亮数组的矩形
  if (
    tableVars.rowHighlightRects &&
    tableVars.colHighlightRects &&
    tableVars.hoveredRowIndex !== null &&
    tableVars.hoveredColIndex !== null
  ) {
    // 寻找交叉矩形：同时具有当前行和列索引的矩形
    const allGroups = [
      tableVars.leftHeaderGroup,
      tableVars.centerHeaderGroup,
      tableVars.rightHeaderGroup,
      tableVars.leftBodyGroup,
      tableVars.centerBodyGroup,
      tableVars.rightBodyGroup,
      tableVars.leftSummaryGroup,
      tableVars.centerSummaryGroup,
      tableVars.rightSummaryGroup
    ]

    allGroups.forEach((group) => {
      if (!group) return
      group.children.forEach((child) => {
        if (!(child instanceof Konva.Rect)) return
        const rowAttr = child.getAttr('row-index')
        const colAttr = child.getAttr('col-index')

        // 如果这个矩形是交叉矩形（同时具有当前行和列索引）
        if (
          typeof rowAttr === 'number' &&
          typeof colAttr === 'number' &&
          rowAttr === tableVars.hoveredRowIndex &&
          colAttr === tableVars.hoveredColIndex
        ) {
          // 使用交叉高亮颜色（这里可以设计一个混合色或者使用列高亮色）
          child.fill(props.highlightColBackground)
        }
      })
    })
  }
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
  }

  const bodyY = props.headerHeight - tableVars.stageScrollY
  const centerY = -tableVars.stageScrollY

  // 固定列和中间列随垂直滚动
  tableVars.leftBodyGroup.y(bodyY)
  tableVars.rightBodyGroup.y(bodyY)
  tableVars.centerBodyGroup.y(centerY)
  updateScrollbars()
  recomputeHoverIndexFromPointer()
  updateHoverRects()

  tableVars.bodyLayer?.batchDraw()
  tableVars.fixedBodyLayer?.batchDraw()
  tableVars.summaryLayer?.batchDraw()
  tableVars.fixedSummaryLayer?.batchDraw()
}

/**
 * 更新水平滚动
 * @param offsetX 滚动偏移量
 */
const updateHorizontalScroll = (offsetX: number) => {
  if (!tableVars.stage || !tableVars.centerHeaderGroup || !tableVars.centerBodyGroup) return
  const { maxScrollX } = getScrollLimits()
  const { leftWidth } = getSplitColumns()
  tableVars.scrollX = constrainToRange(tableVars.scrollX + offsetX, 0, maxScrollX)

  const headerX = leftWidth - tableVars.scrollX
  const centerX = -tableVars.scrollX

  // 中间区域随横向滚动
  tableVars.centerHeaderGroup.x(headerX)
  tableVars.centerBodyGroup.x(centerX)
  tableVars.centerSummaryGroup?.x(headerX)

  updateScrollbars()

  tableVars.headerLayer?.batchDraw()
  tableVars.bodyLayer?.batchDraw()
  tableVars.summaryLayer?.batchDraw()
  // tableVars.fixedSummaryLayer?.batchDraw()
  recomputeHoverIndexFromPointer()
  updateHoverRects()
  // 横向滚动时更新弹框位置
  updateFilterDropdownPositions()
  updateSummaryDropdownPositions()
}

/**
 * 更新滚动条
 */
const updateScrollbars = () => {
  if (!tableVars.stage) return

  const stageWidth = tableVars.stage.width()
  const stageHeight = tableVars.stage.height()
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
    const thumbX = leftWidth + (tableVars.scrollX / maxScrollX) * (visibleWidth - thumbWidth)
    tableVars.horizontalScrollbarThumb.x(thumbX)
  }

  tableVars.scrollbarLayer?.batchDraw()
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

/**
 * 处理鼠标移动事件
 * @param {MouseEvent} e 鼠标移动事件
 * @returns {void}
 */
const handleMouseMove = (e: MouseEvent) => {
  if (!tableVars.stage) return
  tableVars.stage.setPointersPositions(e)
  if (filterDropdown.visible || summaryDropdown.visible) return

  // 记录鼠标在屏幕中的坐标
  tableVars.lastClientX = e.clientX
  tableVars.lastClientY = e.clientY

  /**
   * 列宽拖拽中：实时更新覆盖宽度并重建分组
   */
  if (tableVars.isResizingColumn && tableVars.resizingColumnName) {
    const delta = e.clientX - tableVars.resizeStartX
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

  /**
   * 垂直滚动
   */
  if (tableVars.isDraggingVerticalThumb) {
    const deltaY = e.clientY - tableVars.dragStartY
    // 添加容错机制：只有当垂直移动距离超过阈值时才触发滚动
    const scrollThreshold = props.scrollThreshold
    if (Math.abs(deltaY) < scrollThreshold) return

    const { maxScrollY } = getScrollLimits()
    const stageHeight = tableVars.stage.height()
    const trackHeight =
      stageHeight -
      props.headerHeight -
      getSummaryRowHeight() -
      (getScrollLimits().maxScrollX > 0 ? props.scrollbarSize : 0)
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
      Math.abs(tableVars.stageScrollY - oldScrollY) > props.bodyRowHeight * 2

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
    }

    updateScrollPositions()
  }

  /**
   * 水平滚动
   */
  if (tableVars.isDraggingHorizontalThumb) {
    const deltaX = e.clientX - tableVars.dragStartX
    // 添加容错机制：只有当水平移动距离超过阈值时才触发滚动
    const scrollThreshold = props.scrollThreshold
    if (Math.abs(deltaX) < scrollThreshold) return
    const { maxScrollX } = getScrollLimits()
    const { leftWidth, rightWidth, centerWidth } = getSplitColumns()
    const stageWidth = tableVars.stage.width()
    const visibleWidth = stageWidth - leftWidth - rightWidth - props.scrollbarSize
    const thumbWidth = Math.max(20, (visibleWidth * visibleWidth) / centerWidth)
    const scrollRatio = deltaX / (visibleWidth - thumbWidth)
    const newScrollX = tableVars.dragStartScrollX + scrollRatio * maxScrollX

    tableVars.scrollX = constrainToRange(newScrollX, 0, maxScrollX)
    updateScrollPositions()
  }

  /**
   * 普通移动时，更新 hoveredRowIndex 和 hoveredColIndex
   */
  if (!tableVars.isDraggingVerticalThumb && !tableVars.isDraggingHorizontalThumb) {
    recomputeHoverIndexFromPointer()
  }
}

/**
 * 处理鼠标抬起事件
 * @param {MouseEvent} e 鼠标抬起事件
 * @returns {void}
 */
const handleMouseUp = (e: MouseEvent) => {
  if (tableVars.stage) tableVars.stage.setPointersPositions(e)
  /**
   * 滚动条拖拽结束
   */
  if (tableVars.isDraggingVerticalThumb || tableVars.isDraggingHorizontalThumb) {
    tableVars.isDraggingVerticalThumb = false
    tableVars.isDraggingHorizontalThumb = false
    setPointerStyle(tableVars.stage, false, 'default')
    if (tableVars.verticalScrollbarThumb && !tableVars.isDraggingVerticalThumb)
      tableVars.verticalScrollbarThumb.fill(props.scrollbarThumb)
    if (tableVars.horizontalScrollbarThumb && !tableVars.isDraggingHorizontalThumb)
      tableVars.horizontalScrollbarThumb.fill(props.scrollbarThumb)
    tableVars.scrollbarLayer?.batchDraw()
  }

  /**
   * 列宽拖拽结束
   */
  if (tableVars.isResizingColumn) {
    tableVars.isResizingColumn = false
    tableVars.resizingColumnName = null
    tableVars.resizeNeighborColumnName = null
    setPointerStyle(tableVars.stage, false, 'default')
    // 结束拖拽后，强制重建，确保汇总行列宽与表头同步
    clearGroups()
    rebuildGroups()
  }
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
  const centerX = -tableVars.scrollX
  const headerX = leftWidth - tableVars.scrollX
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

  updateScrollbars()
  tableVars.headerLayer?.batchDraw()
  tableVars.bodyLayer?.batchDraw()
  tableVars.fixedBodyLayer?.batchDraw()
  tableVars.fixedHeaderLayer?.batchDraw()
  tableVars.summaryLayer?.batchDraw()
  tableVars.fixedSummaryLayer?.batchDraw()

  // 滚动时更新弹框位置
  // updateFilterDropdownPositions()
  // updateSummaryDropdownPositions()
}

/**
 * 处理窗口大小改变
 * @returns {void}
 */
const handleResize = () => {
  initStage()
  calculateVisibleRows()
  clearGroups()
  rebuildGroups()
}

/**
 * 从 props 初始化 初始化表格
 * @param {boolean} resetScroll 是否重置滚动状态
 * @returns {void}
 */
const refreshTable = (resetScroll: boolean) => {
  /**
   * 重置滚动状态
   */
  if (resetScroll) {
    tableVars.scrollX = 0
    tableVars.stageScrollY = 0
  } else {
    /**
     * 在不重置时，保证滚动值在新范围内
     */
    const { maxScrollX, maxScrollY } = getScrollLimits()
    tableVars.scrollX = constrainToRange(tableVars.scrollX, 0, maxScrollX)
    tableVars.stageScrollY = constrainToRange(tableVars.stageScrollY, 0, maxScrollY)
  }

  calculateVisibleRows()
  clearGroups()
  rebuildGroups()
}

/**
 * 监听 props 变化
 */
watch(
  () => [props.xAxisFields, props.yAxisFields, props.data],
  () => {
    if (!tableVars.stage) return
    refreshTable(true)
  },
  { deep: true }
)

watch(
  () => [props.chartWidth, props.chartHeight],
  async () => {
    if (!tableVars.stage) return
    // 等待demo节点发生变更再触发该方法
    await nextTick()
    initStage()
    refreshTable(true)
  }
)

/**
 * header 相关（尺寸与样式）
 */
watch(
  () => [
    props.headerHeight,
    props.headerFontFamily,
    props.headerFontSize,
    props.headerTextColor,
    props.headerBackground,
    props.headerSortActiveBackground
  ],
  () => {
    if (!tableVars.stage) return
    refreshTable(false)
  }
)

/**
 * body 相关（行高与样式）
 */
watch(
  () => [
    props.bodyRowHeight,
    props.bodyBackgroundOdd,
    props.bodyBackgroundEven,
    props.borderColor,
    props.bodyTextColor,
    props.bodyFontSize,
    props.bodyFontFamily
  ],
  () => {
    if (!tableVars.stage) return
    refreshTable(false)
  }
)

/**
 * 汇总行相关
 */
watch(
  () => [
    props.enableSummary,
    props.summaryHeight,
    props.summaryFontFamily,
    props.summaryFontSize,
    props.summaryBackground,
    props.summaryTextColor
  ],
  () => {
    if (!tableVars.stage) return
    refreshTable(false)
  }
)

/**
 * 滚动条相关（样式与尺寸）
 */
watch(
  () => [props.scrollbarBackground, props.scrollbarThumb, props.scrollbarThumbHover, props.scrollbarSize],
  () => {
    if (!tableVars.stage) return
    refreshTable(false)
  }
)

/**
 * 交互相关（悬浮高亮、排序指示等）
 */
watch(
  () => [
    props.enableRowHoverHighlight,
    props.enableColHoverHighlight,
    props.sortableColor,
    props.highlightCellBackground
  ],
  () => {
    if (!tableVars.stage) return
    refreshTable(false)
  }
)

/**
 * 虚拟滚动/性能相关
 */
watch(
  () => [props.bufferRows, props.scrollThreshold],
  () => {
    if (!tableVars.stage) return
    refreshTable(false)
  }
)

/**
 * 挂载
 * @returns {void}
 */
onMounted(() => {
  initStage()
  refreshTable(true)
  window.addEventListener('mousedown', onGlobalMousedown, true)
  const tableContainer = getTableContainerElement()
  tableContainer?.addEventListener('wheel', handleMouseWheel, { passive: false })
  window.addEventListener('resize', handleResize)
  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('mouseup', handleMouseUp)
  // 添加滚动监听器，监听页面滚动
  window.addEventListener('scroll', handleFilterDropdownScroll)
  window.addEventListener('scroll', handleSummaryDropdownScroll)
  document.addEventListener('scroll', handleFilterDropdownScroll)
  document.addEventListener('scroll', handleSummaryDropdownScroll)
})

/**
 * 卸载
 */
onBeforeUnmount(() => {
  window.removeEventListener('mousedown', onGlobalMousedown, true)
  const tableContainer = getTableContainerElement()
  tableContainer?.removeEventListener('wheel', handleMouseWheel)
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('mouseup', handleMouseUp)
  // 移除滚动监听器
  window.removeEventListener('scroll', handleFilterDropdownScroll)
  window.removeEventListener('scroll', handleSummaryDropdownScroll)
  document.removeEventListener('scroll', handleFilterDropdownScroll)
  document.removeEventListener('scroll', handleSummaryDropdownScroll)

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
  tableVars.selectedCell = null
  tableVars.highlightRect = null
})
</script>

<style lang="scss" scoped>
.table-container {
  position: relative;
}

.dms-filter-dropdown,
.dms-summary-dropdown {
  background: #fff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  border: 1px solid #ebeef5;
  padding: 5px 8px;
  border-radius: 4px;
}
</style>
