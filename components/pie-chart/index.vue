<template>
  <!-- 饼图 -->
  <div
    ref="chartContainer"
    class="h-full w-full pie-chart-container"
    data-canvas-type="pie-chart"
    data-canvas-component="PieChart"
  ></div>
</template>

<script setup lang="ts">
import { PieChart } from 'echarts/charts'
import { GraphicComponent, LegendComponent, TitleComponent, TooltipComponent } from 'echarts/components'
import { init, type ECharts, type EChartsCoreOption } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { useChartRender } from '~/composables/useChartRender/index'

// 注册必要的组件
import { use } from 'echarts/core'
use([PieChart, TitleComponent, TooltipComponent, LegendComponent, GraphicComponent, CanvasRenderer])

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

const chartContainer = ref<HTMLElement | null>(null)
const chartInstance = ref<ECharts | null>(null)

// 使用图表渲染 composable
const { renderPieChart } = useChartRender()

// 获取图表配置
const chartConfigStore = useChartConfigStore()

const chartConfig = computed(() => {
  return (
    chartConfigStore.privateChartConfig?.pie || {
      showLabel: false,
      chartType: 'pie' as 'pie' | 'rose'
    }
  )
})

const initChart = () => {
  emits('renderChartStart')

  if (!chartContainer.value) {
    console.warn('PieChart: chartContainer is not available')
    emits('renderChartEnd')
    return
  }

  // 如果图表实例已存在，先销毁
  if (chartInstance.value) {
    chartInstance.value.dispose()
    chartInstance.value = null
  }

  // 初始化图表实例
  try {
    chartInstance.value = init(chartContainer.value)
  } catch (error) {
    console.error('PieChart: init error', error)
    emits('renderChartEnd')
    return
  }

  // 使用 renderPieChart 生成配置
  const config = {
    title: props.title,
    data: props.data,
    xAxisFields: props.xAxisFields || [],
    yAxisFields: props.yAxisFields
  }

  const option = renderPieChart(config, chartConfig.value)

  // 如果没有数据，显示空图表
  if (!option) {
    const emptyOption: EChartsCoreOption = {
      title: {
        text: props.title || '饼图',
        left: 'center',
        top: 10
      },
      graphic: {
        type: 'text',
        left: 'center',
        top: 'center',
        style: {
          text: '暂无数据',
          fontSize: 14,
          fill: '#999'
        }
      }
    }
    chartInstance.value.setOption(emptyOption)
    emits('renderChartEnd')
    return
  }

  // 设置配置项并渲染
  try {
    chartInstance.value.setOption(option, true) // true 表示不合并，完全替换
  } catch (error) {
    console.error('PieChart: setOption error', error)
  }

  emits('renderChartEnd')
}

// 监听数据和配置变化
watch(
  () => [props.data, props.xAxisFields, props.yAxisFields, chartConfig.value],
  () => {
    nextTick(() => {
      initChart()
    })
  },
  { deep: true }
)

onMounted(() => {
  nextTick(() => {
    initChart()
  })
})

onBeforeUnmount(() => {
  if (chartInstance.value) {
    chartInstance.value.dispose()
    chartInstance.value = null
  }
})
</script>

<style scoped lang="scss">
.pie-chart-container {
  position: relative;
}
</style>
