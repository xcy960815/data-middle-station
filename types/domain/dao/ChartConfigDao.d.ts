/**
 * 图表配置
 */
declare namespace ChartConfigDao {
  /**
   * 列配置
   */
  type ColumnOption = DatabaseVo.TableColumnOption

  /**
   * 维度配置
   */
  type DimensionOption = ColumnOption & {
    __invalid?: boolean
  }

  /**
   * 过滤聚合方式
   */
  const FilterAggregationsEnum = {
    原始值: 'raw',
    计数: 'count',
    计数去重: 'countDistinct',
    总计: 'sum',
    平均: 'avg',
    最大值: 'max',
    最小值: 'min'
  } as const

  /**
   * 过滤类型
   */
  const FilterTypeEnums = {
    等于: 'eq',
    不等于: 'neq',
    大于: 'gt',
    大于等于: 'gte',
    小于: 'lt',
    小于等于: 'lte',
    包含: 'like',
    不包含: 'notLike',
    为空: 'isNull',
    不为空: 'isNotNull'
  } as const

  /**
   * 过滤类型
   */
  type FilterType = (typeof FilterTypeEnums)[keyof typeof FilterTypeEnums]

  /**
   * 过滤聚合方式
   */
  type FilterAggregationsType = (typeof FilterAggregationsEnum)[keyof typeof FilterAggregationsEnum]

  /**
   * 过滤配置
   */
  type FilterOption = ColumnOption & {
    /**
     * 过滤类型
     */
    filterType?: FilterType
    /**
     * 过滤值
     */
    filterValue?: string
    /**
     * 显示名称
     */
    displayName?: string
    /**
     * 聚合方式
     */
    aggregationType: FilterAggregationsType
  }

  /**
   * 分组配置
   */
  type GroupOption = ColumnOption & {
    __invalid?: boolean
  }

  /**
   * 排序类型
   */
  const OrderTypeEnums = {
    升序: 'asc',
    降序: 'desc'
  } as const

  type OrderType = (typeof OrderTypeEnums)[keyof typeof OrderTypeEnums]

  /**
   * 排序聚合方式
   */
  const OrderAggregationsEnum = {
    原始值: 'raw',
    计数: 'count',
    总计: 'sum',
    平均: 'avg',
    最大值: 'max',
    最小值: 'min'
  } as const

  /**
   * 排序聚合方式
   */
  type OrderAggregationsType = (typeof OrderAggregationsEnum)[keyof typeof OrderAggregationsEnum]

  /**
   * 排序配置
   */
  type OrderOption = ColumnOption & {
    /**
     * 排序类型
     */
    orderType: OrderType
    /**
     * 聚合方式
     */
    aggregationType: OrderAggregationsType
  }

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
     * 表头排序激活背景色
     */
    sortActiveBackground: string
    /**
     * 可排序颜色
     */
    sortActiveColor: string

    // ========== 滚动条样式配置 ==========
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

    // ========== 其他配置 ==========
    /**
     * 表格边框颜色
     */
    borderColor: string
    /**
     * 缓冲行数
     */
    bufferRows: number
    /**
     * 滚动阈值
     */
    scrollThreshold: number
  }

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
   * 图表配置
   */
  type ChartConfig = {
    /**
     * 图表id
     */
    id: number
    /**
     * 数据源
     */
    dataSource: string | null
    /**
     * 图表类型
     */
    chartType: string
    /**
     * 列配置
     */
    columns: ColumnOption[]
    /**
     * 维度配置
     */
    dimensions: DimensionOption[]
    /**
     * 过滤配置
     */
    filters: FilterOption[]
    /**
     * 分组配置
     */
    groups: GroupOption[]
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
    /**
     * 更新人
     */
    updatedBy: string
    /**
     * 是否删除：0-未删除，1-已删除
     */
    isDeleted?: number
  }
}
