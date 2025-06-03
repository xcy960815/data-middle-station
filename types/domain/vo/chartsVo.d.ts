/**
 * @desc  表结构
 */
declare namespace ChartVo {
  type ChartDataVo = Array<{
    [key: string]: string | number
  }>

  type ChartOption = {
    id: number
    chartName: string
    chartType: string
    chartDesc: string
    viewCount: number
    createTime: string
    updateTime: string
    createdBy: string
    updatedBy: string
    chartConfigId: number | null
    chartConfig: {
      dataSource: string | null
      column: ChartConfigVo.ColumnOption[]
      dimension: ChartConfigVo.DimensionOption[]
      filter: ChartConfigVo.FilterOption[]
      group: ChartConfigVo.GroupOption[]
      order: ChartConfigVo.OrderOption[]
    }
  }
}
