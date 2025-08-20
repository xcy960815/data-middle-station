<template>
  <!-- 折线图 -->
  <div id="container-line" class="h-full w-full" data-canvas-type="line-chart" data-canvas-component="LineChart"></div>
</template>
<script setup lang="ts">
import { Chart } from '@antv/g2'
import { ref } from 'vue'

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
const emits = defineEmits(['renderChartStart', 'renderChartEnd'])

const chartConfigStore = useChartConfigStore()
const defaultLineConfig = {
  showPoint: false,
  showLabel: false,
  smooth: false,
  autoDualAxis: false,
  horizontalBar: false
}
/**
 * 属性配置
 */
const lineChartConfig = computed(() => chartConfigStore.privateChartConfig?.line ?? defaultLineConfig)
/**
 * 监听配置变化
 */
watch(
  () => lineChartConfig.value,
  () => {
    initChart()
  },
  {
    deep: true
  }
)

/**
 * 监听数据变化
 */
watch(
  () => props.data,
  () => {
    console.log('数据变化，重新渲染图表')
    initChart()
  },
  {
    deep: true
  }
)
/**
 * 初始化图表
 */
const chartInstance = ref<Chart | null>(null)
const initChart = () => {
  emits('renderChartStart')

  // 如果没有数据，不渲染图表
  if (!props.data || props.data.length === 0) {
    emits('renderChartEnd')
    return
  }

  // 已存在则销毁，避免重复渲染叠加
  if (chartInstance.value) {
    chartInstance.value.destroy()
    chartInstance.value = null
  }

  // 维度与度量：yAxisFields 最后一个为 X 轴，其余为度量
  const xFieldName = props.yAxisFields[props.yAxisFields.length - 1].columnName
  const measureFields = props.yAxisFields
    .slice(0, props.yAxisFields.length - 1)
    .map((item) => item.columnName) as string[]

  // 可选分组（用于单度量或双层分组）
  const groupFieldName = props.xAxisFields[0].columnName
  const useFold = measureFields.length > 1

  // 初始化图表实例
  const chart = new Chart({
    container: 'container-line',
    theme: 'classic',
    autoFit: true
  })
  chartInstance.value = chart

  // 配置图表标题
  chart.title({
    title: props.title
  })

  // 设置公共数据和编码
  chart
    .data({
      type: 'inline',
      value: props.data,
      transform: useFold ? [{ type: 'fold', fields: measureFields, key: 'key', value: 'value' }] : []
    })
    .encode('x', xFieldName)
    .encode('y', (row: ChartDataVo.ChartData) => {
      if (useFold) return row['value']
      return row[measureFields[0]]
    })
    .scale('y', { nice: true })

  // 轴标题（优先显示中文别名）
  const xFieldOption = props.yAxisFields[props.yAxisFields.length - 1]
  const xAxisTitle = xFieldOption.displayName || xFieldOption.columnComment || xFieldOption.columnName

  let yAxisTitle = ''
  if (!useFold) {
    const yFieldOption = props.yAxisFields.find((item) => item.columnName === measureFields[0])
    yAxisTitle = yFieldOption?.displayName || yFieldOption?.columnComment || yFieldOption?.columnName || ''
  }
  const yAxisOptions: { title: string; labelFormatter: string } = { title: yAxisTitle, labelFormatter: '~s' }
  chart.axis('x', { title: xAxisTitle })
  chart.axis('y', yAxisOptions)

  // 颜色与分组编码
  if (useFold && groupFieldName) {
    const seriesEncoder = (row: ChartDataVo.ChartData) => `${String(row[groupFieldName])}-${String(row['key'])}`
    chart.encode('color', seriesEncoder).encode('series', seriesEncoder)
  } else if (useFold) {
    chart.encode('color', 'key').encode('series', 'key')
  } else if (groupFieldName) {
    chart.encode('color', groupFieldName).encode('series', groupFieldName)
  }

  // 创建线条
  const lineChart = chart.line().style('strokeWidth', 2)

  // 是否画圆点
  if (lineChartConfig.value.showPoint) {
    chart.point().tooltip(false)
  }

  /**
   * 是否平滑展示
   */
  if (lineChartConfig.value.smooth) {
    lineChart.encode('shape', 'smooth')
  }

  /**
   * 是否显示说明文字
   */
  if (lineChartConfig.value.showLabel) {
    lineChart.label({
      text: useFold ? 'value' : measureFields[0],
      position: 'top',
      dy: -10,
      style: {
        textAlign: 'center',
        fontSize: 12,
        fill: '#666',
        stroke: '#fff',
        strokeWidth: 2,
        strokeOpacity: 0.8
      },
      transform: [{ type: 'overlapDodgeY' }]
    })
  }

  /**
   * 是否开启横向滚动
   */
  if (lineChartConfig.value.horizontalBar) {
    lineChart.slider('x', true)
  }

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
  },
  {
    deep: true
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
<style lang="scss"></style>
