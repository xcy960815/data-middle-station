/**
 * @desc 图表配置
 */
declare namespace ChartConfigVo {
  /**
   * 列配置
   */
  type ColumnOption = DatabaseVo.TableColumnOption

  /**
   * 维度配置
   */
  type DimensionOption = DatabaseVo.TableColumnOption & {
    __invalid?: boolean
  }

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
  type FilterOption = ChartConfigDao.FilterOption & {
    displayName: string
  }

  /**
   * 分组配置
   */
  type GroupOption = DatabaseVo.TableColumnOption & {
    __invalid?: boolean
  }

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
  type OrderOption = ChartConfigDao.OrderOption & {
    displayName: string
  }

  /**
   * @desc 公共图表配置
   */
  type CommonChartConfigResponse = ChartConfigDao.CommonChartConfig

  /**
   * @desc 私有图表配置
   */
  type PrivateChartConfigResponse = ChartConfigDao.PrivateChartConfig

  /**
   * 图表配置
   */
  type ChartConfigResponse = ChartConfigDao.ChartConfig

  /**
   * @desc 饼图配置
   */
  type PieChartConfigResponse = ChartConfigDao.PieChartConfig

  /**
   * @desc 柱状图配置
   */
  type IntervalChartConfigResponse = ChartConfigDao.IntervalChartConfig

  /**
   * @desc 折线图配置
   */
  type LineChartConfigResponse = ChartConfigDao.LineChartConfig

  /**
   * @desc 表格配置
   */
  type TableChartConfigResponse = ChartConfigDao.TableChartConfig
}
