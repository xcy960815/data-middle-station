<template>
  <!-- 折线图 -->
  <div
    ref="chartContainer"
    class="h-full w-full"
    :style="{ width: chartWidth, height: chartHeight }"
    data-canvas-type="line-chart"
    data-canvas-component="LineChart"
  ></div>
</template>
<script setup lang="ts">
import { LineChart } from 'echarts/charts'
import {
  DataZoomComponent,
  GraphicComponent,
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent
} from 'echarts/components'
import { init, type ECharts } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { computed, markRaw, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch, type PropType } from 'vue'
import { useChartRender } from '~/composables/useChartRender/index'

// 注册必要的组件
import { use } from 'echarts/core'
use([
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent,
  GraphicComponent,
  CanvasRenderer
])

defineOptions({
  name: 'LineChart'
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
    type: Array as PropType<Array<GroupStore.GroupOption>>,
    default: () => []
  },
  yAxisFields: {
    type: Array as PropType<Array<DimensionStore.DimensionOption>>,
    default: () => []
  },
  chartWidth: {
    type: [Number, String],
    default: () => '100%'
  },
  chartHeight: {
    type: [Number, String],
    default: () => '100%'
  }
})

const chartWidth = computed(() => {
  if (typeof props.chartWidth === 'number') return props.chartWidth + 'px'
  return props.chartWidth || '100%'
})

const chartHeight = computed(() => {
  if (typeof props.chartHeight === 'number') return props.chartHeight + 'px'
  return props.chartHeight || '100%'
})

const emits = defineEmits(['renderChartStart', 'renderChartEnd'])

const chartContainer = ref<HTMLElement | null>(null)

const chartInstance = shallowRef<ECharts | null>(null)

// 使用图表渲染 composable
const { renderLineChart, createEmptyChartOption } = useChartRender()

// 获取图表配置
const chartConfigStore = useChartConfigStore()

const chartConfig = computed(() => {
  return (
    chartConfigStore.privateChartConfig?.line || {
      showPoint: false,
      showLabel: false,
      smooth: false,
      autoDualAxis: false,
      horizontalBar: false
    }
  )
})

const initChart = () => {
  emits('renderChartStart')

  if (!chartContainer.value) {
    console.warn('LineChart: chartContainer is not available')
    emits('renderChartEnd')
    return
  }

  // 如果图表实例已存在，先销毁
  if (chartInstance.value) {
    chartInstance.value.dispose()
    chartInstance.value = null
  }

  // 初始化图表实例
  try {
    chartInstance.value = markRaw(init(chartContainer.value))
  } catch (error) {
    console.error('LineChart: init error', error)
    emits('renderChartEnd')
    return
  }

  // 使用 renderLineChart 生成配置
  const config = {
    title: props.title,
    data: props.data,
    xAxisFields: props.xAxisFields || [],
    yAxisFields: props.yAxisFields
  }

  const option = renderLineChart(config, chartConfig.value)

  // 如果没有数据，显示空图表
  if (!option) {
    const emptyOption = createEmptyChartOption(props.title, 'line')
    chartInstance.value.setOption(emptyOption)
    emits('renderChartEnd')
    return
  }

  // 设置配置项并渲染
  try {
    chartInstance.value.setOption(option, true) // true 表示不合并，完全替换
  } catch (error) {
    console.error('LineChart: setOption error', error)
  }

  emits('renderChartEnd')
}

// 监听数据和配置变化
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
div[data-canvas-type='line-chart'] {
  min-height: 300px;
  position: relative;
}
</style>
