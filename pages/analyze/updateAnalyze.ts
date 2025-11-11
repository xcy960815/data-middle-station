import { ElMessage } from 'element-plus'

/** */
export const updateAnalyzeHandler = () => {
  const chartConfigStore = useChartConfigStore()
  const analyzeStore = useAnalyzeStore()
  const columnStore = useColumnsStore()
  const dimensionStore = useDimensionsStore()
  const groupStore = useGroupsStore()
  const orderStore = useOrdersStore()
  const filterStore = useFiltersStore()
  /**
   * @desc 点击保存
   */
  const handleUpdateAnalyze = async () => {
    const privateChartConfig = chartConfigStore.getPrivateChartConfig
    const chartConfigId = analyzeStore.getChartConfigId
    const columns = columnStore.getColumns
    const dimensions = dimensionStore.getDimensions
    const groups = groupStore.getGroups
    const orders = orderStore.getOrders
    const filters = filterStore.getFilters
    const commonChartConfig = chartConfigStore.getCommonChartConfig
    const id = analyzeStore.getAnalyzeId
    const analyzeName = analyzeStore.getAnalyzeName
    const analyzeDesc = analyzeStore.getAnalyzeDesc
    const chartType = analyzeStore.getChartType
    const dataSource = columnStore.getDataSource
    const result = await httpRequest('/api/updateAnalyze', {
      method: 'POST',
      body: {
        id,
        analyzeName,
        analyzeDesc,
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
    handleUpdateAnalyze
  }
}
