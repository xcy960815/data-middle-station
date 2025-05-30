/**
 * @desc  表结构
 */
declare namespace ChartsVo {
  type ChartDataVo = Array<{
    [key: string]: string | number
  }>

  type ChartsOptionVo = {
    id: number
    chartName: string
    chartType: string
    viewCount: number
    createTime: string
    updateTime: string
    createdBy: string
    updatedBy: string
    chartConfigId: number
    chartConfig: {
      dataSource: string
      column: ChartConfigVo.ColumnOption[]
      dimension: ChartConfigVo.DimensionOption[]
      filter: ChartConfigVo.FilterOption[]
      group: ChartConfigVo.GroupOption[]
      order: ChartConfigVo.OrderOption[]
    }
  }
}
