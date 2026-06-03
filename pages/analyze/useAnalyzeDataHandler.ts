import { httpRequest } from '@/composables/useHttpRequest'
import { useAnalyzeStore } from '@/stores/analyze'
import { useChartConfigStore } from '@/stores/chart-config'
import { useColumnsStore } from '@/stores/columns'
import { useDimensionsStore } from '@/stores/dimensions'
import { useFiltersStore } from '@/stores/filters'
import { useGroupsStore } from '@/stores/groups'
import { useOrdersStore } from '@/stores/orders'
import { debounce } from '@/utils/throttleDebounce'
import { validateAnalyzeChartConfig } from '@/utils/validateAnalyzeChartConfig'
import dayjs from 'dayjs'
import { computed, ref, watch } from 'vue'

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
  const activeRequestId = ref(0)
  const activeRequestController = ref<AbortController | null>(null)

  const isAbortError = (error: unknown) => {
    return error instanceof Error && (error.name === 'AbortError' || /aborted|abort/i.test(error.message))
  }

  // ---------- 查询参数 ----------
  const queryAnalyzeDataParams = computed(() => {
    return {
      dataSource: columnStore.getDataSource,
      // 过滤掉未完成的聚合条件
      filters: filterStore.getFilters.filter((item) => item.aggregationType && (item.filterType || item.filterValue)),
      orders: orderStore.getOrders.filter((item) => item.aggregationType || item.orderType),
      groups: groupStore.getGroups,
      dimensions: dimensionStore.getMeasures,
      commonChartConfig: chartConfigStore.getCommonChartConfig
    }
  })

  // ---------- 实际请求 ----------
  const getAnalyzeData = async () => {
    const chartType = analyzeStore.getChartType
    const validation = validateAnalyzeChartConfig({
      chartType,
      dataSource: columnStore.getDataSource,
      dimensions: dimensionStore.getMeasures,
      groups: groupStore.getGroups
    })
    analyzeStore.setChartErrorMessage(validation.message)
    analyzeStore.setChartErrorAnalysis('')
    if (!validation.valid) return

    const requestId = activeRequestId.value + 1
    activeRequestId.value = requestId
    activeRequestController.value?.abort()
    const requestController = new AbortController()
    activeRequestController.value = requestController

    analyzeStore.setChartLoading(true)
    const startTime = dayjs().valueOf()
    let result: ApiResponseI<AnalyzeDataVo.AnalyzeData[]> | null = null
    try {
      result = await httpRequest<ApiResponseI<AnalyzeDataVo.AnalyzeData[]>>('/api/getAnalyzeData', {
        method: 'POST',
        body: queryAnalyzeDataParams.value,
        signal: requestController.signal
      })
    } catch (error) {
      if (requestId !== activeRequestId.value || isAbortError(error)) {
        return
      }

      analyzeStore.setAnalyzeData([])
      analyzeStore.setChartErrorMessage(error instanceof Error ? error.message : '查询失败，请稍后重试')
      analyzeStore.setChartErrorAnalysis('')
      return
    } finally {
      if (requestId === activeRequestId.value) {
        analyzeStore.setChartLoading(false)
      }
      if (activeRequestController.value === requestController) {
        activeRequestController.value = null
      }
    }
    const endTime = dayjs().valueOf()
    if (!result || requestId !== activeRequestId.value || requestController.signal.aborted) {
      return
    }

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
            signal: requestController.signal,
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
                  if (requestId !== activeRequestId.value || requestController.signal.aborted) {
                    return
                  }
                  if (json.type === 'ai_chunk') {
                    analysisMessage += json.content
                    analyzeStore.setChartErrorAnalysis(analysisMessage)
                  }
                } catch (_error) {
                  // 忽略非 JSON 的流式分片，继续消费后续 AI 输出
                }
              }
            }
          }
        } catch (e) {
          if (requestId !== activeRequestId.value || isAbortError(e)) {
            return
          }
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
