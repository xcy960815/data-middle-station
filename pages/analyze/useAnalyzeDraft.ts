/**
 * @desc 提供分析草稿的读取、保存和清理能力。
 */
export const useAnalyzeDraft = () => {
  const chartConfigStore = useChartConfigStore()
  const analyzeStore = useAnalyzeStore()
  const columnStore = useColumnsStore()
  const dimensionStore = useDimensionsStore()
  const groupStore = useGroupsStore()
  const orderStore = useOrdersStore()
  const filterStore = useFiltersStore()

  const removeRuntimeValidationFields = <T extends Record<string, any>>(items: T[]) => {
    return items.map((item) => {
      const { __invalid: _invalid, __invalidMessage: _invalidMessage, ...rest } = item
      return rest
    })
  }

  const buildAnalyzeDraftPayload = (): AnalyzeDto.UpdateAnalyzeRequest => {
    return {
      id: analyzeStore.getAnalyzeId!,
      analyzeName: analyzeStore.getAnalyzeName,
      analyzeDesc: analyzeStore.getAnalyzeDesc,
      currentConfigId: analyzeStore.getCurrentConfigId,
      chartConfig: {
        dataSource: columnStore.getDataSource,
        columns: removeRuntimeValidationFields(JSON.parse(JSON.stringify(columnStore.getColumns))),
        dimensions: removeRuntimeValidationFields(JSON.parse(JSON.stringify(dimensionStore.getMeasures))),
        groups: removeRuntimeValidationFields(JSON.parse(JSON.stringify(groupStore.getGroups))),
        orders: removeRuntimeValidationFields(JSON.parse(JSON.stringify(orderStore.getOrders))),
        filters: removeRuntimeValidationFields(JSON.parse(JSON.stringify(filterStore.getFilters))),
        chartType: analyzeStore.getChartType,
        commonChartConfig: {
          ...JSON.parse(JSON.stringify(chartConfigStore.getCommonChartConfig)),
          dataSourceMode: columnStore.getDataSourceMode,
          datasetId: columnStore.getDatasetId,
          datasetName: columnStore.getDatasetName
        },
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
