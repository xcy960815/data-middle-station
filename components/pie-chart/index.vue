<template>
  <!-- 环形图 -->
  <div id="container-pie" class="h-full w-full"></div>
</template>

<script lang="ts" setup>
import { Chart } from '@antv/g2'

const props = defineProps({
  title: {
    type: String,
    default: () => '我是扇形图标题'
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
const pieChartConfigData = computed(
  () =>
    chartConfigStore.getChartConfig?.pie ?? {
      showLabel: false,
      chartType: 'pie'
    }
)
watch(
  () => pieChartConfigData.value,
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
  const chart = new Chart({
    container: 'container-pie',
    theme: 'classic',
    autoFit: true
  })
  chart.title({
    title: props.title
  })
  chart.coordinate({ type: 'theta', innerRadius: 0.6 })
  const fields = props.yAxisFields.map((item) => item.columnName)

  const pieChart = chart
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
    .encode('y', 'value')
    .encode('color', 'type')
    .scale('color', {
      range: getChartColors()
    })
    .label({
      text: 'value',
      style: { fontSize: 10, fontWeight: 'bold' }
    })
    .style('stroke', '#fff')
    .style('inset', 1)
    .style('radius', 10)
    .animate('enter', { type: 'waveIn' })

  if (pieChartConfigData.value.chartType === 'pie') {
    pieChart.transform({ type: 'stackY' })
  }

  if (pieChartConfigData.value.chartType === 'rose') {
    pieChart.transform({ type: 'groupX', y: 'sum' })
  }
  // 是否展示label
  if (pieChartConfigData.value.showLabel) {
    pieChart.label({
      text: props.xAxisFields.map((item) => item.columnName),
      position: 'spider',
      connectorDistance: 0,
      fontWeight: 'bold',
      textBaseline: 'bottom'
    })
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

<style scoped lang="scss"></style>
