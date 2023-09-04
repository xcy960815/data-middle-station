<template>
  <!-- 环形图 -->
  <div id="container-pie" class="h-full w-full"></div>
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
  const chart = new Chart({
    container: 'container-pie',
    theme: 'classic',
    autoFit: true
  })
  chart.coordinate({ type: 'theta', innerRadius: 0.6 })
  const fields = props.yAxisFields.map(
    (item) => item.alias || item.name
  )
  chart
    .interval()
    .transform({ type: 'stackY' })
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
    .encode('y', 'value')
    .encode('color', 'type')
    .style('stroke', 'white')
    .style('inset', 1)
    .style('radius', 10)
    .scale('color', {
      range: getChartColors()
    })
    .label({
      text: 'type',
      style: { fontSize: 10, fontWeight: 'bold' }
    })
    .animate('enter', { type: 'waveIn' })
    

  emits('renderChartEnd')

  chart.render()
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

<style scoped lang="scss"></style>
