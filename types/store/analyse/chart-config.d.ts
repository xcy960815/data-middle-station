/**
 * @desc 图表配置 store 类型
 */
declare namespace ChartConfigStore {
  /**
   * @desc 图表配置 store
   */
  type ChartConfigKey = 'chartConfig'

  /**
   * @desc 图表公共配置
   */
  type CommonChartConfig = {
    // 描述
    analyseDesc: string
    // 数据量
    limit: number
    // 智能作图建议
    suggest: boolean
    // 缓存策略
    mixStrategy: string
    // 分享
    shareStrategy: string
  }

  /**
   * @desc 折线图配置
   */
  type LineChartConfig = {
    // 是否画圆点
    showPoint: boolean
    // 是否显示文字
    showLabel: boolean
    // 是否平滑展示
    smooth: boolean
    // 是否自动双轴
    autoDualAxis: boolean
    // 是否横向拖动条
    horizontalBar: boolean
  }

  /**
   * @desc 柱状图配置
   */
  type IntervalChartConfig = {
    // 展示方式
    displayMode: string // 'levelDisplay' | 'stackDisplay'
    // 是否百分比显示
    showPercentage: boolean
    // 是否显示文字
    showLabel: boolean
    // 水平展示
    horizontalDisplay: boolean
    // 横线滚动
    horizontalBar: boolean
  }

  /**
   * @desc 饼图配置
   */
  type PieChartConfig = {
    // 是否显示文字
    showLabel: boolean
    // 图表类型
    chartType: string // "pie" | "rose"
  }

  /**
   * @desc 表格配置条件选项
   */
  type TableChartConfigConditionOption = {
    // 条件
    conditionType: string
    // 条件字段
    conditionField: string
    // 条件符号
    conditionSymbol: string
    // 最小范围值
    conditionMinValue?: string
    // 最大范围值
    conditionMaxValue?: string
    // 条件值
    conditionValue?: string
    // 条件颜色
    conditionColor: string
  }

  /**
   * @desc 表格配置
   */
  type TableChartConfig = {
    displayMode: string // "originalDisplay"|"aggregationDisplay"
    showCompare: boolean
    conditions: Array<TableChartConfigConditionOption>
  }

  type ChartConfig = {
    /**
     * @desc 图表配置
     */
    line: LineChartConfig
    /**
     * @desc 柱状图配置
     */
    interval: IntervalChartConfig
    /**
     * @desc 饼图配置
     */
    pie: PieChartConfig
    /**
     * @desc 表格配置
     */
    table: TableChartConfig
  }

  /**
   * @desc 图表配置状态
   */
  type ChartConfigState = {
    /**
     * @desc 图表配置抽屉
     */
    chartConfigDrawer: boolean
    /**
     * @desc 图表公共配置
     */
    commonChartConfig: CommonChartConfig
    /**
     * @desc 图表配置
     */
    chartConfig: ChartConfig
  }

  /**
   * @desc getter
   */
  type ChartConfigGetters = {}

  /**
   * @desc action
   */
  type ChartConfigActions = {
    setChartConfigDrawer: (value: boolean) => void
    setCommonChartConfig: (value: CommonChartConfig) => void
    setChartConfig: (value: ChartConfig) => void
    setTableChartConditions: (conditions: TableChartConfigConditionOption[]) => void
  }
}
