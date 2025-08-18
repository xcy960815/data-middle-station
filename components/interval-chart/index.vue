<template>
  <!-- 柱状图 -->
  <div
    id="container-interval"
    class="h-full w-full"
    data-canvas-type="interval-chart"
    data-canvas-component="IntervalChart"
  ></div>
</template>

<script lang="ts" setup>
import { Chart } from '@antv/g2'

const props = defineProps({
  title: {
    type: String,
    default: () => '我是柱状图标题'
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
/**
 * 定义事件
 */
const emits = defineEmits(['renderChartStart', 'renderChartEnd'])

const chartConfigStore = useChartConfigStore()
/**
 * 默认配置
 */
const defaultIntervalConfig = {
  showPercentage: false,
  displayMode: 'levelDisplay',
  showLabel: false,
  horizontalDisplay: false,
  horizontalBar: false
}
/**
 * 属性配置
 */
const intervalChartConfig = computed(() => {
  return chartConfigStore.privateChartConfig?.interval || defaultIntervalConfig
})
/**
 * 监听属性配置变化
 */
watch(
  () => intervalChartConfig.value,
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
  // 初始化图表实例
  const chart = new Chart({
    container: 'container-interval',
    theme: 'classic',
    autoFit: true
  })

  // 配置图表标题
  chart.title({
    title: props.title
  })

  // 获取 y 轴字段名称
  const yAxisFieldNames = props.yAxisFields.map((item) => item.displayName || item.columnName)
  // 获取图表数据
  const chartData = props.data
  // console.log('chartData', chartData)

  // 配置图表
  const intervalChart = chart
    .interval()
    .data(chartData)
    .transform({
      type: 'sortX',
      by: 'y',
      reverse: true
    })
    .encode('x', '月份')
    .encode('y', '月均降雨量')
    .encode('color', '城市名称')
    .scale('y', { nice: true })
    .axis('y', { labelFormatter: '~s' })
    .scale('color', {
      range: getChartColors()
    })

  /**
   * 是否显示百分比
   */
  if (intervalChartConfig.value.showPercentage) {
    // TODO 值也要 展示 百分比
    intervalChart.axis({
      y: {
        labelFormatter: (d: number) => `${d / 100}%`,
        transform: [{ type: 'hide' }]
      }
    })
  }
  /**
   * 平级展示
   */
  if (intervalChartConfig.value.displayMode === 'levelDisplay') {
    intervalChart.transform({ type: 'dodgeX' })
  }
  /**
   * 叠加展示
   */
  if (intervalChartConfig.value.displayMode === 'stackDisplay') {
    intervalChart.transform({ type: 'stackY' })
  }

  /**
   * 是否显示标题
   */
  if (intervalChartConfig.value.showLabel) {
    intervalChart.label({
      text: (d: any) => d['月均降雨量'],
      position: 'top'
    })
  }

  /**
   * 是否水平展示
   */
  if (intervalChartConfig.value.horizontalDisplay) {
    intervalChart.coordinate({
      transform: [{ type: 'transpose' }]
    })
  }

  if (intervalChartConfig.value.horizontalBar) {
    intervalChart.slider('x', true)
  }

  /**
   * 配置图表交互
   */
  chart
    .interaction('tooltip', {
      shared: true,
      // 自定义tooltip内容
      customContent: (title: string, data: any[]) => {
        if (!data || data.length === 0) return ''
        return `
        <div style="padding: 8px;">
          <div style="margin-bottom: 4px;font-weight:bold;">${title}</div>
          ${data
            .map(
              (item) => `
            <div style="display: flex; align-items: center; padding: 4px 0;">
              <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: ${item.color}; margin-right: 8px;"></span>
              <span style="margin-right: 12px;">${item.data.name}</span>
              <span style="font-weight: bold;">${item.data.月均降雨量}</span>
            </div>
          `
            )
            .join('')}
        </div>
      `
      }
    })
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
<style lang="scss" scoped></style>
