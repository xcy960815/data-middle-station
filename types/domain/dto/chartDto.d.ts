/**
 * 前端传入的图表配置
 */
declare namespace ChartDto {
  type ChartOption = Partial<ChartDao.ChartOption>
  // {
  //   id: number
  //   chartName: string
  //   chartType: string
  //   chartDesc: string
  //   chartConfigId: number
  //   chartConfig: {
  //     dataSource: string
  //     column: ChartConfigVo.ColumnOption[]
  //     dimension: ChartConfigVo.DimensionOption[]
  //     filter: ChartConfigVo.FilterOption[]
  //     group: ChartConfigVo.GroupOption[]
  //     order: ChartConfigVo.OrderOption[]
  //   }
  // }
}
