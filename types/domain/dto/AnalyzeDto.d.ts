/**
 * 前端请求数据
 */
declare namespace AnalyzeDto {
  type AnalyzeOptions = Omit<
    AnalyzeDao.AnalyzeOptions,
    'createTime' | 'createdBy' | 'updateTime' | 'updatedBy' | 'isDeleted'
  > & {
    chartConfig: Omit<
      AnalyzeConfigDao.ChartConfigOptions,
      'createTime' | 'createdBy' | 'updateTime' | 'updatedBy' | 'isDeleted'
    >
  }

  /**
   * 创建分析请求参数
   */
  type CreateAnalyzeOptions = Omit<
    AnalyzeDao.AnalyzeOptions,
    'id' | 'createTime' | 'createdBy' | 'updateTime' | 'updatedBy' | 'isDeleted'
  > & {
    chartConfig: Omit<
      AnalyzeConfigDao.ChartConfigOptions,
      'id' | 'createTime' | 'createdBy' | 'updateTime' | 'updatedBy' | 'isDeleted'
    >
  }

  /**
   * 获取分析请求参数
   */
  type GetAnalyzeOptions = Partial<
    Pick<
      AnalyzeDao.AnalyzeOptions,
      'id' | 'updatedBy' | 'updateTime' | 'createdBy' | 'createTime' | 'analyzeName' | 'analyzeDesc'
    >
  > & {
    id: number
  }
  /**
   * 更新分析请求参数
   */
  type UpdateAnalyzeOptions = Omit<AnalyzeDao.AnalyzeOptions, 'isDeleted' | 'createTime' | 'createdBy'> & {
    chartConfig: Omit<
      AnalyzeConfigDao.ChartConfigOptions,
      'id' | 'createTime' | 'createdBy' | 'updateTime' | 'updatedBy' | 'isDeleted'
    >
  }
  /**
   * 更新分析名称请求参数
   */
  type UpdateAnalyzeNameOptions = Pick<AnalyzeDao.AnalyzeOptions, 'id' | 'analyzeName' | 'updatedBy' | 'updateTime'>

  /**
   * 更新分析描述请求参数
   */
  type UpdateAnalyzeDescOptions = Pick<AnalyzeDao.AnalyzeOptions, 'id' | 'analyzeDesc' | 'updatedBy' | 'updateTime'>
  /**
   * 删除分析请求参数
   */
  type DeleteAnalyzeOptions = Pick<AnalyzeDao.AnalyzeOptions, 'id' | 'updatedBy' | 'updateTime'>
}
