/**
 * @desc 获取图表配置 handler
 */
export const getAnalyseHandler = () => {
  const chartStore = useAnalyseStore()
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
      chartStore.setAnalyseName(analyseName)
      const analyseDesc = data.analyseDesc
      chartStore.setAnalyseDesc(analyseDesc)
      const id = data.id
      chartStore.setChartId(id)
      const chartConfigId = data.chartConfigId
      chartStore.setChartConfigId(chartConfigId)
      const chartConfig = data.chartConfig
      chartStore.setChartType(
        (chartConfig?.chartType as AnalyseStore.ChartType) ||
          'table'
      )
      columnStore.setColumns(chartConfig?.column || [])
      dimensionStore.setDimensions(
        chartConfig?.dimension || []
      )
      filterStore.setFilters(chartConfig?.filter || [])
      groupStore.setGroups(chartConfig?.group || [])
      orderStore.setOrders(chartConfig?.order || [])
      columnStore.setDataSource(
        chartConfig?.dataSource || ''
      )
      filterStore.setFilters(chartConfig?.filter || [])
      groupStore.setGroups(chartConfig?.group || [])
      orderStore.setOrders(chartConfig?.order || [])
    }
  }

  onMounted(() => {
    // console.log('getChartConfigHandler')
    getAnalyse()
  })
}
