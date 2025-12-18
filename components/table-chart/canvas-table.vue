<template>
  <div id="table-container" :title="title" class="table-container" :style="tableContainerStyle"></div>
  <!-- 过滤器下拉组件 -->
  <filter-dropdown ref="filterDropdownRef" />
  <!-- 汇总下拉组件 -->
  <summary-dropdown ref="summaryDropdownRef" />
  <!-- 单元格编辑器组件 -->
  <cell-editor ref="cellEditorRef" />
</template>
<script lang="ts" setup>
import { computed, nextTick, onMounted, onUnmounted, watch } from 'vue'
import { cellEditorRef } from './body-handler'
import CellEditor from './components/cell-editor.vue'
import FilterDropdown from './components/filter-dropdown.vue'
import SummaryDropdown from './components/summary-dropdown.vue'
import { handleTableData, sortColumns } from './data-handler'
import { filterDropdownRef } from './header-handler'
import { staticParams, tableProps } from './parameter'
import { cleanupWheelListener, initWheelListener } from './scrollbar-handler'
import {
  cleanupStageListeners,
  destroyStage,
  initStage,
  initStageListeners,
  refreshTable,
  stageVars
} from './stage-handler'
import { summaryDropdownRef } from './summary-handler'
const props = defineProps(tableProps)

/**
 * 表格容器样式
 */
const tableContainerStyle = computed(() => {
  const height = typeof props.chartHeight === 'number' ? `${props.chartHeight}px` : (props.chartHeight ?? '460px')
  const width = typeof props.chartWidth === 'number' ? `${props.chartWidth}px` : (props.chartWidth ?? '100%')
  return {
    height,
    width,
    background: '#fff'
  }
})

/**
 * 监听所有的props
 */
watch(
  props,
  () => {
    // 使用类型安全的属性赋值
    if (props.title !== undefined) staticParams.title = props.title
    if (props.data !== undefined) staticParams.data = props.data
    if (props.xAxisFields !== undefined) staticParams.xAxisFields = props.xAxisFields
    if (props.yAxisFields !== undefined) staticParams.yAxisFields = props.yAxisFields
    if (props.enableSummary !== undefined) staticParams.enableSummary = props.enableSummary
    if (props.bufferRows !== undefined) staticParams.bufferRows = props.bufferRows
    if (props.minAutoColWidth !== undefined) staticParams.minAutoColWidth = props.minAutoColWidth
    if (props.highlightCellBackground !== undefined)
      staticParams.highlightCellBackground = props.highlightCellBackground
    if (props.highlightRowBackground !== undefined) staticParams.highlightRowBackground = props.highlightRowBackground
    if (props.highlightColBackground !== undefined) staticParams.highlightColBackground = props.highlightColBackground
    if (props.headerRowHeight !== undefined) staticParams.headerRowHeight = props.headerRowHeight
    if (props.resizerWidth !== undefined) staticParams.resizerWidth = props.resizerWidth
    if (props.textPaddingHorizontal !== undefined) staticParams.textPaddingHorizontal = props.textPaddingHorizontal
    if (props.headerBackground !== undefined) staticParams.headerBackground = props.headerBackground
    if (props.headerTextColor !== undefined) staticParams.headerTextColor = props.headerTextColor
    if (props.headerFontFamily !== undefined) staticParams.headerFontFamily = props.headerFontFamily
    if (props.headerFontSize !== undefined) staticParams.headerFontSize = props.headerFontSize
    if (props.bodyRowHeight !== undefined) staticParams.bodyRowHeight = props.bodyRowHeight
    if (props.bodyBackgroundOdd !== undefined) staticParams.bodyBackgroundOdd = props.bodyBackgroundOdd
    if (props.bodyBackgroundEven !== undefined) staticParams.bodyBackgroundEven = props.bodyBackgroundEven
    if (props.bodyTextColor !== undefined) staticParams.bodyTextColor = props.bodyTextColor
    if (props.bodyFontFamily !== undefined) staticParams.bodyFontFamily = props.bodyFontFamily
    if (props.bodyFontSize !== undefined) staticParams.bodyFontSize = props.bodyFontSize
    if (props.borderColor !== undefined) staticParams.borderColor = props.borderColor
    if (props.summaryRowHeight !== undefined) staticParams.summaryRowHeight = props.summaryRowHeight
    if (props.summaryBackground !== undefined) staticParams.summaryBackground = props.summaryBackground
    if (props.summaryTextColor !== undefined) staticParams.summaryTextColor = props.summaryTextColor
    if (props.summaryFontFamily !== undefined) staticParams.summaryFontFamily = props.summaryFontFamily
    if (props.summaryFontSize !== undefined) staticParams.summaryFontSize = props.summaryFontSize
    if (props.scrollbarSize !== undefined) staticParams.scrollbarSize = props.scrollbarSize
    if (props.scrollbarBackground !== undefined) staticParams.scrollbarBackground = props.scrollbarBackground
    if (props.scrollbarThumbBackground !== undefined)
      staticParams.scrollbarThumbBackground = props.scrollbarThumbBackground
    if (props.scrollbarThumbHoverBackground !== undefined)
      staticParams.scrollbarThumbHoverBackground = props.scrollbarThumbHoverBackground
    if (props.sortActiveColor !== undefined) staticParams.sortActiveColor = props.sortActiveColor
    if (props.dragIconHeight !== undefined) staticParams.dragIconHeight = props.dragIconHeight
    if (props.dragIconWidth !== undefined) staticParams.dragIconWidth = props.dragIconWidth
    if (props.spanMethod !== undefined) staticParams.spanMethod = props.spanMethod
  },
  {
    deep: true,
    immediate: true
  }
)

