/**
 * @desc  表结构
 */
declare namespace ChartsVo {
  type ChartDataVo = Array<{
    [key: string]: string | number
  }>

  type ChartsOption = {
    id: number
    chartName: string
    filter: any
    group: any
    order: any
    dimension: any
    chartData: ChartDataVo
  }
}
