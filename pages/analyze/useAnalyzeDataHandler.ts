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
  const { currentDrillDimension, drillFilters } = useAnalyzeDrill()
  const activeRequestId = ref(0)
  const activeRequestController = ref<AbortController | null>(null)
  const lastDataSourceKey = ref('')
  const pendingQueryTimer = ref<ReturnType<typeof setTimeout> | null>(null)
  const activeDrillQueryKey = ref('')
  const skipParamQueryForDrill = ref(false)

  const isAbortError = (error: unknown) => {
    return error instanceof Error && (error.name === 'AbortError' || /aborted|abort/i.test(error.message))
  }

  // ---------- 查询参数 ----------
  const queryAnalyzeDataParams = computed(() => {
    const baseFilters = filterStore.getFilters.filter(
      (item) => item.aggregationType && (item.filterType || item.filterValue)
    )
    const dimensions = currentDrillDimension.value ? [currentDrillDimension.value] : []
    const activeOrderColumnNames = new Set([
      ...dimensions.map((item) => item.columnName),
      ...measureStore.getMeasures.map((item) => item.columnName)
    ])

    return {
      dataSource: columnStore.getDataSource,
      // 过滤掉未完成的聚合条件
      filters: [...baseFilters, ...drillFilters.value],
      orders: orderStore.getOrders.filter(
        (item) => (item.aggregationType || item.orderType) && activeOrderColumnNames.has(item.columnName)
      ),
      dimensions,
      measures: measureStore.getMeasures,
      commonChartConfig: chartConfigStore.getCommonChartConfig
    }
  })

  // ---------- 实际请求 ----------
  const getAnalyzeData = async () => {
    const chartType = analyzeStore.getChartType
    const validation = validateAnalyzeChartConfig({
      chartType,
      dataSource: columnStore.getDataSource,
      measures: measureStore.getMeasures,
      dimensions: currentDrillDimension.value ? [currentDrillDimension.value] : dimensionStore.getDimensions
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

  const getDrillQueryKey = () => {
    return JSON.stringify({
      level: dimensionStore.getDrillCurrentLevel,
      path: dimensionStore.getDrillPath.map((item) => ({
        columnName: item.dimension.columnName,
        value: item.value
      }))
    })
  }

  const scheduleAnalyzeDataQuery = (delay = 1000) => {
    if (pendingQueryTimer.value) {
      clearTimeout(pendingQueryTimer.value)
      pendingQueryTimer.value = null
    }
    pendingQueryTimer.value = setTimeout(() => {
      pendingQueryTimer.value = null
      getAnalyzeData()
    }, delay)
  }
  activeDrillQueryKey.value = getDrillQueryKey()

  // 监听参数变化并触发防抖请求
  watch(
    () => queryAnalyzeDataParams.value,
    () => {
      if (activeDrillQueryKey.value !== getDrillQueryKey()) {
        return
      }
      if (skipParamQueryForDrill.value) {
        skipParamQueryForDrill.value = false
        return
      }
      scheduleAnalyzeDataQuery()
    },
    { deep: true }
  )

  watch(
    () => getDrillQueryKey(),
    (drillQueryKey) => {
      activeDrillQueryKey.value = drillQueryKey
      skipParamQueryForDrill.value = true
      scheduleAnalyzeDataQuery(300)
      setTimeout(() => {
        skipParamQueryForDrill.value = false
      }, 0)
    }
  )

  watch(
    () => dimensionStore.getDimensions.map((item) => item.columnName),
    (dimensionNames) => {
      const path = dimensionStore.getDrillPath
      if (dimensionNames.length === 0 || path.length === 0) {
        dimensionStore.resetDrill()
        return
      }

      const validPathLength = path.findIndex((item, index) => item.dimension.columnName !== dimensionNames[index])
      if (validPathLength === -1) {
        if (dimensionStore.getDrillCurrentLevel > Math.max(dimensionNames.length - 1, 0)) {
          dimensionStore.rollUpTo(Math.max(dimensionNames.length - 1, 0))
        }
        return
      }

      dimensionStore.rollUpTo(validPathLength)
    },
    { deep: true }
  )

  watch(
    () => [columnStore.getDataSourceMode, columnStore.getDataSource, columnStore.getDatasetId],
    ([dataSourceMode, dataSource, datasetId]) => {
      const nextDataSourceKey = `${dataSourceMode}:${dataSource}:${datasetId || ''}`
      if (!lastDataSourceKey.value) {
        lastDataSourceKey.value = nextDataSourceKey
        return
      }
      if (nextDataSourceKey !== lastDataSourceKey.value) {
        lastDataSourceKey.value = nextDataSourceKey
        dimensionStore.resetDrill()
      }
    },
    { immediate: true }
  )

  return {
    getAnalyzeData
  }
}