watch(
  () => [props.data],
  async () => {
    if (!stageVars.stage) return

    handleTableData()
    refreshTable(true)
  },
  {
    deep: true
  }
)

watch(
  () => [props.xAxisFields, props.yAxisFields],
  () => {
    if (!stageVars.stage) return
    refreshTable(false)
  },
  {
    deep: true
  }
)

watch(
  () => [props.chartWidth, props.chartHeight],
  async () => {
    if (!stageVars.stage) return
    // 等待demo节点发生变更再触发该方法
    await nextTick()

    initStage()
    handleTableData()
    refreshTable(true)
  }
)

/**
 * header 相关（尺寸与样式）
 * @returns {void}
 */
watch(
  () => [
    props.headerRowHeight,
    props.headerFontFamily,
    props.headerFontSize,
    props.headerTextColor,
    props.headerBackground
    // props.dragIconHeight,
    // props.dragIconWidth
  ],
  () => {
    if (!stageVars.stage) return
    refreshTable(false)
  }
)

/**
 * body 相关（行高与样式）
 * @returns {void}
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
    if (!stageVars.stage) return
    refreshTable(false)
  }
)

/**
 * 汇总行相关 - 注释以提升性能
 * @returns {void}
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
    if (!stageVars.stage) return
    refreshTable(false)
  }
)

/**
 * 滚动条相关（样式与尺寸）
 * @returns {void}
 */
watch(
  () => [
    props.scrollbarBackground,
    props.scrollbarThumbBackground,
    props.scrollbarThumbHoverBackground,
    props.scrollbarSize
  ],
  () => {
    if (!stageVars.stage) return
    refreshTable(false)
  }
)

/**
 * 交互相关（排序指示等） - 注释高亮相关以提升性能
 * @returns {void}
 */
watch(
  () => [props.sortActiveColor, props.highlightCellBackground],
  () => {
    if (!stageVars.stage) return
    refreshTable(false)
  }
)

/**
 * 虚拟滚动/性能相关
 * @returns {void}
 */
watch(
  () => [props.bufferRows],
  () => {
    if (!stageVars.stage) return
    refreshTable(false)
  }
)

/**
 * 排序状态变化时重新渲染表格
 * @returns {void}
 */
watch(
  () => sortColumns.value,
  () => {
    if (!stageVars.stage) return
    refreshTable(false)
  },
  {
    deep: true
  }
)

onMounted(async () => {
  initStage()
  handleTableData()
  refreshTable(true)
  initWheelListener()
  initStageListeners()
})

onUnmounted(() => {
  destroyStage()
  cleanupWheelListener()
  cleanupStageListeners()
})
</script>
