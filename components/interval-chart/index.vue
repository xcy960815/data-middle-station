<template>
  <!-- 柱状图 -->
  <div id="container-interval" class="h-full w-full"></div>
</template>

<script lang="ts" setup>
import { Chart } from '@antv/g2'


const props = defineProps({
  data: {
    type: Array as PropType<Array<Chart.ChartData>>,
    default: () => []
  },
  xAxisFields: {
    type: Array as PropType<Array<Chart.XAxisFields>>,
    default: () => []
  },
  yAxisFields: {
    type: Array as PropType<Array<Chart.YAxisFields>>,
    default: () => []
  }
})
const emits = defineEmits([
  'renderChartStart',
  'renderChartEnd'
])
/**
 * 初始化图表
 */
const initChart = () => {
  emits('renderChartStart')
  // 初始化图表实例
  const chart = new Chart({
    container: 'container-interval',
    theme: 'classic',
    autoFit: true
  })
  chart.title({
    title: '我是图表标题',
    subtitle:
      '我是图表备注'
  })
  const fields = props.yAxisFields.map(
    (item) => item.alias || item.name
  )
  chart
    .interval()
    .data({
      type: 'inline',
      value: props.data,
      transform: [
        {
          type: 'fold',
          fields: fields,
          key: 'type',
          value: 'value'
        }
      ]
    })
    .transform({
      type: 'sortX',
      by: 'y',
      reverse: true,
      slice: 6
    })
    .transform({ type: 'dodgeX' })
    .encode('x', props.xAxisFields.map((item) => item.name))
    .encode('y', 'value')
    .encode('color', 'type')
    .scale('y', { nice: true })
    .axis('y', { labelFormatter: '~s' })
    .scale('color', {
      type: 'ordinal',
      range: getChartColors()
    })
    

    chart
    .interaction('tooltip', { shared: true })
    .interaction('elementHighlightByColor', {
      background: true
    })
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
  }
)
watch(
  () => props.yAxisFields,
  () => {
    initChart()
  }
)
</script>
<style lang="less" scoped></style>
