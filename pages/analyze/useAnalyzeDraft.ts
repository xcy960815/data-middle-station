/**
 * @desc 提供分析草稿的读取、保存和清理能力。
 */
import { defaultCommonChartConfig } from '@/shared/chartDefaults'

export const useAnalyzeDraft = () => {
  const chartConfigStore = useChartConfigStore()
  const analyzeStore = useAnalyzeStore()
  const columnStore = useColumnsStore()
  const measureStore = useMeasuresStore()
  const dimensionStore = useDimensionsStore()
  const orderStore = useOrdersStore()
  const filterStore = useFiltersStore()

  const buildAnalyzeDraftPayload = (): AnalyzeDto.UpdateAnalyzeRequest => {
    const commonChartConfig: AnalyzeConfigDao.CommonChartConfig = {
      ...defaultCommonChartConfig,
      ...(chartConfigStore.getCommonChartConfig || {}),
      dataSourceMode: columnStore.getDataSourceMode,
      datasetId: columnStore.getDatasetId,
      datasetName: columnStore.getDatasetName
    }

    return {
      id: analyzeStore.getAnalyzeId!,
      analyzeName: analyzeStore.getAnalyzeName,
      analyzeDesc: analyzeStore.getAnalyzeDesc,
      currentConfigId: analyzeStore.getCurrentConfigId,
      chartConfig: {
        dataSource: columnStore.getDataSource,
        measures: measureStore.getMeasures,
        dimensions: dimensionStore.getDimensions,
        orders: orderStore.getOrders,
        filters: filterStore.getFilters,
        chartType: analyzeStore.getChartType,
        commonChartConfig,
        privateChartConfig: chartConfigStore.getPrivateChartConfig || undefined
      }
    }
  }

  const serializeAnalyzeDraft = () => JSON.stringify(buildAnalyzeDraftPayload())

  return {
    buildAnalyzeDraftPayload,
    serializeAnalyzeDraft
  }
}
