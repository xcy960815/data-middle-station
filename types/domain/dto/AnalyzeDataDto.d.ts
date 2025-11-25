declare namespace AnalyzeDataDto {
  /**
   * @desc 公共图表配置
   */
  type CommonChartConfig = AnalyzeConfigDao.CommonChartConfig
  /**
   * @desc 获取图表数据请求参数
   */
  type ChartDataRequest = {
    /**
     * @desc 过滤配置
     */
    filters: AnalyzeConfigDao.FilterOption[]
    /**
     * @desc 排序配置
     */
    orders: AnalyzeConfigDao.OrderOption[]
    /**
     * @desc 分组配置
     */
    groups: AnalyzeConfigDao.GroupOption[]
    /**
     * @desc 维度配置
     */
    dimensions: AnalyzeConfigDao.DimensionOption[]
    /**
     * @desc 数据源
     */
    dataSource: string
    /**
     * @desc 数据源
     */
    dataSource: string
    /**
     * @desc 公共图表配置
     */
    commonChartConfig?: AnalyzeConfigDao.CommonChartConfig
  }
}
