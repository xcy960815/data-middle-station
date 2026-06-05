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

  const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value))

  const buildAnalyzeDraftPayload = (): AnalyzeDto.UpdateAnalyzeRequest => {
    const commonChartConfig: AnalyzeConfigDao.CommonChartConfig = {
      ...defaultCommonChartConfig,
      ...clone(chartConfigStore.getCommonChartConfig || {}),
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
        columns: clone(columnStore.getColumns) as AnalyzeConfigDao.ColumnItem[],
        measures: clone(measureStore.getMeasures) as AnalyzeConfigDao.MeasureOption[],
        dimensions: clone(dimensionStore.getDimensions) as AnalyzeConfigDao.DimensionOption[],
        orders: clone(orderStore.getOrders) as AnalyzeConfigDao.OrderOption[],
        filters: clone(filterStore.getFilters) as AnalyzeConfigDao.FilterOption[],
        chartType: analyzeStore.getChartType,
        commonChartConfig,
        privateChartConfig: clone(chartConfigStore.getPrivateChartConfig || undefined)
      }
    }
  }

  const serializeAnalyzeDraft = () => JSON.stringify(buildAnalyzeDraftPayload())

  return {
    buildAnalyzeDraftPayload,
    serializeAnalyzeDraft
  }
}
