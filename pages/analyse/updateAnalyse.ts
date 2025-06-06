import { ElMessage } from 'element-plus'

export const updateAnalyseHandler = () => {
  const chartConfigStore = useChartConfigStore()
  const chartStore = useAnalyseStore()
  const columnStore = useColumnStore()
  const dimensionStore = useDimensionStore()
  const groupStore = useGroupStore()
  const orderStore = useOrderStore()
  const filterStore = useFilterStore()
  /**
   * @desc 点击保存
   */
  const handleUpdateAnalyse = async () => {
    const chartConfig = chartConfigStore.getChartConfig
    const chartConfigId = chartStore.getChartConfigId
    const column = columnStore.getColumns
    const dimension = dimensionStore.getDimensions
    const group = groupStore.getGroups
    const order = orderStore.getOrders
    const filter = filterStore.getFilters
    const commonChartConfig = chartConfigStore.getCommonChartConfig
    const id = chartStore.getChartId
    const analyseName = chartStore.getAnalyseName
    const analyseDesc = chartStore.getAnalyseDesc
    const chartType = chartStore.getChartType
    const dataSource = columnStore.getDataSource
    const result = await $fetch('/api/updateAnalyse', {
      method: 'POST',
      body: {
        id,
        analyseName,
        analyseDesc,
        chartConfigId,
        chartConfig: {
          dataSource,
          column,
          dimension,
          group,
          order,
          filter,
          limit: commonChartConfig.limit,
          chartType,
        },
      },
    })
    if (result.code === 200) {
      ElMessage.success('保存成功')
    } else {
      ElMessage.error('保存失败')
    }
  }
  return {
    handleUpdateAnalyse,
  }
}
