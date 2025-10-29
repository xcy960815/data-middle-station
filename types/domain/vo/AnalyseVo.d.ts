/**
 * @desc  分析响应
 */
declare namespace AnalyseVo {
  /**
   * 图表数据
   */
  type ChartDataVo = Array<{
    [key: string]: string | number
  }>
  /**
   * 获取分析响应
   */
  type AnalyseResponse = {
    id: number
    analyseName: string
    analyseDesc: string
    viewCount: number
    createTime: string
    updateTime: string
    createdBy: string
    updatedBy: string
    chartConfigId: number | null
    chartConfig: ChartConfigVo.ChartConfigResponse | null
  }
}
