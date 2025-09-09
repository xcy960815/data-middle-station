import dayjs from 'dayjs'
import { computed } from 'vue'

// 保证只注册一次 watch，并复用同一个防抖函数
let hasSetupChartDataWatcher = false
let sharedQueryChartDataDebounce: (() => Promise<void>) | null = null

/**
 * @desc 获取图表数据
 * @returns {Promise<void>}
 */
export const getChartDataHandler = () => {
  const analyseStore = useAnalyseStore()
  const dimensionStore = useDimensionStore()
  const groupStore = useGroupStore()
  const columnStore = useColumnStore()
  const filterStore = useFilterStore()
  const orderStore = useOrderStore()
  const chartConfigStore = useChartConfigStore()

  /**
   * @desc 图表推荐策略类
   * @param {AnalyseStore.AnalyseState['chartType']} chartType
   * @returns {string}
   */
  const chartSuggestStrategies = (chartType: AnalyseStore.ChartType) => {
    const dimensions = dimensionStore.getDimensions
    const groups = groupStore.getGroups
    const chartNames = {
      table: '表格',
      interval: '柱状图',
      line: '折线图',
      pie: '饼图'
    }
    switch (chartType) {
      case 'table':
        if (dimensions.length > 0 || groups.length > 0) {
          return ''
        } else {
          return `${chartNames[chartType]}至少需要一个值或者一个分组`
        }
      case 'interval':
      case 'line':
        if (dimensions.length > 0 && groups.length > 0) {
          return ''
        } else {
          return `${chartNames[chartType]}至少需要一个值和一个分组`
        }
      case 'pie':
        if (dimensions.length > 0 && groups.length > 0) {
          return ''
        } else {
          return `${chartNames[chartType]}只需要一个值和一个分组`
        }
      default:
        return ''
    }
  }
  /**
   * @desc 需要查询表格数据的参数
   */
  const queryChartDataParams = computed(() => {
    return {
      dataSource: columnStore.getDataSource,
      // 这样做可以避免条件没有选完就进行查询的情况 good
      filters: filterStore.getFilters.filter((item) => item.aggregationType && (item.filterType || item.filterValue)),
      // TODO 不知道 aggregationType 是干嘛的，先这样吧
      orders: orderStore.getOrders.filter((item) => item.aggregationType || item.orderType),
      groups: groupStore.getGroups,
      dimensions: dimensionStore.getDimensions,
      commonChartConfig: chartConfigStore.getCommonChartConfig
    }
  })
  /**
   * @desc 查询表格数据
   * @returns {Promise<void>}
   */
  const queryChartData = async () => {
    const chartType = analyseStore.getChartType
    const errorMessage = chartSuggestStrategies(chartType)
    analyseStore.setChartErrorMessage(errorMessage)
    if (errorMessage) {
      return
    }
    analyseStore.setChartLoading(true)
    const dataSource = columnStore.getDataSource
    const dimensions = dimensionStore.getDimensions
    const filters = filterStore.getFilters
    if (!dataSource) return
    if (!dimensions.length) return

    const startTime = dayjs().valueOf()

    const result = await $fetch('/api/getChartData', {
      method: 'POST',
      body: queryChartDataParams.value
    }).finally(() => {
      /**
       * 统一处理的逻辑
       */
      analyseStore.setChartLoading(false)
    })
    const endTime = dayjs().valueOf()
    if (result.code === 200) {
      analyseStore.setChartData(result.data || [])
      analyseStore.setChartErrorMessage('')
    } else {
      analyseStore.setChartData([])
      analyseStore.setChartErrorMessage(result.message)
    }

    analyseStore.setChartUpdateTime(dayjs().format('YYYY-MM-DD HH:mm:ss'))
    const duration = endTime - startTime
    const seconds = Math.floor(duration / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    analyseStore.setChartUpdateTakesTime(minutes > 0 ? `${minutes}分${remainingSeconds}秒` : `${remainingSeconds}秒`)
  }

  // 仅初始化一次防抖函数
  if (!sharedQueryChartDataDebounce) {
    sharedQueryChartDataDebounce = debounce(queryChartData, 1000)
  }

  /**
   * @desc 监听查询表格数据的参数变化
   */
  if (!hasSetupChartDataWatcher) {
    watch(
      () => queryChartDataParams.value,
      () => {
        sharedQueryChartDataDebounce && sharedQueryChartDataDebounce()
      },
      {
        deep: true
      }
    )
    hasSetupChartDataWatcher = true
  }

  return {
    queryChartDataParams,
    queryChartData
  }
}
