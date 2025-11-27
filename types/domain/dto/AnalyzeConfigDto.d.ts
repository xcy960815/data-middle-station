/**
 * 前端传入的图表配置
 */
declare namespace AnalyzeConfigDto {

  /**
   * 获取图表配置请求参数
   */
  type GetChartConfigOptions = Partial<AnalyzeConfigDao.ChartConfigOptions> & {
    id: number
  }
  /**
   * 图表配置更新请求参数
   */
  type UpdateChartConfigOptions = Omit<AnalyzeConfigDao.ChartConfigOptions, 'createTime' | 'createdBy' | 'updateTime' | 'updatedBy' | 'isDeleted'>
  /**
   * 图表配置删除请求参数
   */
  type DeleteChartConfigOptions = Pick<AnalyzeConfigDao.ChartConfigOptions, 'id' | 'updatedBy' | 'updateTime'>
  /**
   * 创建图表配置请求参数
   */
  type CreateChartConfigOptions = Omit<AnalyzeConfigDao.ChartConfigOptions, 'id' | 'createTime' | 'createdBy' | 'updateTime' | 'updatedBy' | 'isDeleted'>
}
