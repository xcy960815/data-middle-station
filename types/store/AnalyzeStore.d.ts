/**
 * @description: 图表 store
 */
declare namespace AnalyzeStore {
  /**
   * @desc 图表类型
   */
  const ChartTypesEnums = {
    table: 'table',
    line: 'line',
    pie: 'pie',
    interval: 'interval'
  } as const

  /**
   * @desc 图表key
   */
  type AnalyzeKey = 'chart'

  /**
   * @desc 图表类型
   */
  type ChartType = (typeof ChartTypesEnums)[keyof typeof ChartTypesEnums]

  /**
   * @desc 图表状态
   */
  type AnalyzeState = {
    /**
     * 图表名称
     */
    analyzeName: string
    /**
     * 图表描述
     */
    analyzeDesc: string
    /**
     * 更新时间
     */
    chartUpdateTime: string
    /**
     * 更新耗时
     */
    chartUpdateTakesTime: string
    /**
     * 图表错误信息
     */
    chartErrorMessage: string
    /**
     * 图表类型
     */
    chartType: ChartType
    /**
     * 分析id
     */
    analyzeId: number | null
    /**
     * 分析配置id
     */
    chartConfigId: number | null
    /**
     * 表格数据
     */
    analyzeData: Array<AnalyzeDataVo.AnalyzeData>
    /**
     * 图表加载状态
     */
    chartLoading: boolean
  }
  /**
   * @desc 图表getter
   */
  type AnalyzeGetters = {}

  /**
   * @desc 图表action
   */
  type AnalyzeActions = {}
}
