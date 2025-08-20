declare namespace ChartDataDto {
  /**
   * @desc 公共图表配置
   */
  type CommonChartConfig = ChartConfigDao.CommonChartConfig
  /**
   * @desc 请求参数
   */
  type RequestParams = {
    filters: FilterStore.FilterOption[]
    orders: OrderStore.OrderOption[]
    groups: GroupStore.GroupOption[]
    dimensions: DimensionStore.DimensionOption[]
    commonChartConfig: CommonChartConfig
    dataSource: string
  }
}
