/**
 * @desc 逻辑处理
 */
export const handler = () => {
  const filterStore = useFilterStore()
  const orderStore = useOrderStore()
  const dimensionStore = useDimensionStore()
  const groupStore = useGroupStore()
  const chartStore = useChartStore()
  /**
   * @desc 分析参数
   */
  const analyseParams = computed(() => {
    return {
      filter: filterStore.getFilters(),
      order: orderStore.getOrders(),
      dimension: dimensionStore.getDimensions(),
      group: groupStore.getGroups()
      // chartType: chartStore.getChartType<'chartType'>()
    }
  })
  // 图表推荐策略类
  const chartSuggestStrategies = (
    chartType: ChartStore.ChartState['chartType']
  ) => {
    const dimensions = dimensionStore.getDimensions()
    const groups = groupStore.getGroups()
    switch (chartType) {
      case 'table':
      case 'interval':
      case 'line':
      case 'pie':
        const chartName = {
          table: '表格',
          interval: '柱状图',
          line: '折线图',
          pie: '饼图'
        }
        if (dimensions.length > 0 || groups.length > 0) {
          return ''
        } else {
          return `${chartName[chartType]}至少需要一个值或者一个分组`
        }
      default:
        return ''
    }
  }

  /**
   * @desc 获取分析数据
   */
  const getAnalyseData = () => {
    /**
     * @desc 前置校验先检查维度、分组是否有值
     */
    const chartType = chartStore.getChartType<'chartType'>()
    const errorMessage = chartSuggestStrategies(chartType)
    chartStore.setChartErrorMessage(errorMessage)
    if (errorMessage) {
      return
    }
    chartStore.setChartLoading(true)
    setTimeout(() => {
      chartStore.setChartLoading(false)
    }, 1000)
  }

  onMounted(() => {
    getAnalyseData()
  })

  watch(
    () => analyseParams.value,
    () => {
      getAnalyseData()
    },
    { deep: true }
  )

  return {}
}
