<template>
  <!-- 折线图 -->
  <div id="line-container" class="h-full w-full" data-canvas-type="line-chart" data-canvas-component="LineChart"></div>
</template>
<script setup lang="ts">
import { Chart } from '@antv/g2'
import { renderLineChart, type LineChartConfig } from '~/composables/useChartRender'

defineOptions({
  name: 'LineChart'
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

/**
 * 默认配置
 */
const defaultLineConfig: LineChartConfig = {
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

const initChart = () => {
  emits('renderChartStart')
  // 如果没有数据，不渲染图表
  if (!props.data || props.data.length === 0) {
    emits('renderChartEnd')
    return
  }

  // 初始化图表实例
  const lineChart = new Chart({
    container: 'line-container',
    theme: 'classic',
    autoFit: true
  })

  // 使用共享的渲染逻辑
  renderLineChart(
    lineChart,
    {
      title: props.title,
      data: props.data,
      xAxisFields: props.xAxisFields,
      yAxisFields: props.yAxisFields
    },
    lineChartConfig.value
  )

  lineChart.render()

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
