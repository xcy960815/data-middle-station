/**
 * 前端传入的图表配置
 */
declare namespace AnalyseDto {
  /**
   * 分析配置
   */
  type AnalyseOption = AnalyseVo.AnalyseOption
  /**
   * 获取分析请求参数
   */
  type GetAnalyseRequestParams = {
    id: number
  }
}
