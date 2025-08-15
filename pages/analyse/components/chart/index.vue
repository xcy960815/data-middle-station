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
        :is="chartComponent"
        :xAxisFields="xAxisFields"
        :yAxisFields="yAxisFields"
        :data="data"
        :title="chartStore.getChartType !== 'table' ? chartTitle : undefined"
        :chart-width="chartWidth"
        :chart-height="chartHeight"
        @renderChartStart="handleRenderChartStart"
        @renderChartEnd="handleRenderChartEnd"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
// 扇形图（饼图）
import PieChart from '~/components/pie-chart/index.vue'
// 柱状图
import IntervalChart from '~/components/interval-chart/index.vue'
// 折线图
import LineChart from '~/components/line-chart/index.vue'
// 表格
import TableChart from '~/components/table-chart/canvas-table.vue'

const chartStore = useAnalyseStore()
const dimensionStore = useDimensionStore()
const groupStore = useGroupStore()

const chartWidth = ref(0)
const chartHeight = ref(0)
const chartResizeObserver = ref<ResizeObserver>()

/**
 * @desc 图表 loading
 * @type {boolean}
 */
const chartLoading = computed(() => {
  return chartStore.getChartLoading
})

const chartTitle = computed(() => {
  return chartStore.getAnalyseName
})

/**
 * @desc 图表错误信息
 */
const chartErrorMessage = computed(() => {
  return chartStore.getChartErrorMessage
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
  const chartData = chartStore.getChartData
  return chartData
})

const chartComponentMap = {
  table: TableChart,
  line: LineChart,
  interval: IntervalChart,
  pie: PieChart
}
const chartComponent = computed(() => chartComponentMap[chartStore.getChartType] || TableChart)

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
