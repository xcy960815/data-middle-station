/**
 * @desc  图表表结构
 */
declare namespace AnalyseDao {
  type ChartDataDao = Array<{
    [key: string]: string | number
  }>

  type AnalyseOption = {
    id: number
    chartName: string
    chartDesc: string
    viewCount: number
    createTime: string
    updateTime: string
    createdBy: string
    updatedBy: string
    chartConfigId: number | null
  }
}
