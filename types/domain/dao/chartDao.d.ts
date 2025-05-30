/**
 * @desc  表结构
 */
declare namespace ChartDao {
  type ChartDataDao = Array<{
    [key: string]: string | number
  }>

  type ChartOptionDao = {
    id: number
    chartName: string
    chartType: string
    viewCount: number
    createTime: string
    updateTime: string
    createdBy: string
    updatedBy: string
    chartConfigId: number
    chartConfig?: ChartConfigDao.ChartConfigOptionDao
  }
}
