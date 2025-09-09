<template>
  <!-- 柱状图 -->
  <div
    id="interval-container"
    class="h-full w-full"
    data-canvas-type="interval-chart"
    data-canvas-component="IntervalChart"
  ></div>
</template>

<script lang="ts" setup>
import { Chart } from '@antv/g2'

defineOptions({
  name: 'IntervalChart'
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
/**
 * 定义事件
 */
const emits = defineEmits(['renderChartStart', 'renderChartEnd'])

/**
 * 初始化图表实例
 */
const chartInstance = ref<Chart | null>(null)

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

  // 如果没有数据，不渲染图表
  if (!props.data || props.data.length === 0) {
    emits('renderChartEnd')
    return
  }

  // 已存在则销毁，避免重复渲染叠加
  if (chartInstance.value) {
    chartInstance.value.destroy()
    chartInstance.value = null
  }

  // 维度与度量：yAxisFields 最后一个为 X 轴，其余为度量
  const xFieldName = props.yAxisFields[props.yAxisFields.length - 1].columnName
  const measureFields = props.yAxisFields
    .slice(0, props.yAxisFields.length - 1)
    .map((item) => item.columnName) as string[]

  // 可选分组（用于单度量或双层分组）
  const groupFieldName = props.xAxisFields[0].columnName
  const useFold = measureFields.length > 1

  // 初始化图表实例
  const chart = new Chart({
    container: 'interval-container',
    theme: 'classic',
    autoFit: true
  })

  chartInstance.value = chart

  // 配置图表标题
  chart.title({
    title: props.title
  })

  const intervalChart = chart
    .interval()
    .data({
      type: 'inline',
      value: props.data,
      transform: useFold ? [{ type: 'fold', fields: measureFields, key: 'key', value: 'value' }] : []
    })
    .encode('x', xFieldName)
    .encode('y', useFold ? 'value' : measureFields[0] || 'value')
    .scale('y', { nice: true })

  // 轴标题（优先显示中文别名）
  const xFieldOption = props.yAxisFields[props.yAxisFields.length - 1]
  const xAxisTitle = xFieldOption?.displayName || xFieldOption?.columnComment || xFieldOption?.columnName || ''

  let yAxisTitle = ''
  if (!useFold) {
    const yFieldOption = props.yAxisFields.find((item) => item.columnName === measureFields[0])
    yAxisTitle = yFieldOption?.displayName || yFieldOption?.columnComment || yFieldOption?.columnName || ''
  }

  const yAxisOptions: { title: string; labelFormatter: string } = { title: yAxisTitle, labelFormatter: '~s' }
  chart.axis('x', { title: xAxisTitle })
  chart.axis('y', yAxisOptions)

  // 颜色与分组：
  if (useFold && groupFieldName) {
    // 双层分组：城市 × 指标
    intervalChart.encode('color', (d: ChartDataVo.ChartData) => `${d[groupFieldName]}-${d.key}`)
  } else if (useFold) {
    // 多指标分组
    intervalChart.encode('color', 'key')
  } else if (groupFieldName) {
    // 单指标，按分组字段分组
    intervalChart.encode('color', groupFieldName)
  }

  /**
   * 显示模式配置
   */
  if (intervalChartConfig.value.displayMode === 'levelDisplay') {
    // 平级展示
    intervalChart.transform({ type: 'dodgeX' })
  } else if (intervalChartConfig.value.displayMode === 'stackDisplay') {
    // 叠加展示
    intervalChart.transform({ type: 'stackY' })
  }

  /**
   * 是否显示百分比
   */
  if (intervalChartConfig.value.showPercentage) {
    intervalChart.axis('y', { ...yAxisOptions, labelFormatter: (d: number) => `${Number(d) / 100}%` })
  }

  /**
   * 是否显示标题
   */
  if (intervalChartConfig.value.showLabel) {
    intervalChart.label({
      text: useFold ? 'value' : measureFields[0],
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
      customContent: (title: string, data: ChartDataVo.ChartData[]) => {
        if (!data || data.length === 0) return ''
        const seriesFieldForTooltip = useFold ? 'key' : groupFieldName || ''
        const valueFieldForTooltip = useFold ? 'value' : measureFields[0]
        return `
        <div style="padding: 8px;">
          <div style="margin-bottom: 4px;font-weight:bold;">${title}</div>
          ${data
            .map(
              (item) => `
            <div style="display: flex; align-items: center; padding: 4px 0;">
              <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: ${item.color}; margin-right: 8px;"></span>
              <span style="margin-right: 12px;">${seriesFieldForTooltip ? ((item.data as Record<string, any>)?.[seriesFieldForTooltip] ?? '') : ''}</span>
              <span style="font-weight: bold;">${(item.data as Record<string, any>)?.[valueFieldForTooltip] ?? ''}</span>
            </div>
          `
            )
            .join('')}
        </div>
      `
      }
    })
    // 按 X 轴整列显示背景带
    .interaction('elementHighlightByX', { background: true })
    // 保留同色高亮，但不绘制背景块
    .interaction('elementHighlightByColor', { background: false })

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

// 暴露图表实例和导出方法给父组件
defineExpose({
  chartInstance,
  /**
   * 导出图表为 Base64
   * @param options
   */
  exportAsImage: async (options?: {
    type?: 'image/png' | 'image/jpeg'
    quality?: number
    width?: number
    height?: number
    backgroundColor?: string
    scale?: number
  }) => {
    if (!chartInstance.value) {
      throw new Error('图表实例不存在')
    }
    const { ChartExporter } = await import('~/utils/chart-export')
    return ChartExporter.exportChartAsBase64(chartInstance.value as InstanceType<typeof Chart>, options)
  },
  downloadChart: async (
    filename: string,
    options?: {
      type?: 'image/png' | 'image/jpeg'
      quality?: number
      width?: number
      height?: number
      backgroundColor?: string
      scale?: number
    }
  ) => {
    if (!chartInstance.value) {
      throw new Error('图表实例不存在')
    }
    const { ChartExporter } = await import('~/utils/chart-export')
    return ChartExporter.downloadChart(chartInstance.value as InstanceType<typeof Chart>, filename, options)
  }
})
</script>
<style lang="scss" scoped></style>
