/**
 * @desc  表结构
 */
declare namespace AnalyseVo {
  /**
   * 分析数据
   */
  type ChartDataVo = Array<{
    [key: string]: string | number
  }>
  /**
   * 分析配置
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
    chartConfig: ChartConfigVo.ChartConfig | null
  }
}
