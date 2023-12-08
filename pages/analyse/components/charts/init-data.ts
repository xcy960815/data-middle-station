// 扇形图（饼图）
import PieChart from '~/components/pie-chart/index.vue'
// 柱状图
import IntervalChart from '~/components/interval-chart/index.vue'
// 折线图
import LineChart from '~/components/line-chart/index.vue'
// 表格
import TableChart from '~/components/table-chart/index.vue'

export const initData = () => {
  const dimensionStore = useDimensionStore()
  const groupStore = useGroupStore()
  const chartStore = useChartStore()

  /**
   * @desc 图表 loading
   * @type {boolean}
   */
  const chartLoading = computed(() => {
    return chartStore.getChartLoading
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
    const dimensions =
      dimensionStore.getDimensions
    return dimensions
  })

  /**
   * @desc X轴字段
   * @type {Array<GroupStore.GroupState['groups']>}
   */
  const xAxisFields = computed<
    GroupStore.GroupState['groups']
  >(() => {
    const groups = groupStore.getGroups
    return groups
  })

  /**
   * @desc 表格数据
   * @type {Array<Chart. ChartData>}
   */
  const data = computed<Array<Chart.ChartData>>(() => {
    return chartStore.getChartData
  })

  /**
   * @desc 图表类型
   * @type {Component}
   */
  const chartType = computed(() => {
    const chartType = chartStore.getChartType
    switch (chartType) {
      case 'table':
        return TableChart
      case 'line':
        return LineChart
      case 'interval':
        return IntervalChart
      case 'pie':
        return PieChart
      default:
        return TableChart
    }
  })

  return {
    chartLoading,
    chartErrorMessage,
    xAxisFields,
    yAxisFields,
    data,
    chartType
  }
}
