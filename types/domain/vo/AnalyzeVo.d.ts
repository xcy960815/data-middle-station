/**
 * @desc  分析响应
 */
declare namespace AnalyzeVo {
  type AnalyzeListItem = Pick<
    AnalyzeDao.AnalyzeOptions,
    'id' | 'analyzeName' | 'analyzeDesc' | 'viewCount' | 'createTime' | 'updateTime' | 'createdBy' | 'updatedBy'
  >

  type GetAnalyzesOptions = {
    list: AnalyzeListItem[]
    total: number
    page: number
    pageSize: number
    keyword: string
    sortField: AnalyzeDao.AnalyzeListSortField
    sortOrder: AnalyzeDao.AnalyzeListSortOrder
  }

  /**
   * @desc 分析选项
   */
  type AnalyzeOptions = AnalyzeDao.AnalyzeOptions & {
    /**
     * 图表配置
     */
    chartConfig: AnalyzeConfigVo.ChartConfigOptions | null
  }

  /**
   * @desc 获取分析响应
   */
  type GetAnalyzeOptions = AnalyzeOptions

  /**
   * @desc 创建分析响应
   */
  type CreateAnalyzeOptions = AnalyzeOptions

  /**
   * @desc 更新分析响应
   */
  type UpdateAnalyzeOptions = AnalyzeOptions

  /**
   * @desc 更新分析名称响应
   */
  type UpdateAnalyzeNameOptions = boolean

  /**
   * @desc 更新分析描述响应
   */
  type UpdateAnalyzeDescOptions = boolean

  /**
   * @desc 删除分析响应
   */
  type DeleteAnalyzeOptions = boolean
}
