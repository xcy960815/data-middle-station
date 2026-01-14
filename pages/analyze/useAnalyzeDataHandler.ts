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
 * @desc 分析数据处理逻辑（作为 composable 使用，确保在 Pinia 激活后再获取 store）
 */
export const useAnalyzeDataHandler = () => {
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
  const getAnalyzeData = async () => {
    const chartType = analyzeStore.getChartType
    const errorMessage = chartSuggestStrategies(chartType)
    analyzeStore.setChartErrorMessage(errorMessage)
    analyzeStore.setChartErrorAnalysis('')
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
      analyzeStore.setChartErrorAnalysis('')
    } else {
      analyzeStore.setAnalyzeData([])
      let errorMessage = `查询失败: ${result.message}`
      analyzeStore.setChartErrorMessage(errorMessage)

      // 如果有 SQL，触发 AI 分析
      if (result.sql) {
        let analysisMessage = '🤖 正在进行 AI 智能分析...\n'
        analyzeStore.setChartErrorAnalysis(analysisMessage)

        try {
          const response = await fetch('/api/analyzeError', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sql: result.sql,
              errorMessage: result.message,
              queryParams: queryAnalyzeDataParams.value
            })
          })

          const reader = response.body?.getReader()
          const decoder = new TextDecoder()

          if (reader) {
            while (true) {
              const { done, value } = await reader.read()
              if (done) break
              const chunk = decoder.decode(value, { stream: true })
              const lines = chunk.split('\n')
              for (const line of lines) {
                if (!line.trim()) continue
                try {
                  const json = JSON.parse(line)
                  if (json.type === 'ai_chunk') {
                    analysisMessage += json.content
                    analyzeStore.setChartErrorAnalysis(analysisMessage)
                  }
                } catch (e) {}
              }
            }
          }
        } catch (e) {
          analysisMessage += '\n(AI 分析服务暂时不可用)'
          analyzeStore.setChartErrorAnalysis(analysisMessage)
        }
      }
    }

    // 更新计时信息
    analyzeStore.setChartUpdateTime(dayjs().format('YYYY-MM-DD HH:mm:ss'))
    const duration = endTime - startTime
    const minutes = Math.floor(duration / 60000)
    const seconds = Math.floor((duration % 60000) / 1000)
    analyzeStore.setChartUpdateTakesTime(minutes > 0 ? `${minutes}分${seconds}秒` : `${seconds}秒`)
  }

  // 使用防抖避免频繁请求
  const debouncedQueryAnalyzeData = debounce(getAnalyzeData, 1000)

  // 监听参数变化并触发防抖请求
  watch(
    () => queryAnalyzeDataParams.value,
    () => {
      debouncedQueryAnalyzeData()
    },
    { deep: true }
  )

  return {
    getAnalyzeData
  }
}
