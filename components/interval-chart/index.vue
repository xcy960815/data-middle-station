<template>
  <!-- 柱状图 -->
  <div
    id="interval-container"
    class="h-full w-full"
    data-canvas-type="interval-chart"
    data-canvas-component="IntervalChart"
  ></div>
</template>

<script lang="ts" setup>
import { Chart } from '@antv/g2'
import { renderIntervalChart, type IntervalChartConfig } from '~/composables/useChartRender'

defineOptions({
  name: 'IntervalChart'
})

const props = defineProps({
  title: {
    type: String,
    default: () => ''
  },
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
  }
})

/**
 * 定义事件
 */
const emits = defineEmits(['renderChartStart', 'renderChartEnd'])

const chartConfigStore = useChartConfigStore()

/**
 * 默认配置
 */
const defaultIntervalConfig: IntervalChartConfig = {
  showPercentage: false,
  displayMode: 'levelDisplay',
  showLabel: false,
  horizontalDisplay: false,
  horizontalBar: false
}

/**
 * 属性配置
 */
const intervalChartConfig = computed(() => {
  return chartConfigStore.privateChartConfig?.interval || defaultIntervalConfig
})

/**
 * 监听属性配置变化
 */
watch(
  () => intervalChartConfig.value,
  () => {
    initChart()
  },
  {
    deep: true
  }
)

/**
 * 初始化图表
 */
const initChart = () => {
  emits('renderChartStart')

  // 如果没有数据，不渲染图表
  if (!props.data || props.data.length === 0) {
    emits('renderChartEnd')
    return
  }

  // 初始化图表实例
  const chart = new Chart({
    container: 'interval-container',
    theme: 'classic',
    autoFit: true
  })

  // 使用共享的渲染逻辑
  renderIntervalChart(
    chart,
    {
      title: props.title,
      data: props.data,
      xAxisFields: props.xAxisFields,
      yAxisFields: props.yAxisFields
    },
    intervalChartConfig.value
  )

  chart.render()

  emits('renderChartEnd')
}

onMounted(() => {
  initChart()
})

watch(
  () => props.data,
  () => {
    initChart()
  }
)
watch(
  () => props.xAxisFields,
  () => {
    initChart()
  },
  {
    deep: true
  }
)
watch(
  () => props.yAxisFields,
  () => {
    initChart()
  },
  {
    deep: true
  }
)
</script>
<style lang="scss" scoped></style>
