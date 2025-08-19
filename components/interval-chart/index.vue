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
import { ref } from 'vue'
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
const chartInstance = ref<Chart | null>(null)
/**
 *
 */
const initChart = () => {
  emits('renderChartStart')

  // 已存在则销毁，避免重复渲染叠加
  if (chartInstance.value) {
    chartInstance.value.destroy()
    chartInstance.value = null
  }
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

  // 配置图表
  const intervalChart = chart
    .interval()
    .data({
      type: 'inline',
      value: [
        { name: 'London', 月份: 'Jan.', 月均降雨量: 18.9 },
        { name: 'London', 月份: 'Feb.', 月均降雨量: 28.8 },
        { name: 'London', 月份: 'Mar.', 月均降雨量: 39.3 },
        { name: 'London', 月份: 'Apr.', 月均降雨量: 81.4 },
        { name: 'London', 月份: 'May', 月均降雨量: 47 },
        { name: 'London', 月份: 'Jun.', 月均降雨量: 20.3 },
        { name: 'London', 月份: 'Jul.', 月均降雨量: 24 },
        { name: 'London', 月份: 'Aug.', 月均降雨量: 35.6 },
        { name: 'Berlin', 月份: 'Jan.', 月均降雨量: 12.4 },
        { name: 'Berlin', 月份: 'Feb.', 月均降雨量: 23.2 },
        { name: 'Berlin', 月份: 'Mar.', 月均降雨量: 34.5 },
        { name: 'Berlin', 月份: 'Apr.', 月均降雨量: 99.7 },
        { name: 'Berlin', 月份: 'May', 月均降雨量: 52.6 },
        { name: 'Berlin', 月份: 'Jun.', 月均降雨量: 35.5 },
        { name: 'Berlin', 月份: 'Jul.', 月均降雨量: 37.4 },
        { name: 'Berlin', 月份: 'Aug.', 月均降雨量: 42.4 }
      ],
      transform: [
        {
          type: 'fold',
          fields: yAxisFieldNames,
          key: 'type',
          value: 'value'
        }
      ]
    })
    .transform({
      type: 'sortX',
      by: 'y',
      reverse: true
    })
    .encode(
      'x',
      props.xAxisFields.map((item) => item.columnName)
    )
    .encode('y', 'value')
    .encode('color', 'type')
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
      text: 'value',
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
              <span style="margin-right: 12px;">${item.data['type'] ?? ''}</span>
              <span style="font-weight: bold;">${item.data['value'] ?? ''}</span>
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
  chartInstance.value = chart
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
