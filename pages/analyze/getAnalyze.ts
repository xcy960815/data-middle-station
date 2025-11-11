/**
 * @desc 获取图表配置 handler
 */
export const getAnalyzeHandler = () => {
  const analyzeStore = useAnalyzeStore()
  const columnStore = useColumnsStore()
  const dimensionStore = useDimensionsStore()
  const filterStore = useFiltersStore()
  const groupStore = useGroupsStore()
  const orderStore = useOrdersStore()
  /**
   * @desc 获取图表配置
   */
  const getAnalyze = async () => {
    const router = useRouter()
    const id = router.currentRoute.value.query.id
    if (!id) return
    const result = await httpRequest('/api/getAnalyze', {
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
      dimensionStore.setDimensions(chartConfig?.dimensions || [])
      filterStore.setFilters((chartConfig?.filters as FilterStore.FilterOption[]) || [])
      groupStore.setGroups(chartConfig?.groups || [])
      orderStore.setOrders(chartConfig?.orders || [])
      // 设置公共配置与图表配置
      useChartConfigStore().setCommonChartConfig(
        chartConfig?.commonChartConfig || useChartConfigStore().$state.commonChartConfig
      )
      useChartConfigStore().setPrivateChartConfig(
        chartConfig?.privateChartConfig || useChartConfigStore().$state.privateChartConfig
      )
      columnStore.setDataSource(chartConfig?.dataSource || '')
    }
  }

  onMounted(() => {
    getAnalyze()
  })
}
