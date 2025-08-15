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
    /**
     * 分析描述
     */
    analyseDesc: string
    /**
     * 数据量
     */
    limit: number
    /**
     * 智能作图建议
     */
    suggest: boolean
    /**
     * 缓存策略
     */
    mixStrategy: string
    /**
     * 分享
     */
    shareStrategy: string
  }

  /**
   * @desc 折线图配置
   */
  type LineChartConfig = {
    /**
     * 是否画圆点
     */
    showPoint: boolean
    /**
     * 是否显示文字
     */
    showLabel: boolean
    /**
     * 是否平滑展示
     */
    smooth: boolean
    /**
     * 是否自动双轴
     */
    autoDualAxis: boolean
    /**
     * 是否横向拖动条
     */
    horizontalBar: boolean
  }

  /**
   * @desc 柱状图配置
   */
  type IntervalChartConfig = {
    /**
     * 展示方式
     */
    displayMode: string // 'levelDisplay' | 'stackDisplay'
    /**
     * 是否百分比显示
     */
    showPercentage: boolean
    /**
     * 是否显示文字
     */
    showLabel: boolean
    /**
     * 水平展示
     */
    horizontalDisplay: boolean
    /**
     * 横线滚动
     */
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
  type ConditionOption = {
    /**
     * 条件
     */
    conditionType: string
    /**
     * 条件字段
     */
    conditionField: string
    /**
     * 条件符号
     */
    conditionSymbol: string
    /**
     * 最小范围值
     */
    conditionMinValue?: string
    /**
     * 最大范围值
     */
    conditionMaxValue?: string
    /**
     * 条件值
     */
    conditionValue?: string
    /**
     * 条件颜色
     */
    conditionColor: string
  }

  /**
   * @desc 表格配置
   */
  type TableChartConfig = {
    /**
     * 展示方式
     */
    displayMode: string // "originalDisplay"|"aggregationDisplay"
    /**
     * 是否显示对比
     */
    showCompare: boolean
    /**
     * 条件
     */
    conditions: Array<ConditionOption>
    /**
     * 是否显示汇总
     */
    showSummary: boolean
    /**
     * 是否启用行高亮
     */
    enableRowHoverHighlight: boolean
    /**
     * 是否启用列高亮
     */
    enableColHoverHighlight: boolean
    /**
     * 是否显示边框
     */
    border: boolean
    /**
     * 悬停填充颜色
     */
    hoverFill: string
    /**
     * 表头高度
     */
    headerHeight: number
    /**
     * 汇总高度
     */
    summaryHeight: number
    /**
     * 是否显示汇总
     */
    enableSummary: boolean
    /**
     * 行高
     */
    rowHeight: number
    /**
     * 滚动条大小
     */
    scrollbarSize: number
    /**
     * 表格内边距
     */
    tablePadding: number
    /**
     * 表头背景色
     */
    headerBackground: string
    /**
     * 表格奇数行背景色
     */
    bodyBackgroundOdd: string
    /**
     * 表格偶数行背景色
     */
    bodyBackgroundEven: string
    /**
     * 表格边框颜色
     */
    borderColor: string
    /**
     * 表头文本颜色
     */
    headerTextColor: string
    /**
     * 表格文本颜色
     */
    bodyTextColor: string
    /**
     * 表头字体
     */
    headerFontFamily: string
    /**
     * 表头字体大小
     */
    headerFontSize: number
    /**
     * 表格内容字体
     */
    bodyFontFamily: string
    /**
     * 表格内容字体大小
     */
    bodyFontSize: number
    /**
     * 表格内容字体粗细
     */
    bodyFontWeight: string
    /**
     * 表格内容字体样式
     */
    bodyFontStyle: string
    /**
     * 汇总字体
     */
    summaryFontFamily: string
    /**
     * 汇总字体大小
     */
    summaryFontSize: number
    /**
     * 汇总背景色
     */
    summaryBackground: string
    /**
     * 汇总文本颜色
     */
    summaryTextColor: string
    /**
     * 滚动条背景色
     */
    scrollbarBackground: string
    /**
     * 滚动条滑块颜色
     */
    scrollbarThumb: string
    /**
     * 滚动条滑块悬停颜色
     */
    scrollbarThumbHover: string
    /**
     * 缓冲行数
     */
    bufferRows: number
    /**
     * 最小自动列宽度
     */
    minAutoColWidth: number
    /**
     * 滚动阈值
     */
    scrollThreshold: number
    /**
     * 表头排序激活背景色
     */
    headerSortActiveBackground: string
    /**
     * 可排序颜色
     */
    sortableColor: string
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
    chartConfig: ChartConfig | null
  }

  /**
   * @desc getter
   */
  type ChartConfigGetters = {}

  /**
   * @desc action
   */
  type ChartConfigActions = {
    setTableChartConditions(conditions: ConditionOption[]): void
  }
}
