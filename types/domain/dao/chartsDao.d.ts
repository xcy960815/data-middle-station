/**
 * @desc  表结构
 */
declare namespace ChartsDao {
  type ChartDataDao = Array<{
    [key: string]: string | number
  }>

  type ChartsOption = {
    id: number
    chartName: string
    filter: string
    group: string
    dimension: string
    chartData: ChartDataDao
  }
}
