declare namespace AnalyzeDataDto {
  /**
   * @desc 公共图表配置
   */
  type CommonChartConfig = AnalyzeConfigDao.CommonChartConfig

  /**
   * @desc 维度配置
   */
  type DimensionOption = AnalyzeConfigDao.DimensionOption

  /**
   * @desc 分组配置
   */
  type GroupOption = AnalyzeConfigDao.GroupOptions

  /**
   * @desc 过滤配置
   */
  type FilterOption = AnalyzeConfigDao.FilterOptions

  /**
   * @desc 排序配置
   */
  type OrderOption = AnalyzeConfigDao.OrderOptions

  /**
   * @desc 获取图表数据请求参数
   */
  type ChartDataOptions = {
    /**
     * @desc 过滤配置
     */
    filters: FilterOption[]
    /**
     * @desc 排序配置
     */
    orders: OrderOption[]
    /**
     * @desc 分组配置
     */
    groups: GroupOption[]
    /**
     * @desc 维度配置
     */
    dimensions: DimensionOption[]
    /**
     * @desc 数据源
     */
    dataSource: string
    /**
     * @desc 公共图表配置
     */
    commonChartConfig?: CommonChartConfig
  }

  /**
   * @desc 图表数据响应
   */
  type ChartDataResponse = AnalyzeDataDao.ChartData
}
