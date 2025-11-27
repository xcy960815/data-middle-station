/**
 * @desc 图表配置
 */
declare namespace AnalyzeConfigVo {
  /**
   * 列配置响应
   */
  type ColumnResponse = DatabaseVo.GetTableColumnsResponse

  /**
   * 维度配置响应
   */
  type DimensionResponse = DatabaseVo.GetTableColumnsResponse & {
    __invalid?: boolean
  }

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
   * 分组配置
   */
  type GroupOption = DatabaseVo.GetTableColumnsResponse & {
    __invalid?: boolean
  }

  /**
   * 排序类型
   */
  type OrderType = AnalyzeConfigDao.OrderType

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
  type CommonChartConfigResponse = AnalyzeConfigDao.CommonChartConfig

  /**
   * @desc 私有图表配置
   */
  type PrivateChartConfigResponse = AnalyzeConfigDao.PrivateChartConfig

  /**
   * 图表配置响应
   */
  type ChartConfigResponse = AnalyzeConfigDao.ChartConfigOptions

  /**
   * @desc 饼图配置
   */
  type PieChartConfigResponse = AnalyzeConfigDao.PieChartConfig

  /**
   * @desc 柱状图配置
   */
  type IntervalChartConfigResponse = AnalyzeConfigDao.IntervalChartConfig

  /**
   * @desc 折线图配置
   */
  type LineChartConfigResponse = AnalyzeConfigDao.LineChartConfig

  /**
   * @desc 表格配置
   */
  type TableChartConfigResponse = AnalyzeConfigDao.TableChartConfig
}
