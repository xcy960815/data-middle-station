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
}
