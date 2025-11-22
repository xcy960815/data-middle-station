<template>
  <client-only>
    <!-- 饼图 -->
    <div
      id="pie-container"
      class="h-full w-full pie-chart-container"
      data-canvas-type="pie-chart"
      data-canvas-component="PieChart"
    ></div>
  </client-only>
</template>

<script lang="ts" setup>
import { Chart } from '@antv/g2'
import { renderPieChart, type PieChartConfig } from '~/composables/useChartRender'

defineOptions({
  name: 'PieChart'
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

const emits = defineEmits(['renderChartStart', 'renderChartEnd'])

const chartConfigStore = useChartConfigStore()

const defaultPieConfig: PieChartConfig = {
  showLabel: false,
  chartType: 'pie',
  innerRadius: 0.6
}

const pieChartConfigData = computed(() => chartConfigStore.getPrivateChartConfig?.pie ?? defaultPieConfig)

watch(
  () => pieChartConfigData.value,
  () => {
    initChart()
  },
  {
    deep: true
  }
)

const initChart = () => {
  emits('renderChartStart')

  // 初始化图表实例
  const pieChart = new Chart({
    container: 'pie-container',
    theme: 'classic',
    autoFit: true
  })

  // 使用共享的渲染逻辑
  renderPieChart(
    pieChart,
    {
      title: props.title,
      data: props.data,
      xAxisFields: props.xAxisFields,
      yAxisFields: props.yAxisFields
    },
    pieChartConfigData.value
  )

  pieChart.render()

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

<style scoped lang="scss">
.pie-chart-container {
  position: relative;
}
</style>
