<template>
  <div class="canvas-table-chart h-full">
    <client-only>
      <CanvasTable
        :title="title"
        :data="data"
        :x-axis-fields="resolvedXAxisFields"
        :y-axis-fields="resolvedYAxisFields"
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
import { defaultAnalyzeTableChartConfig } from '@/shared/analyzeChartConfigDefaults'
import {
  buildAnalyzeTableColumnsFromFields,
  mergeAnalyzeFieldWithTableColumn,
  stripAnalyzeTableColumnUiFromField
} from '@/shared/analyzeTableColumnConfig'
import CanvasTable from './canvas-table.vue'
import type { CellValueChangePayload, ColumnOrderChangePayload, ColumnWidthChangePayload } from './parameter'

const chartConfigStore = useChartConfigStore()
const analyzeStore = useAnalyzeStore()
const dimensionStore = useDimensionsStore()
const measureStore = useMeasuresStore()

const emit = defineEmits<{
  renderChartStart: []
  renderChartEnd: []
}>()

const props = defineProps({
  title: {
    type: String,
    default: ''
  },
  data: {
    type: Array as PropType<Array<AnalyzeDataVo.AnalyzeData>>,
    default: () => []
  },
  xAxisFields: {
    type: Array as PropType<Array<DimensionStore.DimensionOption>>,
    default: () => []
  },
  yAxisFields: {
    type: Array as PropType<Array<MeasureStore.MeasureOption>>,
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

const tableColumnSettings = computed(() => resolvedTableChartConfig.value?.columns || [])

const resolvedXAxisFields = computed(
  () =>
    props.xAxisFields.map((field) =>
      mergeAnalyzeFieldWithTableColumn(field, tableColumnSettings.value)
    ) as CanvasTable.ColumnOption[]
)

const resolvedYAxisFields = computed(
  () =>
    props.yAxisFields.map((field) =>
      mergeAnalyzeFieldWithTableColumn(field, tableColumnSettings.value)
    ) as CanvasTable.ColumnOption[]
)

const buildCurrentFieldTableColumns = () =>
  buildAnalyzeTableColumnsFromFields(props.xAxisFields, props.yAxisFields, tableColumnSettings.value)

const setResolvedTableColumns = (columns: AnalyzeConfigDao.TableColumnSetting[]) => {
  const tableConfig =
    resolvedTableChartConfig.value || chartConfigStore.privateChartConfig?.table || defaultAnalyzeTableChartConfig
  chartConfigStore.setTableChartConfig({
    ...tableConfig,
    columns
  })
}

const handleColumnWidthChange = ({ columnName, width }: ColumnWidthChangePayload) => {
  const columns = buildCurrentFieldTableColumns()
  setResolvedTableColumns(columns.map((column) => (column.columnName === columnName ? { ...column, width } : column)))
  analyzeStore.setEditorDirty(true)
}

const handleColumnOrderChange = ({ xAxisFields, yAxisFields }: ColumnOrderChangePayload) => {
  dimensionStore.setDimensions(xAxisFields.map(stripAnalyzeTableColumnUiFromField) as DimensionStore.DimensionOption[])
  measureStore.setMeasures(yAxisFields.map(stripAnalyzeTableColumnUiFromField) as MeasureStore.MeasureOption[])
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
