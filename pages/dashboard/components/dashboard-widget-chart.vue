<template>
  <div ref="widgetChartRef" class="dashboard-widget-chart">
    <div v-if="activeErrorMessage" class="dashboard-widget-chart__error">
      {{ activeErrorMessage }}
    </div>
    <component
      v-else
      v-loading="loading"
      :is="chartComponent"
      :data="data"
      :title="title"
      :x-axis-fields="xAxisFields"
      :y-axis-fields="yAxisFields"
      :chart-width="chartWidth"
      :chart-height="chartHeight"
      :private-chart-config="activePrivateChartConfig"
    />
  </div>
</template>

<script setup lang="ts">
import IntervalChart from '~/components/interval-chart/index.vue'
import LineChart from '~/components/line-chart/index.vue'
import PieChart from '~/components/pie-chart/index.vue'
import TableChart from '~/components/table-chart/index.vue'
import { validateAnalyzeChartConfig } from '@/utils/validateAnalyzeChartConfig'
import type { Component } from 'vue'

const props = defineProps<{
  title: string
  chartType: AnalyzeStore.ChartType
  dataSource: string | null
  loading: boolean
  errorMessage: string
  data: AnalyzeDataVo.AnalyzeData[]
  xAxisFields: DimensionStore.DimensionOption[]
  yAxisFields: MeasureStore.MeasureOption[]
  privateChartConfig: AnalyzeConfigVo.PrivateChartConfigItem | null
}>()

const chartWidth = ref<string | number>('100%')
const chartHeight = ref<string | number>('100%')
const widgetChartRef = ref<HTMLElement | null>(null)
const resizeObserver = ref<ResizeObserver>()

const chartComponentMap: Record<AnalyzeStore.ChartType, Component> = {
  table: TableChart,
  line: LineChart,
  interval: IntervalChart,
  pie: PieChart
}

const chartComponent = computed(() => chartComponentMap[props.chartType] || TableChart)

const activeErrorMessage = computed(() => {
  if (props.errorMessage) return props.errorMessage
  const validation = validateAnalyzeChartConfig({
    chartType: props.chartType,
    dataSource: props.dataSource,
    measures: props.yAxisFields,
    dimensions: props.xAxisFields
  })
  if (!validation.valid) return validation.message
  return ''
})

const activePrivateChartConfig = computed(() => {
  if (!props.privateChartConfig) return null
  return props.privateChartConfig[props.chartType] || null
})

onMounted(() => {
  const updateSize = () => {
    if (!widgetChartRef.value) return
    chartWidth.value = widgetChartRef.value.clientWidth
    chartHeight.value = widgetChartRef.value.clientHeight
  }
  resizeObserver.value = new ResizeObserver(updateSize)
  if (widgetChartRef.value) {
    resizeObserver.value.observe(widgetChartRef.value)
    updateSize()
  }
})

onUnmounted(() => {
  resizeObserver.value?.disconnect()
})
</script>

<style scoped lang="scss">
.dashboard-widget-chart {
  position: relative;
  height: 100%;
  min-height: 0;
  width: 100%;
}

.dashboard-widget-chart__error {
  display: flex;
  height: 100%;
  align-items: center;
  justify-content: center;
  padding: 16px;
  color: #f56c6c;
  font-size: 13px;
  text-align: center;
}
</style>
