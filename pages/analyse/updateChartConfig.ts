import { ElMessage } from 'element-plus'

export const updateChartConfigHandler = () => {
  const chartConfigStore = useChartConfigStore()
  const chartStore = useChartStore()
  const columnStore = useColumnStore()
  const dimensionStore = useDimensionStore()
  const groupStore = useGroupStore()
  const orderStore = useOrderStore()
  const filterStore = useFilterStore()
  /**
   * @desc 点击保存
   */
  const handleUpdateChartConfig = async () => {
    const chartConfig = chartConfigStore.getChartConfig
    const chartConfigId = chartStore.getChartConfigId
    const column = columnStore.getColumns
    const dimension = dimensionStore.getDimensions
    const group = groupStore.getGroups
    const order = orderStore.getOrders
    const filter = filterStore.getFilters
    const commonChartConfig =
      chartConfigStore.getCommonChartConfig
    const id = chartStore.getChartId
    const chartName = chartStore.getChartName
    const chartDesc = chartStore.getChartDesc
    const chartType = chartStore.getChartType
    const dataSource = columnStore.getDataSource
    const result = await $fetch('/api/updateChart', {
      method: 'POST',
      body: {
        id,
        chartName,
        chartDesc,
        chartType,
        chartConfigId,
        chartConfig: {
          dataSource,
          column,
          dimension,
          group,
          order,
          filter
          // commonChartConfig
        }
      }
    })
    if (result.code === 200) {
      ElMessage.success('保存成功')
    } else {
      ElMessage.error('保存失败')
    }
  }
  return {
    handleUpdateChartConfig
  }
}
