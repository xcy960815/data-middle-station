import { httpRequest } from '@/composables/useHttpRequest'
import { useAnalyzeStore } from '@/stores/analyze'
import { useChartConfigStore } from '@/stores/chart-config'
import { useColumnsStore } from '@/stores/columns'
import { useMeasuresStore } from '@/stores/measures'
import { useFiltersStore } from '@/stores/filters'
import { useDimensionsStore } from '@/stores/dimensions'
import { useOrdersStore } from '@/stores/orders'
import { validateAnalyzeChartConfig } from '@/utils/validateAnalyzeChartConfig'
import dayjs from 'dayjs'
import { computed, ref, watch } from 'vue'
import { useAnalyzeDrill } from './useAnalyzeDrill'

type GetAnalyzeDataOptions = {
  force?: boolean
}

/**
 * @desc 分析数据处理逻辑（作为 composable 使用，确保在 Pinia 激活后再获取 store）
 */
export const useAnalyzeDataHandler = () => {
  const analyzeStore = useAnalyzeStore()
  const measureStore = useMeasuresStore()
  const dimensionStore = useDimensionsStore()
  const columnStore = useColumnsStore()
  const filterStore = useFiltersStore()
  const orderStore = useOrdersStore()
  const chartConfigStore = useChartConfigStore()
  const { drillDimensions, currentDrillDimension, drillPath, drillFilters } = useAnalyzeDrill()
  const activeRequestId = ref(0)
  const activeRequestController = ref<AbortController | null>(null)
  const lastDataSourceKey = ref('')
  const pendingQueryTimer = ref<ReturnType<typeof setTimeout> | null>(null)
  const pendingQueryForce = ref(false)
  const lastQueryKey = ref('')

  const isAbortError = (error: unknown) => {
    return error instanceof Error && (error.name === 'AbortError' || /aborted|abort/i.test(error.message))
  }

  const isDrillQueryEnabled = computed(() => drillDimensions.value.length > 1)

  // ---------- 查询参数 ----------
  const queryAnalyzeDataParams = computed(() => {
    const baseFilters = filterStore.getFilters.filter(
      (item) => item.filterRule.aggregation && (item.filterRule.operator || item.filterRule.operand)
    )
    const dimensions =
      isDrillQueryEnabled.value && currentDrillDimension.value
        ? [currentDrillDimension.value]
        : dimensionStore.getDimensions

    return {
      analyzeId: analyzeStore.getAnalyzeId || undefined,
      dataSource: columnStore.getDataSource,
      // 过滤掉未完成的聚合条件
      filters: [...baseFilters, ...(isDrillQueryEnabled.value ? drillFilters.value : [])],
      orders: orderStore.getOrders.filter((item) => item.orderRule?.direction),
      dimensions,
      measures: measureStore.getMeasures,
      commonChartConfig: chartConfigStore.getCommonChartConfig
    }
  })

  // ---------- 实际请求 ----------

  /**
   * 通过 SSE 流式接口请求 AI 对查询错误的分析，逐步更新分析文本。
   * @param {object} params 错误上下文。
   * @param {string} params.errorMessage 后端返回的错误信息。
   * @param {AbortSignal} params.signal 请求中断信号。
   * @param {number} params.requestId 当前请求标识，用于判断是否已被新请求取代。
   * @returns {Promise<void>}
   */
  const streamAnalyzeErrorAnalysis = async (params: {
    errorMessage: string
    signal: AbortSignal
    requestId: number
  }): Promise<void> => {
    let analysisMessage = '🤖 正在进行 AI 智能分析...\n'
    analyzeStore.setChartErrorAnalysis(analysisMessage)

    try {
      const response = await fetch('/api/analyzeError', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: params.signal,
        body: JSON.stringify({
          errorMessage: params.errorMessage,
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
              if (params.requestId !== activeRequestId.value || params.signal.aborted) {
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
    } catch (error) {
      if (params.requestId !== activeRequestId.value || isAbortError(error)) {
        return
      }
      analysisMessage += '\n(AI 分析服务暂时不可用)'
      analyzeStore.setChartErrorAnalysis(analysisMessage)
    }
  }

  /**
   * 更新查询耗时和完成时间到 store。
   * @param {number} startTime 查询开始的时间戳（毫秒）。
   * @returns {void}
   */
  const updateQueryTimingInfo = (startTime: number): void => {
    analyzeStore.setChartUpdateTime(dayjs().format('YYYY-MM-DD HH:mm:ss'))
    const duration = dayjs().valueOf() - startTime
    const minutes = Math.floor(duration / 60000)
    const seconds = Math.floor((duration % 60000) / 1000)
    analyzeStore.setChartUpdateTakesTime(minutes > 0 ? `${minutes}分${seconds}秒` : `${seconds}秒`)
  }

  const getAnalyzeData = async (options: GetAnalyzeDataOptions = {}) => {
    const chartType = analyzeStore.getChartType
    const validation = validateAnalyzeChartConfig({
      chartType,
      dataSource: columnStore.getDataSource,
      measures: measureStore.getMeasures,
      dimensions:
        isDrillQueryEnabled.value && currentDrillDimension.value
          ? [currentDrillDimension.value]
          : dimensionStore.getDimensions
    })
    analyzeStore.setChartErrorMessage(validation.message)
    analyzeStore.setChartErrorAnalysis('')
    if (!validation.valid) return

    const queryKey = JSON.stringify({
      ...queryAnalyzeDataParams.value,
      orderState: orderStore.getOrders.map((item) => ({
        columnName: item.columnName,
        direction: item.orderRule?.direction,
        aggregation: item.orderRule?.aggregation
      }))
    })
    if (!options.force && queryKey === lastQueryKey.value) return
    lastQueryKey.value = queryKey

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
    if (!result || requestId !== activeRequestId.value || requestController.signal.aborted) {
      return
    }

    if (result.code === 200) {
      analyzeStore.setAnalyzeData(result.data || [])
      analyzeStore.setChartErrorMessage('')
      analyzeStore.setChartErrorAnalysis('')
    } else {
      analyzeStore.setAnalyzeData([])
      analyzeStore.setChartErrorMessage(`查询失败: ${result.message}`)

      await streamAnalyzeErrorAnalysis({
        errorMessage: result.message,
        signal: requestController.signal,
        requestId
      })
    }

    updateQueryTimingInfo(startTime)
  }

  const isEditorHydrating = () => analyzeStore.getEditorHydrating

  const scheduleAnalyzeDataQuery = (delay = 1000, options: GetAnalyzeDataOptions = {}) => {
    if (isEditorHydrating()) return
    if (pendingQueryTimer.value) {
      clearTimeout(pendingQueryTimer.value)
      pendingQueryTimer.value = null
    }
    pendingQueryForce.value = options.force || pendingQueryForce.value
    pendingQueryTimer.value = setTimeout(() => {
      pendingQueryTimer.value = null
      const force = pendingQueryForce.value
      pendingQueryForce.value = false
      getAnalyzeData({ force })
    }, delay)
  }
  // 监听参数变化并触发防抖请求
  watch(
    () => queryAnalyzeDataParams.value,
    () => {
      if (isEditorHydrating()) return
      scheduleAnalyzeDataQuery()
    },
    { deep: true }
  )

  watch(
    () => drillDimensions.value.map((item) => item.columnName),
    (dimensionNames, previousDimensionNames) => {
      if (isEditorHydrating()) return
      if (dimensionNames.length === 0 || drillPath.value.length === 0) return

      const changedIndex = dimensionNames.findIndex((columnName, index) => columnName !== previousDimensionNames[index])
      if (changedIndex !== -1) {
        dimensionStore.rollUpTo(changedIndex)
        return
      }

      const maxEffectiveLevel = Math.max(dimensionNames.length - 1, 0)
      if (drillPath.value.length > maxEffectiveLevel) {
        dimensionStore.rollUpTo(maxEffectiveLevel)
      }
    },
    { deep: true, flush: 'sync' }
  )

  watch(
    () => [columnStore.getDataSourceMode, columnStore.getDataSource, columnStore.getDatasetId],
    ([dataSourceMode, dataSource, datasetId]) => {
      const nextDataSourceKey = `${dataSourceMode}:${dataSource}:${datasetId || ''}`
      if (isEditorHydrating()) {
        lastDataSourceKey.value = nextDataSourceKey
        return
      }
      if (!lastDataSourceKey.value) {
        lastDataSourceKey.value = nextDataSourceKey
        return
      }
      if (nextDataSourceKey !== lastDataSourceKey.value) {
        lastDataSourceKey.value = nextDataSourceKey
        dimensionStore.resetDrill()
      }
    },
    { immediate: true, flush: 'sync' }
  )

  watch(
    () => analyzeStore.getEditorHydrating,
    (hydrating, wasHydrating) => {
      if (wasHydrating && !hydrating) {
        scheduleAnalyzeDataQuery(0, { force: true })
      }
    }
  )

  return {
    getAnalyzeData
  }
}
