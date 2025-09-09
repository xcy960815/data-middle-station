/**
 * @desc 获取图表配置 handler
 */
export const getAnalyseHandler = () => {
  const analyseStore = useAnalyseStore()
  const columnStore = useColumnStore()
  const dimensionStore = useDimensionStore()
  const filterStore = useFilterStore()
  const groupStore = useGroupStore()
  const orderStore = useOrderStore()
  /**
   * @desc 获取图表配置
   */
  const getAnalyse = async () => {
    const router = useRouter()
    const id = router.currentRoute.value.query.id
    if (!id) return
    const result = await $fetch('/api/getAnalyse', {
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
      analyseStore.setChartId(id)
      const chartConfigId = data.chartConfigId
      analyseStore.setChartConfigId(chartConfigId)
      const chartConfig = data.chartConfig
      analyseStore.setChartType((chartConfig?.chartType as AnalyseStore.ChartType) || 'table')
      columnStore.setColumns(chartConfig?.column || [])
      dimensionStore.setDimensions(chartConfig?.dimension || [])
      filterStore.setFilters((chartConfig?.filter as FilterStore.FilterOption[]) || [])
      groupStore.setGroups(chartConfig?.group || [])
      orderStore.setOrders(chartConfig?.order || [])
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
