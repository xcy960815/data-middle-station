<template>
  <div ref="tableContainerRef" :title="title" class="table-container" :style="tableContainerStyle"></div>
  <!-- 过滤器下拉组件 -->
  <filter-dropdown ref="filterDropdownRef" />
  <!-- 汇总下拉组件 -->
  <summary-dropdown ref="summaryDropdownRef" />
  <!-- 单元格编辑器组件 -->
  <cell-editor ref="cellEditorRef" />
</template>
<script lang="ts" setup>
import { computed, nextTick, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue'
import CellEditor from './components/cell-editor.vue'
import FilterDropdown from './components/filter-dropdown.vue'
import SummaryDropdown from './components/summary-dropdown.vue'
import { handleTableData, resetTableDataState } from './data-handler'
import {
  applyTableParams,
  type CanvasTableContext,
  type CanvasTableParams,
  type CellValueChangePayload,
  type ColumnOrderChangePayload,
  type ColumnWidthChangePayload,
  createCanvasTableContext,
  resetCurrentTableContext,
  resetTableParams,
  runWithTableContext,
  setCurrentTableContext,
  setTableRuntimeHandlers,
  tableProps
} from './parameter'
import { measureTablePerf } from './perf'
import { cleanupWheelListener, initWheelListener } from './scrollbar-handler'
import {
  cleanupStageListeners,
  destroyStage,
  initStage,
  initStageListeners,
  refreshBodySection,
  refreshHeaderSection,
  refreshScrollbarSection,
  refreshSummarySection,
  refreshTable,
  stageVars
} from './stage-handler'
import { resetSummaryState } from './summary-handler'
const props = defineProps(tableProps)
const emit = defineEmits<{
  renderChartStart: []
  renderChartEnd: []
  columnWidthChange: [payload: ColumnWidthChangePayload]
  columnOrderChange: [payload: ColumnOrderChangePayload]
  cellValueChange: [payload: CellValueChangePayload]
}>()
const tableContainerRef = ref<HTMLDivElement | null>(null)
const filterDropdownRef = ref<InstanceType<typeof FilterDropdown> | null>(null)
const summaryDropdownRef = ref<InstanceType<typeof SummaryDropdown> | null>(null)
const cellEditorRef = ref<InstanceType<typeof CellEditor> | null>(null)
const tableContext = shallowRef<CanvasTableContext | null>(null)

const runInTableContext = (handler: () => void) => {
  if (!tableContext.value) return false

  runWithTableContext(tableContext.value, handler)
  return true
}

const updateTableParams = (params: Partial<CanvasTableParams>) => {
  let didUpdate = false

  runInTableContext(() => {
    applyTableParams(params)
    didUpdate = true
  })

  return didUpdate
}

const syncAllTableParamsFromProps = () => {
  updateTableParams({
    title: props.title ?? '',
    data: props.data,
    xAxisFields: props.xAxisFields,
    yAxisFields: props.yAxisFields,
    enableSummary: props.enableSummary,
    bufferRows: props.bufferRows,
    minAutoColWidth: props.minAutoColWidth,
    highlightCellBackground: props.highlightCellBackground,
    highlightRowBackground: props.highlightRowBackground,
    highlightColBackground: props.highlightColBackground,
    headerRowHeight: props.headerRowHeight,
    resizerWidth: props.resizerWidth,
    textPaddingHorizontal: props.textPaddingHorizontal,
    headerBackground: props.headerBackground,
    headerTextColor: props.headerTextColor,
    headerFontFamily: props.headerFontFamily,
    headerFontSize: props.headerFontSize,
    bodyRowHeight: props.bodyRowHeight,
    bodyBackgroundOdd: props.bodyBackgroundOdd,
    bodyBackgroundEven: props.bodyBackgroundEven,
    bodyTextColor: props.bodyTextColor,
    bodyFontFamily: props.bodyFontFamily,
    bodyFontSize: props.bodyFontSize,
    borderColor: props.borderColor,
    summaryRowHeight: props.summaryRowHeight,
    summaryBackground: props.summaryBackground,
    summaryTextColor: props.summaryTextColor,
    summaryFontFamily: props.summaryFontFamily,
    summaryFontSize: props.summaryFontSize,
    scrollbarSize: props.scrollbarSize,
    scrollbarBackground: props.scrollbarBackground,
    scrollbarThumbBackground: props.scrollbarThumbBackground,
    scrollbarThumbHoverBackground: props.scrollbarThumbHoverBackground,
    sortActiveColor: props.sortActiveColor,
    dragIconHeight: props.dragIconHeight,
    dragIconWidth: props.dragIconWidth,
    dragIconDotSize: props.dragIconDotSize,
    spanMethod: props.spanMethod
  })
}

const updateAndRefresh = (params: Partial<CanvasTableParams>, refreshHandler: () => void) => {
  runInTableContext(() => {
    applyTableParams(params)
    if (!stageVars.stage) return
    refreshHandler()
  })
}

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

watch(
  () => [props.data],
  async () => {
    runInTableContext(() => {
      applyTableParams({ data: props.data })
      if (!stageVars.stage) return

      handleTableData()
      refreshTable(true)
    })
  },
  {
    deep: true
  }
)

watch(
  () => [props.xAxisFields, props.yAxisFields],
  () => {
    runInTableContext(() => {
      applyTableParams({ xAxisFields: props.xAxisFields, yAxisFields: props.yAxisFields })
      if (!stageVars.stage) return
      refreshTable(false)
    })
  },
  {
    deep: true
  }
)

watch(
  () => [props.chartWidth, props.chartHeight],
  async () => {
    if (!tableContext.value) return
    // 等待demo节点发生变更再触发该方法
    await nextTick()
    runInTableContext(() => {
      if (!stageVars.stage) return

      initStage(tableContainerRef.value)
      handleTableData()
      refreshTable(true)
    })
  }
)

/**
 * header 相关（尺寸与样式）
 * @returns {void}
 */
watch(
  () => [
    props.headerRowHeight,
    props.resizerWidth,
    props.textPaddingHorizontal,
    props.minAutoColWidth,
    props.dragIconHeight,
    props.dragIconWidth,
    props.dragIconDotSize,
    props.spanMethod
  ],
  () => {
    updateAndRefresh(
      {
        headerRowHeight: props.headerRowHeight,
        resizerWidth: props.resizerWidth,
        textPaddingHorizontal: props.textPaddingHorizontal,
        minAutoColWidth: props.minAutoColWidth,
        dragIconHeight: props.dragIconHeight,
        dragIconWidth: props.dragIconWidth,
        dragIconDotSize: props.dragIconDotSize,
        spanMethod: props.spanMethod
      },
      () => refreshTable(false)
    )
  }
)

watch(
  () => [props.headerFontFamily, props.headerFontSize, props.headerTextColor, props.headerBackground],
  () => {
    updateAndRefresh(
      {
        headerFontFamily: props.headerFontFamily,
        headerFontSize: props.headerFontSize,
        headerTextColor: props.headerTextColor,
        headerBackground: props.headerBackground
      },
      refreshHeaderSection
    )
  }
)

/**
 * body 相关（行高与样式）
 * @returns {void}
 */
watch(
  () => [props.bodyRowHeight],
  () => {
    updateAndRefresh({ bodyRowHeight: props.bodyRowHeight }, () => refreshTable(false))
  }
)

watch(
  () => [
    props.bodyBackgroundOdd,
    props.bodyBackgroundEven,
    props.bodyTextColor,
    props.bodyFontSize,
    props.bodyFontFamily
  ],
  () => {
    updateAndRefresh(
      {
        bodyBackgroundOdd: props.bodyBackgroundOdd,
        bodyBackgroundEven: props.bodyBackgroundEven,
        bodyTextColor: props.bodyTextColor,
        bodyFontSize: props.bodyFontSize,
        bodyFontFamily: props.bodyFontFamily
      },
      refreshBodySection
    )
  }
)

watch(
  () => [props.borderColor],
  () => {
    updateAndRefresh({ borderColor: props.borderColor }, () => refreshTable(false))
  }
)

/**
 * 汇总行相关 - 注释以提升性能
 * @returns {void}
 */
watch(
  () => [props.enableSummary, props.summaryRowHeight],
  () => {
    updateAndRefresh({ enableSummary: props.enableSummary, summaryRowHeight: props.summaryRowHeight }, () =>
      refreshTable(false)
    )
  }
)

watch(
  () => [props.summaryFontFamily, props.summaryFontSize, props.summaryBackground, props.summaryTextColor],
  () => {
    updateAndRefresh(
      {
        summaryFontFamily: props.summaryFontFamily,
        summaryFontSize: props.summaryFontSize,
        summaryBackground: props.summaryBackground,
        summaryTextColor: props.summaryTextColor
      },
      refreshSummarySection
    )
  }
)

/**
 * 滚动条相关（样式与尺寸）
 * @returns {void}
 */
watch(
  () => [props.scrollbarSize],
  () => {
    updateAndRefresh({ scrollbarSize: props.scrollbarSize }, () => refreshTable(false))
  }
)

watch(
  () => [props.scrollbarBackground, props.scrollbarThumbBackground, props.scrollbarThumbHoverBackground],
  () => {
    updateAndRefresh(
      {
        scrollbarBackground: props.scrollbarBackground,
        scrollbarThumbBackground: props.scrollbarThumbBackground,
        scrollbarThumbHoverBackground: props.scrollbarThumbHoverBackground
      },
      refreshScrollbarSection
    )
  }
)

/**
 * 交互相关（排序指示等） - 注释高亮相关以提升性能
 * @returns {void}
 */
watch(
  () => [
    props.sortActiveColor,
    props.highlightCellBackground,
    props.highlightRowBackground,
    props.highlightColBackground
  ],
  () => {
    updateAndRefresh(
      {
        sortActiveColor: props.sortActiveColor,
        highlightCellBackground: props.highlightCellBackground,
        highlightRowBackground: props.highlightRowBackground,
        highlightColBackground: props.highlightColBackground
      },
      refreshHeaderSection
    )
  }
)

/**
 * 虚拟滚动/性能相关
 * @returns {void}
 */
watch(
  () => [props.bufferRows],
  () => {
    updateAndRefresh({ bufferRows: props.bufferRows }, refreshBodySection)
  }
)

/**
 * 排序状态变化时重新渲染表格
 * @returns {void}
 */
onMounted(async () => {
  tableContext.value = createCanvasTableContext()
  setCurrentTableContext(tableContext.value)
  tableContext.value.runtimeState.filterDropdownRef.value = filterDropdownRef.value
  tableContext.value.runtimeState.summaryDropdownRef.value = summaryDropdownRef.value
  tableContext.value.runtimeState.cellEditorRef.value = cellEditorRef.value
  filterDropdownRef.value?.setTableContext(tableContext.value)
  summaryDropdownRef.value?.setTableContext(tableContext.value)
  cellEditorRef.value?.setTableContext(tableContext.value)
  syncAllTableParamsFromProps()
  runInTableContext(() => {
    setTableRuntimeHandlers({
      onColumnWidthChange: (payload) => emit('columnWidthChange', payload),
      onColumnOrderChange: (payload) => emit('columnOrderChange', payload),
      onCellValueChange: (payload) => emit('cellValueChange', payload)
    })
    resetTableDataState()
    resetSummaryState()
    emit('renderChartStart')
    measureTablePerf('firstRender', () => {
      initStage(tableContainerRef.value)
      handleTableData()
      refreshTable(true)
    })
    emit('renderChartEnd')
    initWheelListener(tableContainerRef.value)
    initStageListeners()
  })
})

onUnmounted(() => {
  runInTableContext(() => {
    cleanupWheelListener(tableContainerRef.value)
    cleanupStageListeners()
    destroyStage()
    resetTableDataState()
    resetTableParams()
    resetSummaryState()
  })
  resetCurrentTableContext(tableContext.value)
  tableContext.value = null
})
</script>
