/**
 * 前端请求数据
 */
declare namespace AnalyzeDto {
  type AnalyzeListSortField = AnalyzeDao.AnalyzeListSortField

  type AnalyzeListSortOrder = AnalyzeDao.AnalyzeListSortOrder

  /**
   * 获取分析请求参数
   */
  type GetAnalyzeRequest = Pick<AnalyzeDao.AnalyzeOption, 'id'> & {
    trackViewCount?: boolean
  }

  /**
   * 获取分析列表请求参数
   */
  type GetAnalyzeListRequest = {
    page?: number
    pageSize?: number
    keyword?: string
    sortField?: AnalyzeListSortField
    sortOrder?: AnalyzeListSortOrder
  }

  /**
   * 更新分析请求参数
   */
  type UpdateAnalyzeRequest = Pick<AnalyzeDao.AnalyzeOption, 'id'> &
    Partial<Pick<AnalyzeDao.AnalyzeOption, 'analyzeName' | 'analyzeDesc' | 'chartConfigId'>> & {
      chartConfig?: AnalyzeConfigDto.ChartConfigPayload
    }

  /**
   * 删除分析请求参数
   */
  type DeleteAnalyzeRequest = Pick<AnalyzeDao.AnalyzeOption, 'id'>

  /**
   * 创建分析请求参数
   */
  type CreateAnalyzeRequest = Pick<AnalyzeDao.AnalyzeOption, 'analyzeName' | 'analyzeDesc'> & {
    chartConfigId?: number | null
    chartConfig?: AnalyzeConfigDto.ChartConfigPayload
  }

  /**
   * 更新分析名称请求参数
   */
  type UpdateAnalyzeNameRequest = Pick<AnalyzeDao.AnalyzeOption, 'id' | 'analyzeName'>

  /**
   * 更新分析描述请求参数
   */
  type UpdateAnalyzeDescRequest = Pick<AnalyzeDao.AnalyzeOption, 'id' | 'analyzeDesc'>
}
