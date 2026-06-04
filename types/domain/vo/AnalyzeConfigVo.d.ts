/**
 * @desc 图表配置
 */
declare namespace AnalyzeConfigVo {
  /**
   * 列配置选项
   */
  type ColumnItem = DatabaseVo.TableColumnItem

  /**
   * 值/度量配置选项
   */
  type MeasureOption = DatabaseVo.TableColumnItem

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
  type DimensionOption = DatabaseVo.TableColumnItem

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
  type CommonChartConfigItem = AnalyzeConfigDao.CommonChartConfig

  /**
   * @desc 私有图表配置
   */
  type PrivateChartConfigItem = AnalyzeConfigDao.PrivateChartConfig

  /**
   * 分析配置响应
   */
  type AnalyzeConfigResponse = Omit<
    AnalyzeConfigDao.AnalyzeConfigRecord,
    'columns' | 'measures' | 'filters' | 'dimensions' | 'orders'
  > & {
    columns: ColumnItem[]
    measures: MeasureOption[]
    filters: FilterOption[]
    dimensions: DimensionOption[]
    orders: OrderOption[]
  }

  type ChartConfigResponse = AnalyzeConfigResponse

  type CleanRuntimeValidationFieldsResponse = {
    scannedCount: number
    updatedCount: number
    removedFieldCount: number
  }

  /**
   * @desc 饼图配置
   */
  type PieChartConfigItem = AnalyzeConfigDao.PieChartConfig

  /**
   * @desc 柱状图配置
   */
  type IntervalChartConfigItem = AnalyzeConfigDao.IntervalChartConfig

  /**
   * @desc 折线图配置
   */
  type LineChartConfigItem = AnalyzeConfigDao.LineChartConfig

  /**
   * @desc 表格配置
   */
  type TableChartConfigItem = AnalyzeConfigDao.TableChartConfig

  /**
   * @desc 表格配置条件选项
   */
  type ConditionItem = AnalyzeConfigDao.ConditionItem
}
