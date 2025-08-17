<template>
  <!-- 折线图 -->
  <div id="container-line" class="h-full w-full"></div>
</template>
<script setup lang="ts">
import { Chart } from '@antv/g2'

const props = defineProps({
  title: {
    type: String,
    default: () => ''
  },
  data: {
    type: Array as PropType<ChartDataDao.ChartData>,
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
const lineChartConfig = computed(
  () =>
    chartConfigStore.getChartConfig?.line ?? {
      showPoint: false,
      showLabel: false,
      smooth: false,
      autoDualAxis: false,
      horizontalBar: false
    }
)
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
  const fields = props.yAxisFields.map((item) => item.displayName || item.columnName)
  const chart = new Chart({
    container: 'container-line',
    theme: 'classic',
    autoFit: true
  })
  chart.title({
    title: props.title
  })
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
