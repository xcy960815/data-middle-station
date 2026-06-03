declare namespace AnalyzeDataDto {
  /**
   * @desc 公共图表配置
   */
  type CommonChartConfig = AnalyzeConfigDao.CommonChartConfig

  /**
   * @desc 值/度量配置。历史命名沿用 DimensionOption。
   */
  type DimensionOption = AnalyzeConfigDao.DimensionOption

  /**
   * @desc 分组配置
   */
  type GroupOption = AnalyzeConfigDao.GroupOption

  /**
   * @desc 过滤配置
   */
  type FilterOption = AnalyzeConfigDao.FilterOption

  /**
   * @desc 排序配置
   */
  type OrderOption = AnalyzeConfigDao.OrderOption

  /**
   * @desc 获取图表数据请求参数
   */
  type AnalyzeDataQuery = {
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
     * @desc 值/度量配置。字段名沿用 dimensions 以兼容历史 API。
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
  type AnalyzeDataResponse = AnalyzeDataDao.AnalyzeData
}
