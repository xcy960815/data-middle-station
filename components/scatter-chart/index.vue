<template>
  <!-- 散点图 / 气泡图 -->
  <div
    ref="chartContainer"
    class="h-full w-full"
    data-canvas-type="scatter-chart"
    data-canvas-component="ScatterChart"
  ></div>
</template>
<script setup lang="ts">
import { ScatterChart as EScatterChart } from 'echarts/charts'
import { LineChart } from 'echarts/charts'
import {
  DataZoomComponent,
  GraphicComponent,
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent,
  VisualMapComponent
} from 'echarts/components'
import { init, type ECharts } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { computed, markRaw, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch, type PropType } from 'vue'
import { useChartRender } from '~/composables/useChartRender/index'

// 注册必要的组件
import { use } from 'echarts/core'
use([
  EScatterChart,
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent,
  GraphicComponent,
  VisualMapComponent,
  CanvasRenderer
])

defineOptions({
  name: 'ScatterChart'
})

const props = defineProps({
  title: {
    type: String,
    default: () => ''
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
  chartWidth: {
    type: [Number, String],
    default: () => '100%'
  },
  chartHeight: {
    type: [Number, String],
    default: () => '100%'
  },
  privateChartConfig: {
    type: Object as PropType<AnalyzeConfigVo.ScatterChartConfigItem | null>,
    default: () => null
  }
})

const emits = defineEmits(['renderChartStart', 'renderChartEnd'])

const chartContainer = ref<HTMLElement | null>(null)
const chartInstance = shallowRef<ECharts | null>(null)

// 使用图表渲染 composable
const { renderScatterChart, createEmptyChartOption } = useChartRender()

// 获取图表配置
const chartConfigStore = useChartConfigStore()

const chartConfig = computed(() => {
  return (
    props.privateChartConfig ||
    chartConfigStore.privateChartConfig?.scatter || {
      showLabel: false,
      symbolSize: 10,
      showTrendLine: false
    }
  )
})

const initChart = () => {
  emits('renderChartStart')

  if (!chartContainer.value) {
    console.warn('ScatterChart: chartContainer is not available')
    emits('renderChartEnd')
    return
  }

  if (chartInstance.value) {
    chartInstance.value.dispose()
    chartInstance.value = null
  }

  try {
    chartInstance.value = markRaw(init(chartContainer.value))
  } catch (error) {
    console.error('ScatterChart: init error', error)
    emits('renderChartEnd')
    return
  }

  const config = {
    title: props.title,
    data: props.data,
    xAxisFields: props.xAxisFields || [],
    yAxisFields: props.yAxisFields
  }

  const option = renderScatterChart(config, chartConfig.value)

  if (!option) {
    const emptyOption = createEmptyChartOption(props.title, 'scatter')
    chartInstance.value.setOption(emptyOption)
    emits('renderChartEnd')
    return
  }

  try {
    chartInstance.value.setOption(option, true)
  } catch (error) {
    console.error('ScatterChart: setOption error', error)
  }

  emits('renderChartEnd')
}

watch(
  () => [props.data, props.xAxisFields, props.yAxisFields, chartConfig.value],
  () => {
    nextTick(() => {
      initChart()
    })
  },
  { deep: true }
)

watch(
  () => [props.chartWidth, props.chartHeight],
  () => {
    if (!chartInstance.value) return
    nextTick(initChart)
  }
)

onMounted(() => {
  nextTick(() => {
    initChart()
  })
})

onBeforeUnmount(() => {
  if (chartInstance.value) {
    chartInstance.value.dispose()
    chartInstance.value = null
  }
})
</script>
<style lang="scss" scoped>
div[data-canvas-type='scatter-chart'] {
  min-height: 300px;
  position: relative;
}
</style>
