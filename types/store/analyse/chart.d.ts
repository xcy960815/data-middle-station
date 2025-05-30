/**
 * @description: 图表 store
 */
declare namespace ChartStore {
  const ChartTypesEnums = {
    table: 'table',
    line: 'line',
    pie: 'pie',
    interval: 'interval'
  } as const

  type ChartKey = 'chart'

  type ChartType =
    (typeof ChartTypesEnums)[keyof typeof ChartTypesEnums]

  type ChartState = {
    // 图表名称
    chartName: string
    // 更新时间
    chartUpdateTime: string
    // 更新耗时
    chartUpdateTakesTime: string
    // 图表错误信息
    chartErrorMessage: string
    // 图表类型
    chartType: ChartType
    // 图表id
    chartId: number | null
    // 图表配置id
    chartConfigId: number | null
    // 表格数据
    chartData: Array<Record<string, string | number>>
    // 图表加载状态
    chartLoading: boolean
  }
  /**
   * @desc getter
   */
  type ChartGetters = {}

  /**
   * @desc action
   */
  type ChartActions = {}
}
