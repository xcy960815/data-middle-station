<template>
  <!-- 饼图 -->
  <div
    id="container-pie"
    class="h-full w-full pie-chart-container"
    data-canvas-type="pie-chart"
    data-canvas-component="PieChart"
  ></div>
</template>

<script lang="ts" setup>
import { Chart } from '@antv/g2'
import { ref } from 'vue'

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

const defaultPieConfig = {
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

/**
 * 初始化图表
 */
const chartInstance = ref<Chart | null>(null)

const initChart = () => {
  emits('renderChartStart')

  // 已存在则销毁，避免重复渲染叠加
  if (chartInstance.value) {
    chartInstance.value.destroy()
    chartInstance.value = null
  }

  // 初始化图表实例
  const chart = new Chart({
    container: 'container-pie',
    theme: 'classic',
    autoFit: true
  })

  chartInstance.value = chart

  // 配置图表标题
  chart.title({
    title: props.title
  })

  // 饼图数据处理逻辑
  // 分组字段（用于分类）：xAxisFields 第一个字段作为分类
  const categoryField = props.xAxisFields[0]?.columnName
  const categoryDisplayName = props.xAxisFields[0]?.displayName
  // 数值字段（用于计算）：yAxisFields 第一个字段作为数值
  const valueField = props.yAxisFields[0]?.columnName
  const valueDisplayName = props.yAxisFields[0]?.displayName

  if (!categoryField || !valueField) {
    // 如果没有配置字段，显示空状态
    chart.render()
    emits('renderChartEnd')
    return
  }

  // 设置极坐标系
  chart.coordinate({
    type: 'theta',
    innerRadius: 0.6
  })

  const pieChart = chart
    .interval()
    .data(props.data)
    .encode('y', valueField)
    .encode('color', categoryField)
    .scale('color', {
      range: getChartColors()
    })
    .style('stroke', '#fff')
    .style('strokeWidth', 2)

  // 配置图例
  chart.legend('color', {
    title: categoryDisplayName || categoryField
  })

  // 饼图转换
  pieChart.transform({ type: 'stackY' })

  // 标签配置
  if (pieChartConfigData.value.showLabel) {
    pieChart.label({
      text: (d: ChartDataVo.ChartData) => {
        const value = d[valueField]
        const total = props.data.reduce(
          (sum: number, item: ChartDataVo.ChartData) => sum + Number(item[valueField] || 0),
          0
        )
        const percentage = total > 0 ? ((Number(value) / total) * 100).toFixed(1) : '0.0'
        return `${percentage}%`
      },
      style: {
        fontSize: 12,
        fontWeight: 'bold',
        fill: '#fff'
      }
    })
  }

  // 配置tooltip
  chart.interaction('tooltip', {
    shared: false,
    // 自定义tooltip内容
    customContent: (title: string, data: any[]) => {
      if (!data || data.length === 0) return ''

      // 只显示当前悬停的数据项
      const currentItem = data[0]
      if (!currentItem) return ''

      // 添加调试信息
      console.log('Tooltip Debug:', {
        categoryField,
        categoryDisplayName,
        valueField,
        valueDisplayName,
        currentItem: currentItem.data
      })

      return `
        <div style="padding: 8px; background: rgba(0, 0, 0, 0.8); color: white; border-radius: 4px; font-size: 12px;">
          <div style="margin-bottom: 4px; font-weight: bold;">${currentItem.data[categoryField]}</div>
          <div style="display: flex; align-items: center;">
            <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: ${currentItem.color}; margin-right: 8px;"></span>
            <span style="margin-right: 8px;">${valueDisplayName || valueField}:</span>
            <span style="font-weight: bold;">${currentItem.data[valueField] ?? ''}</span>
          </div>
        </div>
      `
    }
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
