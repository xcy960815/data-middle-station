<template>
  <div class="canvas-table-chart h-full">
    <client-only>
      <CanvasTable
        :data="data"
        :xAxisFields="xAxisFields"
        :yAxisFields="yAxisFields"
        chart-width="100%"
        chart-height="100%"
        :border="tableChartConfig?.border"
        :hover-fill="tableChartConfig?.hoverFill"
        :header-height="tableChartConfig?.headerHeight"
        :summary-height="tableChartConfig?.summaryHeight"
        :enable-summary="tableChartConfig?.enableSummary"
        :row-height="tableChartConfig?.rowHeight"
        :scrollbar-size="tableChartConfig?.scrollbarSize"
        :table-padding="tableChartConfig?.tablePadding"
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
        :body-font-weight="tableChartConfig?.bodyFontWeight"
        :body-font-style="tableChartConfig?.bodyFontStyle"
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
    type: Array as PropType<ChartDataDao.ChartData>,
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
  return chartConfigStore.chartConfig?.table
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
