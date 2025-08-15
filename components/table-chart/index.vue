<template>
  <div class="canvas-table-chart h-full">
    <client-only>
      <CanvasTable
        :data="data"
        :xAxisFields="xAxisFields"
        :yAxisFields="yAxisFields"
        :chart-width="chartWidth"
        :chart-height="chartHeight"
        :border="chartConfig?.table?.border"
        :hover-fill="chartConfig?.table?.hoverFill"
        :header-height="chartConfig?.table?.headerHeight"
        :summary-height="chartConfig?.table?.summaryHeight"
        :enable-summary="chartConfig?.table?.enableSummary"
        :row-height="chartConfig?.table?.rowHeight"
        :scrollbar-size="chartConfig?.table?.scrollbarSize"
        :table-padding="chartConfig?.table?.tablePadding"
        :header-background="chartConfig?.table?.headerBackground"
        :body-background-odd="chartConfig?.table?.bodyBackgroundOdd"
        :body-background-even="chartConfig?.table?.bodyBackgroundEven"
        :border-color="chartConfig?.table?.borderColor"
        :header-text-color="chartConfig?.table?.headerTextColor"
        :body-text-color="chartConfig?.table?.bodyTextColor"
        :header-font-family="chartConfig?.table?.headerFontFamily"
        :header-font-size="chartConfig?.table?.headerFontSize"
        :body-font-family="chartConfig?.table?.bodyFontFamily"
        :body-font-size="chartConfig?.table?.bodyFontSize"
        :body-font-weight="chartConfig?.table?.bodyFontWeight"
        :body-font-style="chartConfig?.table?.bodyFontStyle"
        :summary-font-family="chartConfig?.table?.summaryFontFamily"
        :summary-font-size="chartConfig?.table?.summaryFontSize"
        :summary-background="chartConfig?.table?.summaryBackground"
        :summary-text-color="chartConfig?.table?.summaryTextColor"
        :scrollbar-background="chartConfig?.table?.scrollbarBackground"
        :scrollbar-thumb="chartConfig?.table?.scrollbarThumb"
        :scrollbar-thumb-hover="chartConfig?.table?.scrollbarThumbHover"
        :buffer-rows="chartConfig?.table?.bufferRows"
        :min-auto-col-width="chartConfig?.table?.minAutoColWidth"
        :scroll-threshold="chartConfig?.table?.scrollThreshold"
        :header-sort-active-background="chartConfig?.table?.headerSortActiveBackground"
        :sortable-color="chartConfig?.table?.sortableColor"
        :enable-row-hover-highlight="chartConfig?.table?.enableRowHoverHighlight"
        :enable-col-hover-highlight="chartConfig?.table?.enableColHoverHighlight"
      />
    </client-only>
  </div>
</template>

<script lang="ts" setup>
import CanvasTable from './canvas-table.vue'

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
    default: () => 0
  },
  chartWidth: {
    type: [Number, String],
    default: () => 0
  },
  // 图表配置
  chartConfig: {
    type: Object as PropType<ChartConfigStore.ChartConfig>,
    default: () => ({})
  }
})
</script>

<style scoped lang="scss">
.canvas-table-chart {
  display: flex;
  flex-direction: column;
  height: 100%;
}
</style>
