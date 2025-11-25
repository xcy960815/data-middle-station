declare namespace ChartDataDto {
  /**
   * @desc 公共图表配置
   */
  type CommonChartConfig = ChartConfigDao.CommonChartConfig
  /**
   * @desc 获取图表数据请求参数
   */
  type ChartDataRequest = {
    /**
     * @desc 过滤配置
     */
    filters: ChartConfigDao.FilterOption[]
    /**
     * @desc 排序配置
     */
    orders: ChartConfigDao.OrderOption[]
    /**
     * @desc 分组配置
     */
    groups: ChartConfigDao.GroupOption[]
    /**
     * @desc 维度配置
     */
    dimensions: ChartConfigDao.DimensionOption[]
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
    commonChartConfig?: ChartConfigDao.CommonChartConfig
  }
}
