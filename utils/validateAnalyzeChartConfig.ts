type AnalyzeChartConfigValidationInput = {
  chartType?: AnalyzeStore.ChartType | string
  measures?: MeasureStore.MeasureOption[] | AnalyzeConfigDao.MeasureOption[]
  dimensions?: DimensionStore.DimensionOption[] | AnalyzeConfigDao.DimensionOption[]
  dataSource?: string | null
}

type AnalyzeChartConfigValidationResult = {
  valid: boolean
  message: string
}

const CHART_TYPE_NAMES: Record<string, string> = {
  table: '表格',
  interval: '柱状图',
  line: '折线图',
  pie: '饼图'
}

/**
 * 校验分析图表字段配置。用于分析页、看板和邮件快照的公共防护。
 */
export const validateAnalyzeChartConfig = (
  config: AnalyzeChartConfigValidationInput
): AnalyzeChartConfigValidationResult => {
  const chartType = config.chartType || 'table'
  const chartName = CHART_TYPE_NAMES[chartType] || '图表'
  const measures = config.measures || []
  const dimensions = config.dimensions || []

  if (!config.dataSource?.trim()) {
    return {
      valid: false,
      message: '分析数据源不存在'
    }
  }

  switch (chartType) {
    case 'table':
      return measures.length > 0
        ? { valid: true, message: '' }
        : { valid: false, message: `${chartName}至少需要一个值` }
    case 'interval':
    case 'line':
      return measures.length > 0 && dimensions.length > 0
        ? { valid: true, message: '' }
        : { valid: false, message: `${chartName}至少需要一个值和一个分组` }
    case 'pie':
      return measures.length > 0 && dimensions.length > 0
        ? { valid: true, message: '' }
        : { valid: false, message: `${chartName}需要一个值和一个分组` }
    default:
      return { valid: true, message: '' }
  }
}
