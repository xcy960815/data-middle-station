import { ElMessage } from 'element-plus'

/** */
export const updateAnalyseHandler = () => {
  const chartConfigStore = useChartConfigStore()
  const analyseStore = useAnalyseStore()
  const columnStore = useColumnsStore()
  const dimensionStore = useDimensionsStore()
  const groupStore = useGroupsStore()
  const orderStore = useOrdersStore()
  const filterStore = useFiltersStore()
  /**
   * @desc 点击保存
   */
  const handleUpdateAnalyse = async () => {
    const privateChartConfig = chartConfigStore.getPrivateChartConfig
    const chartConfigId = analyseStore.getChartConfigId
    const columns = columnStore.getColumns
    const dimensions = dimensionStore.getDimensions
    const groups = groupStore.getGroups
    const orders = orderStore.getOrders
    const filters = filterStore.getFilters
    const commonChartConfig = chartConfigStore.getCommonChartConfig
    const id = analyseStore.getAnalyseId
    const analyseName = analyseStore.getAnalyseName
    const analyseDesc = analyseStore.getAnalyseDesc
    const chartType = analyseStore.getChartType
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
          columns,
          dimensions,
          groups,
          orders,
          filters,
          chartType,
          commonChartConfig,
          privateChartConfig
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
    handleUpdateAnalyse
  }
}
