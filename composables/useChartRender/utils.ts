import type { EChartsCoreOption } from 'echarts/core'

/**
 * 图表渲染配置接口
 */
export interface ChartRenderConfig {
  title: string
  data: Array<ChartDataVo.ChartData>
  xAxisFields: Array<GroupStore.GroupOption>
  yAxisFields: Array<DimensionStore.DimensionOption>
}

/**
 * 通用图表渲染器接口
 */
export interface ChartRenderer {
  renderIntervalChart(
    config: ChartRenderConfig,
    chartConfig?: ChartConfigDao.IntervalChartConfig
  ): EChartsCoreOption | null
  renderLineChart(config: ChartRenderConfig, chartConfig?: ChartConfigDao.LineChartConfig): EChartsCoreOption | null
  renderPieChart(config: ChartRenderConfig, chartConfig?: ChartConfigDao.PieChartConfig): EChartsCoreOption | null
}

/**
 * 公共数据处理逻辑
 */
export interface ChartDataProcessResult {
  xFieldName: string
  measureFields: string[]
  groupFieldName?: string
  useFold: boolean
  xAxisTitle: string
  yAxisTitle: string
}

/**
 * 处理图表数据配置
 */
export function processChartData(config: ChartRenderConfig): ChartDataProcessResult {
  // 维度与度量：yAxisFields 最后一个为 X 轴，其余为度量
  const xFieldName = config.yAxisFields[config.yAxisFields.length - 1].columnName
  const measureFields = config.yAxisFields
    .slice(0, config.yAxisFields.length - 1)
    .map((item) => item.columnName) as string[]

  // 可选分组（用于单度量或双层分组）
  const groupFieldName = config.xAxisFields[0]?.columnName
  const useFold = measureFields.length > 1

  // 轴标题（优先显示中文别名）
  const xFieldOption = config.yAxisFields[config.yAxisFields.length - 1]
  const xAxisTitle = xFieldOption?.displayName || xFieldOption?.columnComment || xFieldOption?.columnName || ''

  let yAxisTitle = ''
  if (!useFold) {
    const yFieldOption = config.yAxisFields.find((item) => item.columnName === measureFields[0])
    yAxisTitle = yFieldOption?.displayName || yFieldOption?.columnComment || yFieldOption?.columnName || ''
  }

  return {
    xFieldName,
    measureFields,
    groupFieldName,
    useFold,
    xAxisTitle,
    yAxisTitle
  }
}

/**
 * 获取默认图表颜色
 */
export function getDefaultChartColors(): string[] {
  return ['#5B8FF9', '#5AD8A6', '#5D7092', '#F6BD16', '#E86452', '#6DC8EC', '#945FB9', '#FF9845', '#1E9493', '#FF99C3']
}

/**
 * 格式化数值显示
 */
export function formatValue(value: number, showPercentage: boolean): string {
  if (showPercentage) {
    return `${value.toFixed(1)}%`
  }
  // 数字格式化：添加千分位分隔符
  if (Number.isInteger(value)) {
    return value.toLocaleString('zh-CN')
  }
  // 小数保留2位，并添加千分位分隔符
  return value.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

/**
 * 处理数据折叠（fold transform）
 */
export function foldData(
  data: Array<ChartDataVo.ChartData>,
  measureFields: string[],
  xFieldName: string,
  groupFieldName?: string
): Array<ChartDataVo.ChartData & { key: string; value: number }> {
  const foldedData: Array<ChartDataVo.ChartData & { key: string; value: number }> = []
  for (const item of data) {
    for (const field of measureFields) {
      const value = Number(item[field] || 0)
      const newItem = {
        ...item,
        key: field,
        value
      }
      foldedData.push(newItem)
    }
  }
  return foldedData
}

/**
 * 根据字段类型对 X 轴数据进行排序
 */
export function sortXAxisData(xAxisDataSet: Set<string>, columnType: string): string[] {
  return Array.from(xAxisDataSet).sort((a, b) => {
    // 数字类型排序
    if (
      columnType.includes('int') ||
      columnType.includes('decimal') ||
      columnType.includes('float') ||
      columnType.includes('double') ||
      columnType.includes('numeric') ||
      columnType.includes('number')
    ) {
      const numA = Number(a)
      const numB = Number(b)
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB
      }
      // 如果无法转换为数字，使用字符串排序作为后备
      return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
    } else if (columnType.includes('date') || columnType.includes('time') || columnType.includes('timestamp')) {
      // 日期类型排序
      const dateA = new Date(a).getTime()
      const dateB = new Date(b).getTime()
      if (!isNaN(dateA) && !isNaN(dateB)) {
        return dateA - dateB
      }
      // 如果无法转换为日期，使用字符串排序作为后备
      return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
    } else {
      // 默认字符串排序
      return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
    }
  })
}
