<template>
  <div id="table-container" class="table-container" :style="tableContainerStyle"></div>

  <!-- 过滤器下拉（多选） -->
  <FilterDropdown
    :visible="filterDropdown.visible"
    :options="filterDropdown.options"
    :selected-values="filterDropdown.selectedValues"
    :position="filterDropdownPosition"
    @change="handleSelectedFilter"
    @close="closeFilterDropdown"
  />

  <!-- 汇总行下拉（单选） -->
  <SummaryDropdown
    :visible="summaryDropdown.visible"
    :options="summaryDropdown.options"
    :selected-value="summaryDropdown.selectedValue"
    :position="summaryDropdownPosition"
    @change="handleSelectedSummary"
    @close="closeSummaryDropdown"
  />

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
import { computed, nextTick, onBeforeUnmount, onMounted, watch } from 'vue'
import CellEditor from './cell-editor.vue'
import { editorDropdownHandler } from './dropdown/editor-dropdown-handler'
import { filterDropdownHandler } from './dropdown/filter-dropdown-handler'
import { summaryDropDownHandler } from './dropdown/summary-dropdown-handler'
import type { ChartEmits } from './emits'
import FilterDropdown from './filter-dropdown.vue'
import { konvaStageHandler } from './konva-stage-handler'
import { chartProps } from './props'
import { renderBodyHandler } from './render/render-body-handler'
import { renderScrollbarsHandler } from './render/render-scrollbars-handler'
import SummaryDropdown from './summary-dropdown.vue'
import { variableHandlder } from './variable-handlder'

const props = defineProps(chartProps)

/**
 * 定义事件
 */
const emits = defineEmits<ChartEmits>()

const { tableVars, tableContainerStyle, handleTableData, handleTableColumns } = variableHandlder({ props })

const { initStage, destroyStage, refreshTable, initStageListeners, cleanupStageListeners } = konvaStageHandler({
  props,
  emits
})

renderBodyHandler({ props, emits })

const { initWheelListener, cleanupWheelListener } = renderScrollbarsHandler({ props, emits })

const {
  filterDropdownRef,
  filterDropdownStyle,
  filterDropdown,
  closeFilterDropdown,
  handleSelectedFilter,
  initFilterDropdownListeners,
  cleanupFilterDropdownListeners
} = filterDropdownHandler({ props })

const {
  summaryDropdownRef,
  summaryDropdownStyle,
  summaryDropdown,
  closeSummaryDropdown,
  handleSelectedSummary,
  initSummaryDropdownListeners,
  cleanupSummaryDropdownListeners
} = summaryDropDownHandler({ props })

const {
  cellEditorDropdown,
  closeCellEditorDropdown,
  handleCellEditorSave,
  initCellEditorListeners,
  cleanupCellEditorListeners
} = editorDropdownHandler({ props, emits })

// 计算下拉框位置
const filterDropdownPosition = computed(() => {
  if (!filterDropdownStyle.value) return { x: 0, y: 0 }
  const left = parseInt(filterDropdownStyle.value.left as string)
  const top = parseInt(filterDropdownStyle.value.top as string)
  return { x: left, y: top }
})

const summaryDropdownPosition = computed(() => {
  if (!summaryDropdownStyle.value) return { x: 0, y: 0 }
  const left = parseInt(summaryDropdownStyle.value.left as string)
  const top = parseInt(summaryDropdownStyle.value.top as string)
  return { x: left, y: top }
})

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

onMounted(() => {
  handleTableColumns(props.xAxisFields, props.yAxisFields)
  initStage()
  handleTableData(props.data)
  refreshTable(true)
  initWheelListener()
  initStageListeners()
  initFilterDropdownListeners()
  initSummaryDropdownListeners()
  initCellEditorListeners()
})

onBeforeUnmount(() => {
  cleanupWheelListener()
  cleanupStageListeners()
  cleanupFilterDropdownListeners()
  cleanupSummaryDropdownListeners()
  cleanupCellEditorListeners()
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
