/**
 * @desc 图表数据
 */
declare namespace ChartDataDao {
  /**
   * @desc 图表数据
   */
  type ChartData = {
    [key: string]: string | number | ChartData | undefined | null | boolean
  }

  /**
   * @desc 请求参数
   */
  type RequestParams = {
    filters: FilterStore.FilterOption[]
    orders: OrderStore.OrderOption[]
    groups: GroupStore.GroupOption[]
    dimensions: DimensionStore.DimensionOption[]
    commonChartConfig: ChartConfigDao.CommonChartConfig
    dataSource: string
  }
}
