<template>
  <!-- 折线图 -->
  <div id="container-line" class="h-full w-full"></div>
</template>
<script setup lang="ts">
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

const chartConfigStore = useChartsConfigStore()
const lineChartsConfig = computed(() => {
  return chartConfigStore.chartConfigFormData.line
})

watch(
  () => lineChartsConfig.value,
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
  const fields = props.yAxisFields.map(
    (item) => item.alias || item.name
  )
  const chart = new Chart({
    container: 'container-line',
    theme: 'classic',
    autoFit: true
  })
  chart
    .line()
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
    .encode(
      'x',
      props.xAxisFields.map((item) => item.name)
    )
    .encode('y', 'value')
    .encode('color', 'type')
    .scale('color', {
      type: 'ordinal',
      range: getChartColors()
    })
    .style('strokeWidth', 10)
    .style('shape', 'smooth')


  if (lineChartsConfig.value.smooth) {
    console.log('smooth')
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
<style lang="less"></style>
