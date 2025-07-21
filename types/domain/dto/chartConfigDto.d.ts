/**
 * 前端传入的图表配置
 */
declare namespace ChartConfigDto {
  /**
   * 图表配置
   */
  type ChartConfig = ChartConfigVo.ChartConfig & {
    id?: number
  }
}
