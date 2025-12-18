<template>
  <div class="chart relative h-full w-full overflow-hidden">
    <template v-if="chartErrorMessage">
      <div class="absolute inset-0 flex justify-center items-center">
        <div class="text-red-500 text-[14px]">
          {{ chartErrorMessage }}
        </div>
      </div>
    </template>
    <template v-else>
      <component
        ref="currentChartRef"
        v-loading="chartLoading"
        element-loading-text="数据加载中..."
        :element-loading-spinner="svg"
        element-loading-svg-view-box="-10, -10, 50, 50"
        element-loading-background="rgba(122, 122, 122, 0.8)"
        :is="chartComponent"
        :xAxisFields="xAxisFields"
        :yAxisFields="yAxisFields"
        :data="data"
        :title="chartTitle"
        :chart-width="chartWidth"
        :chart-height="chartHeight"
        @renderChartStart="handleRenderChartStart"
        @renderChartEnd="handleRenderChartEnd"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
const svg = `
        <path class="path" d="
          M 30 15
          L 28 17
          M 25.61 25.61
          A 15 15, 0, 0, 1, 15 30
          A 15 15, 0, 1, 1, 27.99 7.5
          L 15 15
        " style="stroke-width: 4px; fill: rgba(0, 0, 0, 0)"/>
      `
/**
 * 扇形图（饼图）
 */
import PieChart from '~/components/pie-chart/index.vue'
/**
 * 柱状图
 */
import IntervalChart from '~/components/interval-chart/index.vue'
/**
 * 折线图
 */
import LineChart from '~/components/line-chart/index.vue'
/**
 * 表格
 */
import TableChart from '~/components/table-chart/index.vue'

/**
 * @desc 分析器 store
 */
const analyzeStore = useAnalyzeStore()
/**
 * @desc 维度 store
 */
const dimensionStore = useDimensionsStore()
/**
 * @desc 分组 store
 */
const groupStore = useGroupsStore()

/**
 * @desc 图表宽度
 */
const chartWidth = ref<string | number>('100%')
/**
 * @desc 图表高度
 */
const chartHeight = ref<string | number>('100%')
/**
 * @desc 图表 resize 观察器
 */
const chartResizeObserver = ref<ResizeObserver>()

/**
 * @desc 图表 loading
 * @type {boolean}
 */
const chartLoading = computed(() => {
  return analyzeStore.getChartLoading
})

/**
 * @desc 图表标题
 */
const chartTitle = computed(() => analyzeStore.getAnalyzeName)

/**
 * @desc 图表错误信息
 */
const chartErrorMessage = computed(() => {
  return analyzeStore.getChartErrorMessage
})

/**
 * @desc Y轴字段
 * @type {Array<DimensionStore.DimensionState['dimensions']>}
 */
const yAxisFields = computed(() => {
  const dimensions = dimensionStore.getDimensions
  return dimensions
})

/**
 * @desc X轴字段
 * @type {Array<GroupStore.GroupState['groups']>}
 */
const xAxisFields = computed(() => {
  const groups = groupStore.getGroups
  return groups
})

/**
 * @desc 表格数据
 * @type {Array<Chart. ChartData>}
 */
const data = computed(() => {
  const analyzeData = analyzeStore.getAnalyzeData
  return analyzeData
})
/**
 * @desc 图表组件映射
 * @type {Record<string, Component>}
 */
const chartComponentMap = {
  table: TableChart,
  line: LineChart,
  interval: IntervalChart,
  pie: PieChart
}

/**
 * @desc 图表组件
 * @type {Component}
 *
 */
const chartComponent = computed(() => chartComponentMap[analyzeStore.getChartType] || TableChart)

/**
 * @desc 图表开始渲染
 * @returns {void}
 */
const handleRenderChartStart = () => {}

/**
 * @desc 图表结束渲染
 * @returns {void}
 */
const handleRenderChartEnd = () => {}

/**
 * @desc 监听图表容器变化
 * @type {ResizeObserver}
 */
onMounted(() => {
  const chartsDom = document.querySelector('.chart')
  const sizeChange = debounce(() => {
    if (chartsDom) {
      chartWidth.value = chartsDom.clientWidth
      chartHeight.value = chartsDom.clientHeight
    }
  }, 300)

  chartResizeObserver.value = new ResizeObserver(sizeChange)
  if (chartsDom) {
    chartResizeObserver.value.observe(chartsDom)
    // 初始化一次
    sizeChange()
  }
})
/**
 * @desc 销毁监听
 * @returns {void}
 */
onUnmounted(() => {
  chartResizeObserver.value?.disconnect()
})
</script>

<style lang="scss" scoped></style>
