<template>
  <div class="canvas-table-chart h-full">
    <client-only>
      <CanvasTable
        ref="canvasTableRef"
        :data="data"
        :x-axis-fields="xAxisFields"
        :y-axis-fields="yAxisFields"
        :chart-width="chartWidth"
        :chart-height="chartHeight"
        :highlight-cell-background="tableChartConfig?.highlightCellBackground"
        :highlight-row-background="tableChartConfig?.highlightRowBackground"
        :highlight-col-background="tableChartConfig?.highlightColBackground"
        :header-height="tableChartConfig?.headerHeight"
        :summary-height="tableChartConfig?.summaryHeight"
        :enable-summary="tableChartConfig?.enableSummary"
        :body-row-height="tableChartConfig?.bodyRowHeight"
        :scrollbar-size="tableChartConfig?.scrollbarSize"
        :header-background="tableChartConfig?.headerBackground"
        :body-background-odd="tableChartConfig?.bodyBackgroundOdd"
        :body-background-even="tableChartConfig?.bodyBackgroundEven"
        :border-color="tableChartConfig?.borderColor"
        :header-text-color="tableChartConfig?.headerTextColor"
        :body-text-color="tableChartConfig?.bodyTextColor"
        :header-font-family="tableChartConfig?.headerFontFamily"
        :header-font-size="tableChartConfig?.headerFontSize"
        :body-font-family="tableChartConfig?.bodyFontFamily"
        :body-font-size="tableChartConfig?.bodyFontSize"
        :summary-font-family="tableChartConfig?.summaryFontFamily"
        :summary-font-size="tableChartConfig?.summaryFontSize"
        :summary-background="tableChartConfig?.summaryBackground"
        :summary-text-color="tableChartConfig?.summaryTextColor"
        :scrollbar-background="tableChartConfig?.scrollbarBackground"
        :scrollbar-thumb="tableChartConfig?.scrollbarThumb"
        :scrollbar-thumb-hover="tableChartConfig?.scrollbarThumbHover"
        :buffer-rows="tableChartConfig?.bufferRows"
        :min-auto-col-width="tableChartConfig?.minAutoColWidth"
        :scroll-threshold="tableChartConfig?.scrollThreshold"
        :header-sort-active-background="tableChartConfig?.headerSortActiveBackground"
        :sortable-color="tableChartConfig?.sortableColor"
        :enable-row-hover-highlight="tableChartConfig?.enableRowHoverHighlight"
        :enable-col-hover-highlight="tableChartConfig?.enableColHoverHighlight"
      >
      </CanvasTable>
    </client-only>
  </div>
</template>

<script lang="ts" setup>
import CanvasTable from './canvas-table.vue'

const chartConfigStore = useChartConfigStore()

const props = defineProps({
  data: {
    type: Array as PropType<Array<ChartDataVo.ChartData>>,
    default: () => []
  },
  xAxisFields: {
    type: Array as PropType<Array<GroupStore.GroupOption>>,
    default: () => []
  },
  yAxisFields: {
    type: Array as PropType<Array<DimensionStore.DimensionOption>>,
    default: () => []
  },
  chartHeight: {
    type: [Number, String],
    default: () => '100%'
  },
  chartWidth: {
    type: [Number, String],
    default: () => '100%'
  }
})

/**
 * 表格配置
 */
const tableChartConfig = computed(() => {
  return chartConfigStore.privateChartConfig?.table
})

/**
 * CanvasTable 组件引用
 */
const canvasTableRef = ref<InstanceType<typeof CanvasTable> | null>(null)

// 暴露导出方法给父组件
defineExpose({
  /**
   * 导出图表为 Base64
   * @param options
   */
  exportAsImage: async (options?: SendEmailDto.ExportChartConfigs) => {
    if (!canvasTableRef.value) {
      throw new Error('表格组件实例不存在')
    }
    return canvasTableRef.value.exportAsImage(options)
  },
  /**
   * 下载图表
   * @param filename 文件名
   * @param options 选项
   */
  downloadChart: async (filename: string, options?: SendEmailDto.ExportChartConfigs) => {
    if (!canvasTableRef.value) {
      throw new Error('表格组件实例不存在')
    }
    return canvasTableRef.value.downloadChart(filename, options)
  }
})
</script>

<style scoped lang="scss">
.canvas-table-chart {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}
</style>
