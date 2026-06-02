<template>
  <div class="canvas-table-chart h-full">
    <client-only>
      <CanvasTable
        :data="data"
        :x-axis-fields="xAxisFields"
        :y-axis-fields="yAxisFields"
        :chart-width="chartWidth"
        :chart-height="chartHeight"
        :highlight-cell-background="resolvedTableChartConfig?.highlightCellBackground"
        :highlight-row-background="resolvedTableChartConfig?.highlightRowBackground"
        :highlight-col-background="resolvedTableChartConfig?.highlightColBackground"
        :header-row-height="resolvedTableChartConfig?.headerRowHeight"
        :summary-row-height="resolvedTableChartConfig?.summaryRowHeight"
        :enable-summary="resolvedTableChartConfig?.enableSummary"
        :body-row-height="resolvedTableChartConfig?.bodyRowHeight"
        :scrollbar-size="resolvedTableChartConfig?.scrollbarSize"
        :header-background="resolvedTableChartConfig?.headerBackground"
        :body-background-odd="resolvedTableChartConfig?.bodyBackgroundOdd"
        :body-background-even="resolvedTableChartConfig?.bodyBackgroundEven"
        :border-color="resolvedTableChartConfig?.borderColor"
        :header-text-color="resolvedTableChartConfig?.headerTextColor"
        :body-text-color="resolvedTableChartConfig?.bodyTextColor"
        :header-font-family="resolvedTableChartConfig?.headerFontFamily"
        :header-font-size="resolvedTableChartConfig?.headerFontSize"
        :body-font-family="resolvedTableChartConfig?.bodyFontFamily"
        :body-font-size="resolvedTableChartConfig?.bodyFontSize"
        :summary-font-family="resolvedTableChartConfig?.summaryFontFamily"
        :summary-font-size="resolvedTableChartConfig?.summaryFontSize"
        :summary-background="resolvedTableChartConfig?.summaryBackground"
        :summary-text-color="resolvedTableChartConfig?.summaryTextColor"
        :scrollbar-background="resolvedTableChartConfig?.scrollbarBackground"
        :scrollbar-thumb-background="resolvedTableChartConfig?.scrollbarThumbBackground"
        :scrollbar-thumb-hover-background="resolvedTableChartConfig?.scrollbarThumbHoverBackground"
        :buffer-rows="resolvedTableChartConfig?.bufferRows"
        :min-auto-col-width="resolvedTableChartConfig?.minAutoColWidth"
        :sort-active-color="resolvedTableChartConfig?.sortActiveColor"
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

const props = defineProps({
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
  },
  privateChartConfig: {
    type: Object as PropType<AnalyzeConfigVo.TableChartConfigItem | null>,
    default: () => null
  }
})

/**
 * 表格配置
 */
const resolvedTableChartConfig = computed(() => {
  return props.privateChartConfig || chartConfigStore.privateChartConfig?.table
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
