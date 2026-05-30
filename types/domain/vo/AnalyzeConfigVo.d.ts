/**
 * @desc 图表配置
 */
declare namespace AnalyzeConfigVo {
  /**
   * 列配置选项
   */
  type ColumnOptions = DatabaseVo.GetTableColumnsOptions

  /**
   * 维度配置选项
   */
  type DimensionOption = DatabaseVo.GetTableColumnsOptions & {
    __invalid?: boolean
  }

  /**
   * 过滤聚合方式枚举
   */
  type FilterAggregationsEnum = AnalyzeConfigDao.FilterAggregationsEnum

  /**
   * 过滤类型枚举
   */
  type FilterTypeEnums = AnalyzeConfigDao.FilterTypeEnums

  /**
   * 过滤类型
   */
  type FilterType = AnalyzeConfigDao.FilterType

  /**
   * 过滤聚合方式
   */
  type FilterAggregationsType = AnalyzeConfigDao.FilterAggregationsType

  /**
   * 过滤配置
   */
  type FilterOption = AnalyzeConfigDao.FilterOption & {
    displayName: string
  }

  /**
   * 分组配置选项
   */
  type GroupOption = DatabaseVo.GetTableColumnsOptions & {
    __invalid?: boolean
  }

  /**
   * 排序类型枚举
   */
  type OrderTypeEnums = AnalyzeConfigDao.OrderTypeEnums

  /**
   * 排序类型
   */
  type OrderType = AnalyzeConfigDao.OrderType

  /**
   * 排序聚合方式枚举
   */
  type OrderAggregationsEnum = AnalyzeConfigDao.OrderAggregationsEnum

  /**
   * 排序聚合方式
   */
  type OrderAggregationsType = AnalyzeConfigDao.OrderAggregationsType

  /**
   * 排序配置
   */
  type OrderOption = AnalyzeConfigDao.OrderOption & {
    displayName: string
  }

  /**
   * @desc 公共图表配置
   */
  type CommonChartConfigOptions = AnalyzeConfigDao.CommonChartConfig

  /**
   * @desc 私有图表配置
   */
  type PrivateChartConfigOptions = AnalyzeConfigDao.PrivateChartConfig

  /**
   * 图表配置响应
   */
  type ChartConfigResponse = Omit<
    AnalyzeConfigDao.ChartConfigOptions,
    'columns' | 'dimensions' | 'filters' | 'groups' | 'orders'
  > & {
    columns: ColumnOptions[]
    dimensions: DimensionOption[]
    filters: FilterOption[]
    groups: GroupOption[]
    orders: OrderOption[]
  }

  /**
   * @desc 饼图配置
   */
  type PieChartConfigOptions = AnalyzeConfigDao.PieChartConfig

  /**
   * @desc 柱状图配置
   */
  type IntervalChartConfigOptions = AnalyzeConfigDao.IntervalChartConfig

  /**
   * @desc 折线图配置
   */
  type LineChartConfigOptions = AnalyzeConfigDao.LineChartConfig

  /**
   * @desc 表格配置
   */
  type TableChartConfigOptions = AnalyzeConfigDao.TableChartConfig

  /**
   * @desc 表格配置条件选项
   */
  type ConditionOptions = AnalyzeConfigDao.ConditionOptions
}
