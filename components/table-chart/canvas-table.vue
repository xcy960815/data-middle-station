<template>
  <div id="table-container" class="table-container" :style="tableContainerStyle"></div>

  <!-- 过滤器下拉组件 -->
  <filter-dropdown
    :visible="filterDropdown.visible"
    :options="filterDropdown.options"
    :selected-values="filterDropdown.selectedValues"
    :dropdown-style="filterDropdownStyle"
    @change="handleSelectedFilter"
    @blur="closeFilterDropdown"
  />

  <!-- 汇总下拉组件 -->
  <summary-dropdown
    :visible="summaryDropdown.visible"
    :options="summaryDropdown.options"
    :selected-value="summaryDropdown.selectedValue"
    :dropdown-style="summaryDropdownStyle"
    @change="handleSelectedSummary"
    @blur="closeSummaryDropdown"
  />

  <!-- 单元格编辑器 -->
  <cell-editor
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
import { nextTick, onBeforeUnmount, onMounted, watch } from 'vue'
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

const { tableVars, tableContainerStyle, handleTableData, handleTableColumns, sortColumns } = variableHandlder({ props })

const { initStage, destroyStage, refreshTable, initStageListeners, cleanupStageListeners } = konvaStageHandler({
  props,
  emits
})

renderBodyHandler({ props, emits })

const { initWheelListener, cleanupWheelListener } = renderScrollbarsHandler({ props, emits })

// 注释过滤功能以提升性能
const {
  filterDropdownRef,
  filterDropdownStyle,
  filterDropdown,
  closeFilterDropdown,
  handleSelectedFilter,
  initFilterDropdownListeners,
  cleanupFilterDropdownListeners
} = filterDropdownHandler({ props })

// 注释汇总功能以提升性能
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
    props.headerRowHeight,
    props.headerFontFamily,
    props.headerFontSize,
    props.headerTextColor,
    props.headerBackground
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
 * 汇总行相关 - 注释以提升性能
 */
watch(
  () => [
    props.enableSummary,
    props.summaryRowHeight,
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
 * 交互相关（排序指示等） - 注释高亮相关以提升性能
 */
watch(
  () => [
    // props.enableRowHoverHighlight, // 注释以提升性能
    // props.enableColHoverHighlight, // 注释以提升性能
    props.sortActiveColor,
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
  () => [props.bufferRows],
  () => {
    if (!tableVars.stage) return
    refreshTable(false)
  }
)

/**
 * 排序状态变化时重新渲染表格
 */
watch(
  () => sortColumns.value,
  () => {
    if (!tableVars.stage) return
    refreshTable(false)
  },
  {
    deep: true
  }
)

onMounted(() => {
  handleTableColumns(props.xAxisFields, props.yAxisFields)
  initStage()
  handleTableData(props.data)
  refreshTable(true)
  initWheelListener()
  initStageListeners()
  // initFilterDropdownListeners() // 注释过滤功能
  // initSummaryDropdownListeners() // 注释汇总功能
  initCellEditorListeners()
})

onBeforeUnmount(() => {
  cleanupWheelListener()
  cleanupStageListeners()
  // cleanupFilterDropdownListeners() // 注释过滤功能
  // cleanupSummaryDropdownListeners() // 注释汇总功能
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
