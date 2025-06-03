/**
 * @desc  图表表结构
 */
declare namespace ChartDao {
  type ChartDataDao = Array<{
    [key: string]: string | number
  }>

  type ChartOption = {
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
