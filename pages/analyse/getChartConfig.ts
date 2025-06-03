export const getChartConfigHandler = () => {
  const chartStore = useChartStore()
  const columnStore = useColumnStore()
  const dimensionStore = useDimensionStore()
  const filterStore = useFilterStore()
  const groupStore = useGroupStore()
  const orderStore = useOrderStore()
  /**
   * @desc 获取图表
   */
  const getChart = async () => {
    const router = useRouter()
    const id = router.currentRoute.value.query.id
    if (!id) return
    const result = await $fetch('/api/getChart', {
      method: 'post',
      body: {
        id
      }
    })
    if (result.code === 200) {
      const data = result.data!
      const chartName = data.chartName
      chartStore.setChartName(chartName)
      const chartDesc = data.chartDesc
      chartStore.setChartDesc(chartDesc)
      const id = data.id
      chartStore.setChartId(id)
      const chartConfigId = data.chartConfigId
      chartStore.setChartConfigId(chartConfigId)
      const chartConfig = data.chartConfig
      const {
        column,
        dimension,
        filter,
        group,
        order,
        dataSource
      } = chartConfig
      columnStore.setColumns(column || [])
      dimensionStore.setDimensions(dimension || [])
      filterStore.setFilters(filter || [])
      groupStore.setGroups(group || [])
      orderStore.setOrders(order || [])
      columnStore.setDataSource(dataSource || '')
      dimensionStore.setDimensions(dimension || [])
      filterStore.setFilters(filter || [])
      groupStore.setGroups(group || [])
      orderStore.setOrders(order || [])
    }
  }

  onMounted(() => {
    // console.log('getChartConfigHandler')
    getChart()
  })
}
