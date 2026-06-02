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
        :header-row-height="tableChartConfig?.headerRowHeight"
        :summary-row-height="tableChartConfig?.summaryRowHeight"
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
        :scrollbar-thumb-background="tableChartConfig?.scrollbarThumbBackground"
        :scrollbar-thumb-hover-background="tableChartConfig?.scrollbarThumbHoverBackground"
        :buffer-rows="tableChartConfig?.bufferRows"
        :min-auto-col-width="tableChartConfig?.minAutoColWidth"
        :sort-active-color="tableChartConfig?.sortActiveColor"
        @column-width-change="handleColumnWidthChange"
        @column-order-change="handleColumnOrderChange"
        @cell-value-change="handleCellValueChange"
        @render-chart-start="emit('renderChartStart')"
        @render-chart-end="emit('renderChartEnd')"
      >
      </CanvasTable>
    </client-only>
  </div>
</template>

<script lang="ts" setup>
import CanvasTable from './canvas-table.vue'
import type { CellValueChangePayload, ColumnOrderChangePayload, ColumnWidthChangePayload } from './parameter'

const chartConfigStore = useChartConfigStore()
const analyzeStore = useAnalyzeStore()
const groupStore = useGroupsStore()
const dimensionStore = useDimensionsStore()
const emit = defineEmits<{
  renderChartStart: []
  renderChartEnd: []
}>()

defineProps({
  data: {
    type: Array as PropType<Array<AnalyzeDataVo.AnalyzeData>>,
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

const handleColumnWidthChange = ({ columnName, width }: ColumnWidthChangePayload) => {
  const group = groupStore.getGroups.find((item) => item.columnName === columnName)
  if (group) {
    groupStore.updateGroup({ ...group, width })
  }

  const dimension = dimensionStore.getDimensions.find((item) => item.columnName === columnName)
  if (dimension) {
    dimensionStore.updateDimension({ ...dimension, width })
  }

  analyzeStore.setEditorDirty(true)
}

const handleColumnOrderChange = ({ xAxisFields, yAxisFields }: ColumnOrderChangePayload) => {
  groupStore.setGroups(xAxisFields)
  dimensionStore.setDimensions(yAxisFields)
  analyzeStore.setEditorDirty(true)
}

const handleCellValueChange = (_payload: CellValueChangePayload) => {
  const { rowIndex, columnName, value } = _payload
  if (rowIndex >= 0 && analyzeStore.analyzeData[rowIndex]) {
    analyzeStore.analyzeData[rowIndex] = {
      ...analyzeStore.analyzeData[rowIndex],
      [columnName]: value
    }
  }
  analyzeStore.setEditorDirty(true)
}
</script>

<style scoped lang="scss">
.canvas-table-chart {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}
</style>
