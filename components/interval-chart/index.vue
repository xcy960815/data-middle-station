<template>
  <!-- 柱状图 -->
  <div id="container-interval" class="h-full w-full"></div>
</template>

<script lang="ts" setup>
import { Chart } from '@antv/g2'

const props = defineProps({
  title: {
    type: String,
    default: () => '我是柱状图标题'
  },
  // subtitle: {
  //   type: String,
  //   default: () => '我是柱状图副标题'
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
const defaultIntervalConfig = {
  showPercentage: false,
  displayMode: 'levelDisplay',
  showLabel: false,
  horizontalDisplay: false,
  horizontalBar: false
}
const intervalChartConfig = computed(() => {
  return (
    chartConfigStore.chartConfig?.interval ||
    defaultIntervalConfig
  )
})
/**
 * 监听配置变化
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

  chart.title({
    title: props.title
    // subtitle: props.subtitle
  })

  const yAxisFieldNames = props.yAxisFields.map(
    (item) =>
      item.alias || item.displayName || item.columnName
  )
  const chartData = props.data
  console.log(
    'chartData',
    JSON.stringify(chartData, null, 2)
  )
  const intervalChart = chart
    .interval()
    .data({
      type: 'inline',
      value: chartData,
      transform: [
        {
          type: 'fold',
          fields: yAxisFieldNames,
          key: 'type',
          value: '活跃用户数'
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
      props.xAxisFields.map(
        (item) =>
          item.alias || item.displayName || item.columnName
      )
    )
    .encode('y', '活跃用户数')
    .encode('color', 'type')
    .scale('y', { nice: true })
    .axis('y', { labelFormatter: '~s' })
    .scale('color', {
      range: getChartColors()
    })

  // 是否显示百分比
  if (intervalChartConfig.value.showPercentage) {
    // TODO 值也要 展示 百分比
    intervalChart.axis({
      y: {
        labelFormatter: (d: number) => `${d / 100}%`,
        transform: [{ type: 'hide' }]
      }
    })
  }
  // 平级展示
  if (
    intervalChartConfig.value.displayMode === 'levelDisplay'
  ) {
    intervalChart.transform({ type: 'dodgeX' })
  }
  // 叠加展示
  if (
    intervalChartConfig.value.displayMode === 'stackDisplay'
  ) {
    intervalChart.transform({ type: 'stackY' })
  }

  // 是否显示标题
  if (intervalChartConfig.value.showLabel) {
    intervalChart.label({
      text: '标题',
      render: (text: string) => {
        return `
        <div style="left:-50%;top:-20px;position:relative;font-size:14px;">
          <span>${text}</span>
        </div>`
      }
    })
  }

  // 是否水平展示
  if (intervalChartConfig.value.horizontalDisplay) {
    intervalChart.coordinate({
      transform: [{ type: 'transpose' }]
    })
  }

  if (intervalChartConfig.value.horizontalBar) {
    intervalChart.slider('x', true)
  }

  // 配置图表交互
  // chart
  //   .interaction('tooltip', {
  //     shared: false,
  //     // 自定义tooltip内容
  //     customContent: (title: string, data: any[]) => {
  //       if (!data || data.length === 0) return ''
  //       const item = data[0]
  //       // 打印 item 看看结构
  //       console.log('tooltip item:', item)
  //       const fieldName =
  //         item.type ||
  //         (item.data && item.data.type) ||
  //         item.name
  //       return `
  //       <div style="padding: 8px;">
  //         <div style="display: flex; align-items: center; padding: 4px 0;">
  //           <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: ${item.color}; margin-right: 8px;"></span>
  //           <span style="margin-right: 12px;">${fieldName}</span>
  //           <span style="font-weight: bold;">${item['活跃用户数']}</span>
  //         </div>
  //       </div>
  //     `
  //     }
  //   })
  //   .interaction('elementHighlightByColor', {
  //     background: true
  //   })

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
