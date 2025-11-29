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
  type DimensionOptions = DatabaseVo.GetTableColumnsOptions & {
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
  type FilterOptions = AnalyzeConfigDao.FilterOptions & {
    displayName: string
  }

  /**
   * 分组配置选项
   */
  type GroupOptions = DatabaseVo.GetTableColumnsOptions & {
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
  type OrderOptions = AnalyzeConfigDao.OrderOptions & {
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
  type ChartConfigOptions = AnalyzeConfigDao.ChartConfigOptions

  /**
   * @desc 获取图表配置响应
   */
  type GetChartConfigOptions = ChartConfigOptions

  /**
   * @desc 创建图表配置响应
   */
  type CreateChartConfigOptions = ChartConfigOptions

  /**
   * @desc 更新图表配置响应
   */
  type UpdateChartConfigOptions = boolean

  /**
   * @desc 删除图表配置响应
   */
  type DeleteChartConfigOptions = boolean

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
}
