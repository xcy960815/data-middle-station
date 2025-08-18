import { ElMessage } from 'element-plus'

export const updateAnalyseHandler = () => {
  const chartConfigStore = useChartConfigStore()
  const analyseStore = useAnalyseStore()
  const columnStore = useColumnStore()
  const dimensionStore = useDimensionStore()
  const groupStore = useGroupStore()
  const orderStore = useOrderStore()
  const filterStore = useFilterStore()
  /**
   * @desc 点击保存
   */
  const handleUpdateAnalyse = async () => {
    const privateChartConfig = chartConfigStore.getPrivateChartConfig
    const chartConfigId = analyseStore.getChartConfigId
    const column = columnStore.getColumns
    const dimension = dimensionStore.getDimensions
    const group = groupStore.getGroups
    const order = orderStore.getOrders
    const filter = filterStore.getFilters
    const commonChartConfig = chartConfigStore.getCommonChartConfig
    const id = analyseStore.getChartId
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
          column,
          dimension,
          group,
          order,
          filter,
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
