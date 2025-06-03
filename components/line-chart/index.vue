<template>
  <!-- 折线图 -->
  <div id="container-line" class="h-full w-full"></div>
</template>
<script setup lang="ts">
import { Chart } from '@antv/g2'

const props = defineProps({
  // title: {
  //   type: String,
  //   default: () => '我是折线图标题'
  // },
  // subtitle: {
  //   type: String,
  //   default: () => '我是折线图副标题'
  // },
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

const chartConfigStore = useChartConfigStore()
const lineChartConfig = computed(() => {
  return chartConfigStore.chartConfig.line
})
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
const initChart = () => {
  emits('renderChartStart')
  const fields = props.yAxisFields.map(
    (item) =>
      item.alias || item.displayName || item.columnName
  )
  const chart = new Chart({
    container: 'container-line',
    theme: 'classic',
    autoFit: true
  })
  // chart.title({
  //   title: props.title,
  //   subtitle: props.subtitle
  // })
  const lineChart = chart
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
      props.xAxisFields.map((item) => item.columnName)
    )
    .encode('y', 'value')
    .encode('color', 'type')
    .scale('color', {
      range: getChartColors()
    })
    .style('strokeWidth', 5)
    .animate('enter', { type: 'pathIn' })

  // 是否画圆点
  if (lineChartConfig.value.showPoint) {
    chart
      .point()
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
        props.xAxisFields.map((item) => item.columnName)
      )
      .encode('y', 'value')
      .encode('color', 'type')
      .scale('color', {
        range: getChartColors()
      })
      .style('strokeWidth', 5)
      .animate('enter', { type: 'pathIn' })
  }
  // 是否平滑展示
  if (lineChartConfig.value.smooth) {
    lineChart.style('shape', 'smooth')
  }

  // 是否显示说明文字
  if (lineChartConfig.value.showLabel) {
    lineChart.label({
      text: 'value',
      render: (text: string) => {
        return `
        <div style="left:-50%;top:-20px;position:relative;font-size:14px;">
          <span>${text}</span>
        </div>`
      }
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
