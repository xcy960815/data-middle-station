/**
 * 前端请求数据
 */
declare namespace AnalyzeDto {

  type AnalyzeOptions = Omit<AnalyzeDao.AnalyzeOption, 'createTime' | 'createdBy' | 'updateTime' | 'updatedBy' | 'isDeleted'>
    & {
      chartConfig: Omit<AnalyzeConfigDao.ChartConfigOptions, 'createTime' | 'createdBy' | 'updateTime' | 'updatedBy' | 'isDeleted'>
    }


  /**
   * 创建分析请求参数
   */
  type CreateAnalyzeOptions = Omit<AnalyzeDao.AnalyzeOption, 'id' | 'createTime' | 'createdBy' | 'updateTime' | 'updatedBy' | 'isDeleted'>
    & {
      chartConfig: Omit<AnalyzeConfigDao.ChartConfigOptions, 'id' | 'createTime' | 'createdBy' | 'updateTime' | 'updatedBy' | 'isDeleted'>
    }

  /**
   * 获取分析请求参数
   */
  type GetAnalyzeOptions = Partial<Pick<AnalyzeDao.AnalyzeOption, 'id' | 'updatedBy' | 'updateTime' | 'createdBy' | 'createTime' | 'analyzeName' | 'analyzeDesc'>> & {
    id: number
  }
  /**
   * 更新分析请求参数
   */
  type UpdateAnalyzeOptions = Omit<AnalyzeDao.AnalyzeOption, 'isDeleted' | 'createTime' | 'createdBy'>
    & {
      chartConfig: Omit<AnalyzeConfigDao.ChartConfigOptions, 'id' | 'createTime' | 'createdBy' | 'updateTime' | 'updatedBy' | 'isDeleted'>
    }
  /**
   * 更新分析名称请求参数
   */
  type UpdateAnalyzeNameOptions = Pick<AnalyzeDao.AnalyzeOption, 'id' | 'analyzeName' | 'updatedBy' | 'updateTime'>

  /**
   * 更新分析描述请求参数
   */
  type UpdateAnalyzeDescOptions = Pick<AnalyzeDao.AnalyzeOption, 'id' | 'analyzeDesc' | 'updatedBy' | 'updateTime'>
  /**
   * 删除分析请求参数
   */
  type DeleteAnalyzeOption = Pick<AnalyzeDao.AnalyzeOption, 'id' | 'updatedBy' | 'updateTime'>
}
