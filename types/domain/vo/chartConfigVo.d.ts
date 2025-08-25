/**
 * @desc 图表配置
 */
declare namespace ChartConfigVo {
  /**
   * 列配置
   */
  type ColumnOption = ChartConfigDao.ColumnOption

  /**
   * 维度配置
   */
  type DimensionOption = ChartConfigDao.DimensionOption

  /**
   * 过滤类型
   */
  type FilterType = ChartConfigDao.FilterType

  /**
   * 过滤聚合方式
   */
  type FilterAggregationsType = ChartConfigDao.FilterAggregationsType

  /**
   * 过滤配置
   */
  type FilterOption = ChartConfigDao.FilterOption

  /**
   * 分组配置
   */
  type GroupOption = ChartConfigDao.GroupOption

  /**
   * 排序类型
   */
  type OrderType = ChartConfigDao.OrderType

  /**
   * 排序聚合方式
   */
  type OrderAggregationsType = ChartConfigDao.OrderAggregationsType

  /**
   * 排序配置
   */
  type OrderOption = ChartConfigDao.OrderOption

  /**
   * @desc 公共图表配置
   */
  type CommonChartConfig = ChartConfigDao.CommonChartConfig

  /**
   * @desc 私有图表配置
   */
  type PrivateChartConfig = ChartConfigDao.PrivateChartConfig

  /**
   * 图表配置
   */
  type ChartConfig = ChartConfigDao.ChartConfig

  /**
   * @desc 饼图配置
   */
  type PieChartConfig = ChartConfigDao.PieChartConfig

  /**
   * @desc 柱状图配置
   */
  type IntervalChartConfig = ChartConfigDao.IntervalChartConfig

  /**
   * @desc 折线图配置
   */
  type LineChartConfig = ChartConfigDao.LineChartConfig

  /**
   * @desc 表格配置
   */
  type TableChartConfig = ChartConfigDao.TableChartConfig
}
