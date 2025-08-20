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
 * 初始化图表
 */
const chartInstance = ref<Chart | null>(null)
const initChart = () => {
  emits('renderChartStart')

  // 已存在则销毁，避免重复渲染叠加
  if (chartInstance.value) {
    chartInstance.value.destroy()
    chartInstance.value = null
  }

  // 维度与度量：yAxisFields 最后一个为 X 轴，其余为度量
  const xFieldName = props.yAxisFields[props.yAxisFields.length - 1]?.columnName
  const measureFields = props.yAxisFields
    .slice(0, Math.max(0, props.yAxisFields.length - 1))
    .map((item) => item.columnName)
    .filter(Boolean) as string[]

  // 可选分组（用于单度量或双层分组）
  const groupFieldName = props.xAxisFields[0]?.columnName
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

  const lineChart = chart
    .line()
    .data({
      type: 'inline',
      value: props.data,
      transform: useFold ? [{ type: 'fold', fields: measureFields, key: 'key', value: 'value' }] : []
    })
    .encode('x', xFieldName)
    .encode('y', (row: ChartDataVo.ChartData) => {
      if (useFold) return Number(row['value'])
      const field = measureFields[0]
      const value = field ? row[field] : row['value']
      return Number(value)
    })
    .scale('y', { nice: true })
    .style('strokeWidth', 2)
    .animate('enter', { type: 'pathIn' })

  // 轴标题（优先显示中文别名）
  const xFieldOption = props.yAxisFields[props.yAxisFields.length - 1]
  const xAxisTitle = xFieldOption?.displayName || xFieldOption?.columnComment || xFieldOption?.columnName || ''

  let yAxisTitle = '数值'
  if (!useFold && measureFields[0]) {
    const yFieldOption = props.yAxisFields.find((item) => item.columnName === measureFields[0])
    yAxisTitle = yFieldOption?.displayName || yFieldOption?.columnComment || yFieldOption?.columnName || yAxisTitle
  }
  const yAxisOptions: { title: string; labelFormatter: string } = { title: yAxisTitle, labelFormatter: '~s' }
  chart.axis('x', { title: xAxisTitle })
  chart.axis('y', yAxisOptions)

  // 颜色与分组（显式设置 series，保证按系列连线）
  if (useFold && groupFieldName) {
    const seriesEncoder = (row: Record<string, unknown>) => `${String(row[groupFieldName])}-${String(row['key'])}`
    lineChart.encode('color', seriesEncoder).encode('series', seriesEncoder)
  } else if (useFold) {
    lineChart.encode('color', 'key').encode('series', 'key')
  } else if (groupFieldName) {
    lineChart.encode('color', groupFieldName).encode('series', groupFieldName)
  }

  // 是否画圆点
  if (lineChartConfig.value.showPoint) {
    const point = chart
      .point()
      .data({
        type: 'inline',
        value: props.data,
        transform: useFold ? [{ type: 'fold', fields: measureFields, key: 'key', value: 'value' }] : []
      })
      .encode('x', xFieldName)
      .encode('y', (row: Record<string, unknown>) => {
        if (useFold) return Number(row['value'])
        const field = measureFields[0]
        const value = field ? row[field] : row['value']
        return Number(value)
      })
      .style('r', 2.5)

    if (useFold && groupFieldName) {
      const seriesEncoder = (row: Record<string, unknown>) => `${String(row[groupFieldName])}-${String(row['key'])}`
      point.encode('color', seriesEncoder).encode('series', seriesEncoder)
    } else if (useFold) {
      point.encode('color', 'key').encode('series', 'key')
    } else if (groupFieldName) {
      point.encode('color', groupFieldName).encode('series', groupFieldName)
    }
  }

  // 是否平滑展示
  if (lineChartConfig.value.smooth) {
    lineChart.style('shape', 'smooth')
  }

  // 是否显示说明文字
  if (lineChartConfig.value.showLabel) {
    lineChart.label({
      text: useFold ? 'value' : measureFields[0] || 'value'
    })
  }

  // 是否开启横向滚动
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
