/**
 * @desc  表结构
 */
declare namespace AnalyseVo {
  /**
   * 图表数据
   */
  type ChartDataVo = Array<{
    [key: string]: string | number
  }>
  /**
   * 图表配置
   */
  type AnalyseOption = {
    id: number
    analyseName: string
    analyseDesc: string
    viewCount: number
    createTime: string
    updateTime: string
    createdBy: string
    updatedBy: string
    chartConfigId: number | null
    chartConfig: {
      id: number
      chartType: string
      dataSource: string | null
      column: ChartConfigVo.ColumnOption[]
      dimension: ChartConfigVo.DimensionOption[]
      filter: ChartConfigVo.FilterOption[]
      group: ChartConfigVo.GroupOption[]
      order: ChartConfigVo.OrderOption[]
      limit: number
      createTime: string
      updateTime: string
    } | null
  }
}
