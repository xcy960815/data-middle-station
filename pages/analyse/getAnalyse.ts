/**
 * @desc 获取图表配置 handler
 */
export const getAnalyseHandler = () => {
  const analyseStore = useAnalyseStore()
  const columnStore = useColumnsStore()
  const dimensionStore = useDimensionsStore()
  const filterStore = useFiltersStore()
  const groupStore = useGroupsStore()
  const orderStore = useOrdersStore()
  /**
   * @desc 获取图表配置
   */
  const getAnalyse = async () => {
    const router = useRouter()
    const id = router.currentRoute.value.query.id
    if (!id) return
    const result = await httpRequest('/api/getAnalyse', {
      method: 'post',
      body: {
        id
      }
    })
    if (result.code === 200) {
      const data = result.data!
      const analyseName = data.analyseName
      analyseStore.setAnalyseName(analyseName)
      const analyseDesc = data.analyseDesc
      analyseStore.setAnalyseDesc(analyseDesc)
      const id = data.id
      analyseStore.setAnalyseId(id)
      const chartConfigId = data.chartConfigId
      analyseStore.setChartConfigId(chartConfigId)
      const chartConfig = data.chartConfig
      analyseStore.setChartType((chartConfig?.chartType as AnalyseStore.ChartType) || 'table')
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
    getAnalyse()
  })
}
