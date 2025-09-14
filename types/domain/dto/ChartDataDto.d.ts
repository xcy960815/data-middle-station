declare namespace ChartDataDto {
  /**
   * @desc 公共图表配置
   */
  type CommonChartConfig = ChartConfigDao.CommonChartConfig
  /**
   * @desc 获取图表数据请求参数
   */
  type ChartDataRequest = {
    filters: FilterStore.FilterOption[]
    orders: OrderStore.OrderOption[]
    groups: GroupStore.GroupOption[]
    dimensions: DimensionStore.DimensionOption[]
    dataSource: string
    commonChartConfig?: CommonChartConfig
  }
}
