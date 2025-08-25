<template>
  <div class="canvas-table-chart h-full">
    <client-only>
      <CanvasTable
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
interface PaginationConfig {
  pageSize: number
  pageNum: number
  total: number
}

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
  },
  enablePagination: {
    type: Boolean,
    default: false
  },
  paginationConfig: {
    type: Object as PropType<PaginationConfig>,
    default: () => ({ pageSize: 10, pageNum: 1, total: 0 })
  }
})

const emits = defineEmits<{
  'pagination-change': [{ pageNum: number; pageSize: number; total: number }]
}>()

/**
 * 处理分页变化事件
 */
const handlePaginationChange = (paginationData: { pageNum: number; pageSize: number; total: number }) => {
  emits('pagination-change', paginationData)
}
/**
 * 表格配置
 */
const tableChartConfig = computed(() => {
  return chartConfigStore.privateChartConfig?.table
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
