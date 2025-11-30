/**
 * 前端传入的图表配置
 */
declare namespace AnalyzeConfigDto {
  type ChartConfigOptions = AnalyzeConfigDao.ChartConfigOptions
  /**
   * 获取图表配置请求参数
   */
  type GetChartConfigOptions = Partial<ChartConfigOptions> & {
    id: number
  }
  /**
   * 图表配置更新请求参数
   */
  type UpdateChartConfigOptions = Omit<
    ChartConfigOptions,
    'createTime' | 'createdBy' | 'updateTime' | 'updatedBy' | 'isDeleted'
  >
  /**
   * 图表配置删除请求参数
   */
  type DeleteChartConfigOptions = Pick<ChartConfigOptions, 'id' | 'updatedBy' | 'updateTime'>
  /**
   * 创建图表配置请求参数
   */
  type CreateChartConfigOptions = Omit<
    ChartConfigOptions,
    'id' | 'createTime' | 'createdBy' | 'updateTime' | 'updatedBy' | 'isDeleted'
  >
}
