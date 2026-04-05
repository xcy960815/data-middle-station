export const useAnalyzeDraft = () => {
  const chartConfigStore = useChartConfigStore()
  const analyzeStore = useAnalyzeStore()
  const columnStore = useColumnsStore()
  const dimensionStore = useDimensionsStore()
  const groupStore = useGroupsStore()
  const orderStore = useOrdersStore()
  const filterStore = useFiltersStore()

  const buildAnalyzeDraftPayload = (): AnalyzeDto.UpdateAnalyzeOptions => {
    return {
      id: analyzeStore.getAnalyzeId!,
      analyzeName: analyzeStore.getAnalyzeName,
      analyzeDesc: analyzeStore.getAnalyzeDesc,
      chartConfigId: analyzeStore.getChartConfigId,
      chartConfig: {
        dataSource: columnStore.getDataSource,
        columns: JSON.parse(JSON.stringify(columnStore.getColumns)),
        dimensions: JSON.parse(JSON.stringify(dimensionStore.getDimensions)),
        groups: JSON.parse(JSON.stringify(groupStore.getGroups)),
        orders: JSON.parse(JSON.stringify(orderStore.getOrders)),
        filters: JSON.parse(JSON.stringify(filterStore.getFilters)),
        chartType: analyzeStore.getChartType,
        commonChartConfig: JSON.parse(JSON.stringify(chartConfigStore.getCommonChartConfig)),
        privateChartConfig: JSON.parse(JSON.stringify(chartConfigStore.getPrivateChartConfig))
      }
    }
  }

  const serializeAnalyzeDraft = () => JSON.stringify(buildAnalyzeDraftPayload())

  return {
    buildAnalyzeDraftPayload,
    serializeAnalyzeDraft
  }
}
