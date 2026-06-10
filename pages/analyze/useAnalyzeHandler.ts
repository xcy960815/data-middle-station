import { httpRequest } from '@/composables/useHttpRequest'
import { ElMessage } from 'element-plus'
import { useAnalyzeDraft } from './useAnalyzeDraft'

/**
 * @desc 获取图表配置 handler
 */
export const useAnalyzeHandler = () => {
  const analyzeStore = useAnalyzeStore()
  const columnStore = useColumnsStore()
  const measureStore = useMeasuresStore()
  const filterStore = useFiltersStore()
  const dimensionStore = useDimensionsStore()
  const orderStore = useOrdersStore()
  const chartConfigStore = useChartConfigStore()
  const { serializeAnalyzeDraft } = useAnalyzeDraft()

  /**
   * 将分析的配置 配置到各个 store 中
   * @param {AnalyzeVo.AnalyzeDetailResponse} data
   */
  const applyAnalyzeDetail = (data: AnalyzeVo.AnalyzeDetailResponse) => {
    // 分析名称
    analyzeStore.setAnalyzeName(data.analyzeName)
    // 分析描述
    analyzeStore.setAnalyzeDesc(data.analyzeDesc)
    // 分析 id
    analyzeStore.setAnalyzeId(data.id)
    // 分析配置 id
    analyzeStore.setCurrentConfigId(data.currentConfigId)

    const chartConfig = data.chartConfig
    analyzeStore.setChartType((chartConfig?.chartType as AnalyzeStore.ChartType) || 'table')
    measureStore.setMeasures(chartConfig?.measures || [])
    filterStore.setFilters(chartConfig?.filters || [])
    dimensionStore.setDimensions(chartConfig?.dimensions || [])
    orderStore.setOrders(chartConfig?.orders || [])
    chartConfigStore.setCommonChartConfig(chartConfig?.commonChartConfig || chartConfigStore.$state.commonChartConfig)
    chartConfigStore.setPrivateChartConfig(
      chartConfig?.privateChartConfig || chartConfigStore.$state.privateChartConfig
    )
    columnStore.setColumns([])
    columnStore.setDatasetId(chartConfig?.datasetId || null)
    columnStore.setDatasetName(chartConfig?.commonChartConfig?.datasetName || '')

    // 所有 store 填充完毕后，再记录快照，确保脏检查基准正确
    analyzeStore.setLastSavedSnapshot(serializeAnalyzeDraft())
    analyzeStore.setEditorDirty(false)
    analyzeStore.setLastSavedAt(data.updateTime || '')
  }

  /**
   * @desc 获取图表配置
   */
  const getAnalyze = async () => {
    const route = useRoute()
    const id = route.params.id || route.query.id
    if (!id) {
      ElMessage.error('图表id不能为空')
      return
    }

    analyzeStore.setEditorHydrating(true)

    try {
      const result = await httpRequest<ApiResponseI<AnalyzeVo.AnalyzeDetailResponse>>('/api/getAnalyze', {
        method: 'post',
        body: {
          id,
          trackViewCount: true
        }
      })
      if (result.code === 200) {
        applyAnalyzeDetail(result.data!)
      }
    } finally {
      analyzeStore.setEditorHydrating(false)
    }
  }

  return {
    applyAnalyzeDetail,
    getAnalyze
  }
}
