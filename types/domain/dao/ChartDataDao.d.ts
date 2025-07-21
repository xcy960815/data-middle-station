/**
 * @desc 图表数据
 */
declare namespace ChartDataDao {
  /**
   * @desc 图表数据
   */
  type ChartData = Array<{
    [key: string]: string | number
  }>

  /**
   * @desc 请求参数
   */
  type RequestParams = {
    filters: FilterStore.FilterOption[]
    orders: OrderStore.OrderOption[]
    groups: GroupStore.GroupOption[]
    dimensions: DimensionStore.DimensionOption[]
    limit: number
    dataSource: string
  }
}
