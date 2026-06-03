import { httpRequest } from '@/composables/useHttpRequest'
import { ElMessage } from 'element-plus'
import { useAnalyzeDraft } from './useAnalyzeDraft'

/**
 * @desc 获取图表配置 handler
 */
export const useAnalyzeHandler = () => {
  const analyzeStore = useAnalyzeStore()
  const columnStore = useColumnsStore()
  const dimensionStore = useDimensionsStore()
  const filterStore = useFiltersStore()
  const groupStore = useGroupsStore()
  const orderStore = useOrdersStore()
  const chartConfigStore = useChartConfigStore()
  const { serializeAnalyzeDraft } = useAnalyzeDraft()

  const applyAnalyzeDetail = (data: AnalyzeVo.AnalyzeDetailResponse) => {
    analyzeStore.setAnalyzeName(data.analyzeName)
    analyzeStore.setAnalyzeDesc(data.analyzeDesc)
    analyzeStore.setAnalyzeId(data.id)
    analyzeStore.setCurrentConfigId(data.currentConfigId)

    const chartConfig = data.chartConfig
    analyzeStore.setChartType((chartConfig?.chartType as AnalyzeStore.ChartType) || 'table')
    columnStore.setColumns(chartConfig?.columns || [])
    dimensionStore.setDimensions((chartConfig?.dimensions as DimensionStore.DimensionOption[]) || [])
    filterStore.setFilters((chartConfig?.filters as FilterStore.FilterOption[]) || [])
    groupStore.setGroups((chartConfig?.groups as GroupStore.GroupOption[]) || [])
    orderStore.setOrders((chartConfig?.orders as OrderStore.OrderOption[]) || [])
    chartConfigStore.setCommonChartConfig(chartConfig?.commonChartConfig || chartConfigStore.$state.commonChartConfig)
    chartConfigStore.setPrivateChartConfig(
      chartConfig?.privateChartConfig || chartConfigStore.$state.privateChartConfig
    )
    columnStore.setDataSource(chartConfig?.dataSource || '')
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
