<template>
  <client-only>
    <!-- 柱状图 -->
    <div
      id="interval-container"
      class="h-full w-full"
      data-canvas-type="interval-chart"
      data-canvas-component="IntervalChart"
    ></div>
  </client-only>
</template>

<script lang="ts" setup>
import { Chart } from '@antv/g2'

/**
 * 渲染柱状图 - G2版本（数据渲染 + 交互）
 * @param chart G2 图表实例
 * @param config 图表配置
 * @param chartConfig 柱状图特有配置
 */
function renderIntervalChart(chart: Chart, config: ChartRenderConfig, chartConfig: IntervalChartConfig = {}) {
  const {
    showPercentage = false,
    displayMode = 'levelDisplay',
    showLabel = false,
    horizontalDisplay = false,
    horizontalBar = false
  } = chartConfig

  // 如果没有数据，不渲染图表
  if (!config.data || config.data.length === 0) {
    return
  }

  // 处理公共数据
  const dataResult = processChartData(config)
  const { xFieldName, measureFields, groupFieldName, useFold, xAxisTitle, yAxisTitle } = dataResult

  // 配置图表标题
  setChartTitle(chart, config.title)

  const intervalChart = chart
    .interval()
    .data({
      type: 'inline',
      value: config.data,
      transform: useFold ? [{ type: 'fold', fields: measureFields, key: 'key', value: 'value' }] : []
    })
    .encode('x', xFieldName)
    .encode('y', useFold ? 'value' : measureFields[0] || 'value')
    .scale('y', { nice: true })

  // 配置轴标题
  const yAxisOptions: { title: string; labelFormatter: string } = { title: yAxisTitle, labelFormatter: '~s' }
  chart.axis('x', { title: xAxisTitle })
  chart.axis('y', yAxisOptions)

  // 颜色与分组配置
  if (useFold && groupFieldName) {
    intervalChart.encode('color', (d: ChartDataVo.ChartData) => `${d[groupFieldName]}-${d.key}`)
  } else if (useFold) {
    intervalChart.encode('color', 'key')
  } else if (groupFieldName) {
    intervalChart.encode('color', groupFieldName)
  }

  // 显示模式配置
  if (displayMode === 'levelDisplay') {
    intervalChart.transform({ type: 'dodgeX' })
  } else if (displayMode === 'stackDisplay') {
    intervalChart.transform({ type: 'stackY' })
  }

  // 百分比显示
  if (showPercentage) {
    intervalChart.axis('y', { ...yAxisOptions, labelFormatter: (d: number) => `${Number(d) / 100}%` })
  }

  // 标签显示
  if (showLabel) {
    intervalChart.label({
      text: useFold ? 'value' : measureFields[0],
      position: 'top'
    })
  }

  // 水平展示
  if (horizontalDisplay) {
    intervalChart.coordinate({
      transform: [{ type: 'transpose' }]
    })
  }

  // 横向滚动条
  if (horizontalBar) {
    intervalChart.slider('x', true)
  }

  // 添加图表交互（仅G2客户端支持）
  addChartInteractions(chart, config, dataResult)
}
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
