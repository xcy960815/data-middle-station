import { httpRequest } from '@/composables/useHttpRequest'
import { ElMessage } from 'element-plus'

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

  /**
   * @desc 获取图表配置
   */
  const getAnalyze = async () => {
    const router = useRouter()
    const id = router.currentRoute.value.query.id
    if (!id) {
      ElMessage.error('图表id不能为空')
      return
    }

    const result = await httpRequest<ApiResponseI<AnalyzeVo.GetAnalyzeOptions>>('/api/getAnalyze', {
      method: 'post',
      body: {
        id
      }
    })
    if (result.code === 200) {
      const data = result.data!
      const analyzeName = data.analyzeName
      analyzeStore.setAnalyzeName(analyzeName)
      const analyzeDesc = data.analyzeDesc
      analyzeStore.setAnalyzeDesc(analyzeDesc)
      const id = data.id
      analyzeStore.setAnalyzeId(id)
      const chartConfigId = data.chartConfigId
      analyzeStore.setChartConfigId(chartConfigId)
      const chartConfig = data.chartConfig
      analyzeStore.setChartType((chartConfig?.chartType as AnalyzeStore.ChartType) || 'table')
      columnStore.setColumns(chartConfig?.columns || [])
      // TODO
      dimensionStore.setDimensions((chartConfig?.dimensions as DimensionStore.DimensionOption[]) || [])
      filterStore.setFilters((chartConfig?.filters as FilterStore.FilterOptions[]) || [])
      groupStore.setGroups((chartConfig?.groups as GroupStore.GroupOption[]) || [])
      orderStore.setOrders((chartConfig?.orders as OrderStore.OrderOptions[]) || [])
      // 设置公共配置与图表配置
      chartConfigStore.setCommonChartConfig(chartConfig?.commonChartConfig || chartConfigStore.$state.commonChartConfig)
      chartConfigStore.setPrivateChartConfig(
        chartConfig?.privateChartConfig || chartConfigStore.$state.privateChartConfig
      )
      columnStore.setDataSource(chartConfig?.dataSource || '')
    }
  }

  return {
    getAnalyze
  }
}
