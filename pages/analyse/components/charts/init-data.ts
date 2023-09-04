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
    return chartStore.getChartLoading<'chartLoading'>()
  })
  /**
   * @desc 图表错误信息
   */
  const chartErrorMessage = computed(() => {
    return chartStore.getChartErrorMessage<'chartErrorMessage'>()
  })
  /**
   * @desc Y轴字段
   * @type {Array<DimensionStore.DimensionState['dimensions']>}
   */
  const yAxisFields = computed<
    DimensionStore.DimensionState['dimensions']
  >(() => {
    const dimensions =
      dimensionStore.getDimensions<'dimensions'>()
    return dimensions
  })
  /**
   * @desc X轴字段
   * @type {Array<GroupStore.GroupState['groups']>}
   */
  const xAxisFields = computed<
    GroupStore.GroupState['groups']
  >(() => {
    const groups = groupStore.getGroups<'groups'>()
    return groups
  })
  /**
   * @desc 表格数据
   * @type {Array<Chart. ChartData>}
   */
  const data = computed<Array<Chart.ChartData>>(() => {
    return [
      {
        date: '2018/8/1',
        download: 4623,
        register: 2208,
        bill: 182
      },
      {
        date: '2018/8/2',
        download: 6145,
        register: 2016,
        bill: 257
      },
      {
        date: '2018/8/3',
        download: 508,
        register: 2916,
        bill: 289
      },
      {
        date: '2018/8/4',
        download: 6268,
        register: 4512,
        bill: 428
      },
      {
        date: '2018/8/5',
        download: 6411,
        register: 8281,
        bill: 619
      },
      {
        date: '2018/8/6',
        download: 1890,
        register: 2008,
        bill: 87
      },
      {
        date: '2018/8/7',
        download: 4251,
        register: 1963,
        bill: 706
      },
      {
        date: '2018/8/8',
        download: 2978,
        register: 2367,
        bill: 387
      },
      {
        date: '2018/8/9',
        download: 3880,
        register: 2956,
        bill: 488
      },
      {
        date: '2018/8/10',
        download: 3606,
        register: 678,
        bill: 507
      },
      {
        date: '2018/8/11',
        download: 4311,
        register: 3188,
        bill: 548
      },
      {
        date: '2018/8/12',
        download: 4116,
        register: 3491,
        bill: 456
      },
      {
        date: '2018/8/13',
        download: 6419,
        register: 2852,
        bill: 689
      },
      {
        date: '2018/8/14',
        download: 1643,
        register: 4788,
        bill: 280
      },
      {
        date: '2018/8/15',
        download: 445,
        register: 4319,
        bill: 176
      }
    ]
  })
  /**
   * @desc 图表类型
   * @type {Component}
   */
  const chartType = computed(() => {
    const chartType = chartStore.getChartType<'chartType'>()
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
