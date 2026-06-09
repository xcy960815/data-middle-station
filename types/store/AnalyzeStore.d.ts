/**
 * @description: 图表 store
 */
declare namespace AnalyzeStore {
  /**
   * @desc 图表类型
   */
  type ChartTypesEnums = typeof import('@/shared/analyzeConfigTypes').ANALYZE_CHART_TYPE_MAP

  /**
   * @desc 图表key
   */
  type AnalyzeKey = 'chart'

  /**
   * @desc 图表类型
   */
  type ChartType = import('@/shared/analyzeConfigTypes').AnalyzeChartType

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
     * 当前生效的分析配置版本 ID
     */
    currentConfigId: number | null
    /**
     * 表格数据
     */
    analyzeData: Array<AnalyzeDataVo.AnalyzeData>
    /**
     * 图表加载状态
     */
    chartLoading: boolean
    /**
     * 图表错误分析
     */
    chartErrorAnalysis: string
    /**
     * 编辑器是否有未保存改动
     */
    editorDirty: boolean
    /**
     * 编辑器是否正在保存
     */
    editorSaving: boolean
    /**
     * 编辑器是否处于初始化填充阶段
     */
    editorHydrating: boolean
    /**
     * 最近一次保存时间
     */
    lastSavedAt: string
    /**
     * 最近一次保存快照
     */
    lastSavedSnapshot: string
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
