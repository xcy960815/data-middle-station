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

  <!-- 单元格编辑器 -->
  <CellEditor
    :visible="cellEditorDropdown.visible"
    :edit-type="cellEditorDropdown.editType"
    :edit-options="cellEditorDropdown.editOptions"
    :initial-value="cellEditorDropdown.initialValue"
    :position="cellEditorDropdown.position"
    @save="handleCellEditorSave"
    @close="closeCellEditorDropdown"
  />
</template>

<script setup lang="ts">
import { ElOption, ElSelect } from 'element-plus'
import { onBeforeUnmount, onMounted } from 'vue'
import CellEditor from './cell-editor.vue'
import { editorDropdownHandler } from './dropdown/editor-dropdown-handler'
import { filterDropdownHandler } from './dropdown/filter-dropdown-handler'
import { summaryDropDownHandler } from './dropdown/summary-dropdown-handler'
import type { ChartEmits } from './emits'
import { konvaStageHandler } from './konva-stage-handler'
import { chartProps } from './props'
import { renderBodyHandler } from './render/render-body-handler'
import { renderScrollbarsHandler } from './render/render-scrollbars-handler'
import { constrainToRange, setPointerStyle } from './utils'
import { tableVars, variableHandlder } from './variable-handlder'

const props = defineProps(chartProps)

/**
 * 定义事件
 */
const emits = defineEmits<ChartEmits>()

const { tableContainerStyle, tableData, handleTableData, handleTableColumns } = variableHandlder({ props })

const { initStage, destroyStage, clearGroups, rebuildGroups } = konvaStageHandler({ props, emits })

// const { drawHeaderPart } = renderHeaderHandler({ props, emits })

const { drawBodyPart, recomputeHoverIndexFromPointer } = renderBodyHandler({ props, emits })

// const { drawSummaryPart } = renderSummaryHandler({ props })

const { createScrollbars, updateScrollPositions } = renderScrollbarsHandler({ props, emits })

const { filterDropdownRef, filterDropdownStyle, filterDropdown, closeFilterDropdown, handleSelectedFilter } =
  filterDropdownHandler({ props, emits })

const {
  summaryDropdownRef,
  summaryDropdownStyle,
  summaryDropdown,
  closeSummaryDropdown,
  getSummaryRowHeight,
  handleSelectedSummary
} = summaryDropDownHandler({ props })

const { cellEditorDropdown, closeCellEditorDropdown, resetCellEditorDropdown } = editorDropdownHandler({ props })

/**
 * 保存单元格编辑
 */
const handleCellEditorSave = (newValue: string | number) => {
  const { rowIndex, colKey, column } = cellEditorDropdown.editingCell
  if (rowIndex >= 0 && colKey && column) {
    const rowData = tableData.value[rowIndex]
    const oldValue = rowData[colKey]
    // 更新数据
    rowData[colKey] = newValue
    // 发送编辑事件
    emits('cell-edit', { rowIndex, colKey, rowData })
    clearGroups()
    rebuildGroups()
  }
  resetCellEditorDropdown()
}

const { calculateVisibleRows, getScrollLimits, getSplitColumns } = renderBodyHandler({ props, emits })

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
   * 手动拖拽导致的垂直滚动
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
   * 手动拖拽导致的水平滚动
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

    tableVars.stageScrollX = constrainToRange(newScrollX, 0, maxScrollX)
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
 * 处理窗口大小改变
 * @returns {void}
 */
const handleWindowResize = () => {
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
 * 监听 props 变化
 */
watch(
  () => [props.xAxisFields, props.yAxisFields, props.data],
  () => {
    if (!tableVars.stage) return
    handleTableColumns(props.xAxisFields, props.yAxisFields)
    handleTableData(props.data)
    refreshTable(true)
  },
  {
    deep: true
  }
)

watch(
  () => [props.chartWidth, props.chartHeight],
  async () => {
    if (!tableVars.stage) return
    // 等待demo节点发生变更再触发该方法
    await nextTick()
    initStage()
    handleTableData(props.data)
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
  handleTableColumns(props.xAxisFields, props.yAxisFields)
  initStage()
  handleTableData(props.data)
  refreshTable(true)

  window.addEventListener('resize', handleWindowResize)
  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('mouseup', handleMouseUp)
})

/**
 * 卸载
 */
onBeforeUnmount(() => {
  window.removeEventListener('resize', handleWindowResize)
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('mouseup', handleMouseUp)
  destroyStage()
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
