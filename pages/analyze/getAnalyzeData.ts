import { httpRequest } from '@/composables/useHttpRequest'
import { useAnalyzeStore } from '@/stores/analyze'
import { useChartConfigStore } from '@/stores/chart-config'
import { useColumnsStore } from '@/stores/columns'
import { useDimensionsStore } from '@/stores/dimensions'
import { useFiltersStore } from '@/stores/filters'
import { useGroupsStore } from '@/stores/groups'
import { useOrdersStore } from '@/stores/orders'
import { debounce } from '@/utils/throttleDebounce'
import dayjs from 'dayjs'
import { computed, watch } from 'vue'

/**
 * 获取图表数据的处理函数
 * 每次页面挂载都会重新注册 watcher，确保离开页面后再次进入仍能请求数据。
 */
export const getAnalyzeDataHandler = () => {
  const analyzeStore = useAnalyzeStore()
  const dimensionStore = useDimensionsStore()
  const groupStore = useGroupsStore()
  const columnStore = useColumnsStore()
  const filterStore = useFiltersStore()
  const orderStore = useOrdersStore()
  const chartConfigStore = useChartConfigStore()

  // ---------- 图表推荐策略 ----------
  const chartSuggestStrategies = (chartType: AnalyzeStore.ChartType) => {
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
        return dimensions.length > 0 || groups.length > 0 ? '' : `${chartNames[chartType]}至少需要一个值或者一个分组`
      case 'interval':
      case 'line':
        return dimensions.length > 0 && groups.length > 0 ? '' : `${chartNames[chartType]}至少需要一个值和一个分组`
      case 'pie':
        return dimensions.length > 0 && groups.length > 0 ? '' : `${chartNames[chartType]}只需要一个值和一个分组`
      default:
        return ''
    }
  }

  // ---------- 查询参数 ----------
  const queryAnalyzeDataParams = computed(() => {
    return {
      dataSource: columnStore.getDataSource,
      // 过滤掉未完成的聚合条件
      filters: filterStore.getFilters.filter((item) => item.aggregationType && (item.filterType || item.filterValue)),
      orders: orderStore.getOrders.filter((item) => item.aggregationType || item.orderType),
      groups: groupStore.getGroups,
      dimensions: dimensionStore.getDimensions,
      commonChartConfig: chartConfigStore.getCommonChartConfig
    }
  })

  // ---------- 实际请求 ----------
  const queryAnalyzeData = async () => {
    const chartType = analyzeStore.getChartType
    const errorMessage = chartSuggestStrategies(chartType)
    analyzeStore.setChartErrorMessage(errorMessage)
    if (errorMessage) return

    analyzeStore.setChartLoading(true)
    const startTime = dayjs().valueOf()
    const result = await httpRequest<ApiResponseI<AnalyzeDataVo.AnalyzeData[]>>('/api/getAnalyzeData', {
      method: 'POST',
      body: queryAnalyzeDataParams.value
    }).finally(() => {
      analyzeStore.setChartLoading(false)
    })
    const endTime = dayjs().valueOf()

    if (result.code === 200) {
      analyzeStore.setAnalyzeData(result.data || [])
      analyzeStore.setChartErrorMessage('')
    } else {
      analyzeStore.setAnalyzeData([])
      analyzeStore.setChartErrorMessage(result.message)
    }

    // 更新计时信息
    analyzeStore.setChartUpdateTime(dayjs().format('YYYY-MM-DD HH:mm:ss'))
    const duration = endTime - startTime
    const minutes = Math.floor(duration / 60000)
    const seconds = Math.floor((duration % 60000) / 1000)
    analyzeStore.setChartUpdateTakesTime(minutes > 0 ? `${minutes}分${seconds}秒` : `${seconds}秒`)
  }

  // 使用防抖避免频繁请求
  const debouncedQueryAnalyzeData = debounce(queryAnalyzeData, 1000)

  // 监听参数变化并触发防抖请求
  watch(
    () => queryAnalyzeDataParams.value,
    () => {
      debouncedQueryAnalyzeData()
    },
    { deep: true }
  )

  // 首次进入页面立即请求一次数据
  queryAnalyzeData()

  return {
    queryAnalyzeDataParams,
    queryAnalyzeData
  }
}
