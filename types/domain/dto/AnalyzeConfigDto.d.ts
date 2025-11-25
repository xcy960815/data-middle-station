/**
 * 前端传入的图表配置
 */
declare namespace AnalyzeConfigDto {
  /**
   * 图表配置
   */
  type CreateChartConfigRequest = Omit<AnalyzeConfigVo.ChartConfigResponse, 'id'>
  /**
   * 图表配置更新请求参数
   */
  type UpdateChartConfigRequest = AnalyzeConfigVo.ChartConfigResponse
  /**
   * 图表配置删除请求参数
   */
  type DeleteChartConfigRequest = {
    id: number
    updatedBy: string
    updateTime: string
  }
}
