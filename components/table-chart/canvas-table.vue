<template>
  <div class="canvas-table-wrapper" :style="tableContainerStyle">
    <!-- 原生滚动代理层 -->
    <div ref="scrollProxyRef" class="scroll-proxy" @scroll="handleNativeScroll" :style="scrollProxyStyle">
      <!-- 虚拟尺寸撑开层 -->
      <div
        class="virtual-spacer"
        :style="{
          position: 'absolute',
          top: 0,
          left: 0,
          width: totalVirtualWidth + 'px',
          height: totalVirtualHeight + 'px',
          pointerEvents: 'none'
        }"
      ></div>

      <!-- Sticky Canvas 容器 -->
      <div
        class="canvas-sticky-wrapper"
        style="position: sticky; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none"
      >
        <div
          ref="tableContainerRef"
          :title="title"
          class="table-container"
          style="width: 100%; height: 100%; pointer-events: auto"
        ></div>
        <!-- 过滤器下拉组件 -->
        <filter-dropdown ref="filterDropdownRef" style="pointer-events: auto" />
        <!-- 汇总下拉组件 -->
        <summary-dropdown ref="summaryDropdownRef" style="pointer-events: auto" />
        <!-- 单元格编辑器组件 -->
        <cell-editor ref="cellEditorRef" style="pointer-events: auto" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue'
import CellEditor from './components/cell-editor.vue'
import FilterDropdown from './components/filter-dropdown.vue'
import SummaryDropdown from './components/summary-dropdown.vue'
import { columnsInfo } from './body-handler'
import { handleTableData, resetTableDataState } from './data-handler'
import {
  applyTableParams,
  type CanvasTableContext,
  type CanvasTableParams,
  type CellValueChangePayload,
  type ColumnOrderChangePayload,
  type ColumnWidthChangePayload,
  createCanvasTableContext,
  getRuntimeState,
  resetCurrentTableContext,
  resetTableParams,
  getTableParams,
  getProcessedRows,
  runWithTableContext,
  setCurrentTableContext,
  setTableRuntimeHandlers,
  tableProps
} from './parameter'
import { measureTablePerf, runTableScrollStressTest, type TableScrollStressOptions } from './perf'
import { updateHorizontalScroll, updateVerticalScroll } from './scrollbar-handler'
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
const scrollProxyRef = ref<HTMLDivElement | null>(null)
const filterDropdownRef = ref<InstanceType<typeof FilterDropdown> | null>(null)
const summaryDropdownRef = ref<InstanceType<typeof SummaryDropdown> | null>(null)
const cellEditorRef = ref<InstanceType<typeof CellEditor> | null>(null)
const tableContext = shallowRef<CanvasTableContext | null>(null)

const totalVirtualWidth = ref(0)
const totalVirtualHeight = ref(0)

const runInTableContext = (handler: () => void) => {
  if (!tableContext.value) return false

  runWithTableContext(tableContext.value, handler)
  return true
}

const syncVirtualSize = () => {
  runInTableContext(() => {
    totalVirtualWidth.value = columnsInfo.totalWidth
    const processedRows = getProcessedRows().value
    const params = getTableParams()
    const summaryRowHeight = params.enableSummary ? params.summaryRowHeight : 0
    totalVirtualHeight.value = params.headerRowHeight + processedRows.length * params.bodyRowHeight + summaryRowHeight
  })
}

// ---- RAF 合帧节流：将高频 scroll 事件合并到下一帧统一处理 ----
let _latestScrollTop = 0
let _latestScrollLeft = 0
let _scrollRAFId: number | null = null

const flushNativeScroll = () => {
  _scrollRAFId = null
  runInTableContext(() => {
    updateVerticalScroll(_latestScrollTop, { skipThresholdCheck: true })
    updateHorizontalScroll(_latestScrollLeft)
  })
}

const handleNativeScroll = (e: Event) => {
  const target = e.target as HTMLDivElement
  _latestScrollTop = target.scrollTop
  _latestScrollLeft = target.scrollLeft
  if (_scrollRAFId === null) {
    _scrollRAFId = requestAnimationFrame(flushNativeScroll)
  }
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
    syncVirtualSize()
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

const scrollProxyStyle = computed(() => {
  return {
    '--sb-size': (props.scrollbarSize ?? 10) + 'px',
    '--sb-track-bg': props.scrollbarBackground ?? '#f5f5f5',
    '--sb-thumb-bg': props.scrollbarThumbBackground ?? '#c1c1c1',
    '--sb-thumb-hover': props.scrollbarThumbHoverBackground ?? '#a8a8a8',
    width: '100%',
    height: '100%',
    overflow: 'auto',
    position: 'absolute',
    top: '0',
    left: '0',
    right: '0',
    bottom: '0'
  } as Record<string, string>
})

watch(
  () => [props.data],
  async () => {
    runInTableContext(() => {
      applyTableParams({ data: props.data })
      if (!stageVars.stage) return

      handleTableData()
      refreshTable(true)
      syncVirtualSize()
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
      syncVirtualSize()
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
      syncVirtualSize()
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
  // 注册 scroll proxy 重置回调，供 refreshTable(true) 调用时同步 DOM 位置
  tableContext.value.runtimeState.scrollProxyResetHandler = () => {
    if (scrollProxyRef.value) {
      scrollProxyRef.value.scrollTop = 0
      scrollProxyRef.value.scrollLeft = 0
    }
  }
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
      syncVirtualSize()
    })
    emit('renderChartEnd')
    initStageListeners(tableContainerRef.value!)
  })
})

onUnmounted(() => {
  // 取消可能残留的 RAF 回调，防止访问已销毁的 Stage
  if (_scrollRAFId !== null) {
    cancelAnimationFrame(_scrollRAFId)
    _scrollRAFId = null
  }
  runInTableContext(() => {
    cleanupStageListeners()
    destroyStage()
    resetTableDataState()
    resetTableParams()
    resetSummaryState()
    getRuntimeState().scrollProxyResetHandler = null
  })
  resetCurrentTableContext(tableContext.value)
  tableContext.value = null
})

const runScrollStressTest = async (options?: TableScrollStressOptions) => {
  const context = tableContext.value
  if (!context) return null

  return runTableScrollStressTest(
    {
      verticalScroll: (delta) =>
        runWithTableContext(context, () => updateVerticalScroll(delta, { skipThresholdCheck: true })),
      horizontalScroll: (delta) => runWithTableContext(context, () => updateHorizontalScroll(delta)) // Note: might need absolute conversion if this is used
    },
    {
      verticalDelta: runWithTableContext(context, () => getTableParams().bodyRowHeight),
      ...options
    }
  )
}

defineExpose({
  runScrollStressTest
})
</script>

<style scoped>
.canvas-table-wrapper {
  position: relative;
  overflow: hidden;
}

/* 原生滚动条样式映射 */
.scroll-proxy::-webkit-scrollbar {
  width: var(--sb-size);
  height: var(--sb-size);
}
.scroll-proxy::-webkit-scrollbar-track {
  background: var(--sb-track-bg);
}
.scroll-proxy::-webkit-scrollbar-thumb {
  background: var(--sb-thumb-bg);
  border-radius: 4px;
}
.scroll-proxy::-webkit-scrollbar-thumb:hover {
  background: var(--sb-thumb-hover);
}
</style>
