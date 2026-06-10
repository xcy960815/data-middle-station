declare namespace AnalyzeDataDto {
  /**
   * @desc 公共图表配置
   */
  type CommonChartConfig = AnalyzeConfigDao.CommonChartConfig

  /**
   * @desc 值/度量配置。
   */
  type MeasureOption = AnalyzeConfigDao.MeasureOption

  /**
   * @desc 分组配置
   */
  type DimensionOption = AnalyzeConfigDao.DimensionOption

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
     * @desc 分析 ID。已有分析查询需要携带，用于服务端做资源权限校验。
     */
    analyzeId?: number
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
    dimensions: DimensionOption[]
    /**
     * @desc 值/度量配置。
     */
    measures: MeasureOption[]
    /**
     * @desc 数据集 ID
     */
    datasetId: number
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
