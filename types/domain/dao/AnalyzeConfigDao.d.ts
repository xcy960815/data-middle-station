/**
 * 图表配置
 */
declare namespace AnalyzeConfigDao {
  type FilterTypeMap = typeof import('@/shared/domainTypes').FILTER_TYPE_MAP
  type FilterAggregationMap = typeof import('@/shared/domainTypes').FILTER_AGGREGATION_MAP
  type OrderTypeMap = typeof import('@/shared/domainTypes').ORDER_TYPE_MAP
  type OrderAggregationMap = typeof import('@/shared/domainTypes').ORDER_AGGREGATION_MAP

  /**
   * 列配置
   */
  type ColumnItem = DatabaseDao.TableColumnRecord & {
    displayName: string
    datasetFieldName?: string
    datasetFieldType?: DatasetDao.DatasetFieldType
    datasetAggregationType?: import('@/shared/domainTypes').OrderAggregationType
  }

  /**
   * 值/度量配置
   */
  type MeasureOption = ColumnItem

  /**
   * 过滤聚合方式
   */
  type FilterAggregationsEnum = FilterAggregationMap

  /**
   * 过滤类型
   */
  type FilterTypeEnums = FilterTypeMap

  /**
   * 过滤类型
   */
  type FilterType = import('@/shared/domainTypes').FilterType

  /**
   * 过滤聚合方式
   */
  type FilterAggregationsType = import('@/shared/domainTypes').FilterAggregationType

  /**
   * 过滤配置
   */
  type FilterOption = ColumnItem & {
    /**
     * 过滤条件：操作符 + 操作数 + 聚合方式
     */
    condition: import('@/shared/filterCondition').FilterConditionRule
  }

  /**
   * 分组配置
   */
  type DimensionOption = ColumnItem

  /**
   * 排序类型
   */
  type OrderTypeEnums = OrderTypeMap

  type OrderType = import('@/shared/domainTypes').OrderType

  /**
   * 排序聚合方式
   */
  type OrderAggregationsEnum = OrderAggregationMap

  /**
   * 排序聚合方式
   */
  type OrderAggregationsType = import('@/shared/domainTypes').OrderAggregationType

  /**
   * 排序配置
   */
  type OrderOption = ColumnItem & {
    /**
     * 排序规则：方向 + 聚合方式
     */
    sort: import('@/shared/orderSort').OrderSortRule
  }

  /**
   * @desc 图表公共配置
   */
  type CommonChartConfig = {
    /**
     * 数据来源类型
     */
    dataSourceMode?: 'table' | 'dataset'
    /**
     * 数据集ID
     */
    datasetId?: number | null
    /**
     * 数据集名称
     */
    datasetName?: string
    /**
     * 分析描述
     */
    analyzeDesc: string
    /**
     * 数据量
     */
    limit: number
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
    /**
     * 是否显示文字
     */
    showLabel: boolean
    /**
     * 图表类型
     */
    chartType: 'pie' | 'rose'
  }

  /**
   * @desc 表格配置条件选项
   */
  type ConditionItem = {
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
    // ========== 功能开关配置 ==========
    /**
     * 是否显示汇总
     */
    enableSummary: boolean
    /**
     * 是否启用行高亮
     */
    enableRowHoverHighlight: boolean
    /**
     * 是否启用列高亮
     */
    enableColHoverHighlight: boolean

    // ========== 尺寸配置 ==========
    /**
     * 表头高度
     */
    headerRowHeight: number
    /**
     * 行高
     */
    bodyRowHeight: number
    /**
     * 汇总高度
     */
    summaryRowHeight: number
    /**
     * 滚动条大小
     */
    scrollbarSize: number
    /**
     * 最小自动列宽度
     */
    minAutoColWidth: number

    // ========== 表头样式配置 ==========
    /**
     * 表头背景色
     */
    headerBackground: string
    /**
     * 表头文本颜色
     */
    headerTextColor: string
    /**
     * 表头字体
     */
    headerFontFamily: string
    /**
     * 表头字体大小
     */
    headerFontSize: number

    // ========== 表格内容样式配置 ==========
    /**
     * 表格奇数行背景色
     */
    bodyBackgroundOdd: string
    /**
     * 表格偶数行背景色
     */
    bodyBackgroundEven: string
    /**
     * 表格文本颜色
     */
    bodyTextColor: string
    /**
     * 表格内容字体
     */
    bodyFontFamily: string
    /**
     * 表格内容字体大小
     */
    bodyFontSize: number

    // ========== 汇总行样式配置 ==========
    /**
     * 汇总背景色
     */
    summaryBackground: string
    /**
     * 汇总文本颜色
     */
    summaryTextColor: string
    /**
     * 汇总字体
     */
    summaryFontFamily: string
    /**
     * 汇总字体大小
     */
    summaryFontSize: number

    // ========== 高亮样式配置 ==========
    /**
     * 悬停填充颜色
     */
    highlightCellBackground: string
    /**
     * 行高亮背景色
     */
    highlightRowBackground: string
    /**
     * 列高亮背景色
     */
    highlightColBackground: string

    // ========== 排序样式配置 ==========
    /**
     * 可排序颜色
     */
    sortActiveColor: string
    /**
     * 条件格式配置
     */
    conditions: ConditionItem[]

    // ========== 滚动条样式配置 ==========
    /**
     * 滚动条背景色
     */
    scrollbarBackground: string
    /**
     * 滚动条滑块颜色
     */
    scrollbarThumbBackground: string
    /**
     * 滚动条滑块悬停颜色
     */
    scrollbarThumbHoverBackground: string

    // ========== 其他配置 ==========
    /**
     * 表格边框颜色
     */
    borderColor: string
    /**
     * 缓冲行数
     */
    bufferRows: number
  }

  /**
   * @desc 私有图表配置
   */
  type PrivateChartConfig = {
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
   * 分析配置版本
   */
  type AnalyzeConfigRecord = {
    id: number
    analyzeId: number
    versionNo: number
    /**
     * 数据源
     */
    dataSource: string | null
    /**
     * 图表类型
     */
    chartType: string
    /**
     * 值/度量配置
     */
    measures: MeasureOption[]
    /**
     * 过滤配置
     */
    filters: FilterOption[]
    /**
     * 分组配置
     */
    dimensions: DimensionOption[]
    /**
     * 排序配置
     */
    orders: OrderOption[]
    /**
     * 公共图表配置
     */
    commonChartConfig?: CommonChartConfig
    /**
     * 各图表类型配置
     */
    privateChartConfig?: PrivateChartConfig
    /**
     * 更新时间
     */
    updateTime: string
    /**
     * 创建时间
     */
    createTime: string
    /**
     * 创建人
     */
    createdBy: string
    changeNote?: string
    /**
     * 是否删除：0-未删除，1-已删除
     */
    isDeleted?: number
  }

  /**
   * 获取分析配置请求参数
   */
  type GetAnalyzeConfigParams = Partial<AnalyzeConfigRecord> & {
    id: number
  }

  /**
   * 创建分析配置请求参数
   */
  type CreateAnalyzeConfigParams = Omit<AnalyzeConfigRecord, 'id' | 'isDeleted'>

  /**
   * 删除分析配置请求参数
   */
  type DeleteAnalyzeConfigsParams = Pick<AnalyzeConfigRecord, 'analyzeId'> & {
    updatedBy: string
    updateTime: string
  }
}
