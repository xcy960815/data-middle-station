/**
 * 前端传入的图表配置
 */
declare namespace AnalyzeConfigDto {
  type ChartConfigPayload = Omit<
    AnalyzeConfigDao.ChartConfigOptions,
    'id' | 'createTime' | 'createdBy' | 'updateTime' | 'updatedBy' | 'isDeleted'
  >

  /**
   * 获取图表配置请求参数
   */
  type GetChartConfigRequest = {
    id: number
  }

  /**
   * 图表配置更新请求参数
   */
  type UpdateChartConfigRequest = Pick<AnalyzeConfigDao.ChartConfigOptions, 'id'> & Partial<ChartConfigPayload>

  /**
   * 图表配置删除请求参数
   */
  type DeleteChartConfigRequest = Pick<AnalyzeConfigDao.ChartConfigOptions, 'id'>

  /**
   * 创建图表配置请求参数
   */
  type CreateChartConfigRequest = ChartConfigPayload
}
