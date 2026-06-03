/**
 * 前端请求数据
 */
declare namespace AnalyzeDto {
  type AnalyzeListSortField = AnalyzeDao.AnalyzeListSortField

  type AnalyzeListSortOrder = AnalyzeDao.AnalyzeListSortOrder

  /**
   * 获取分析请求参数
   */
  type GetAnalyzeRequest = Pick<AnalyzeDao.AnalyzeRecord, 'id'> & {
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
  type UpdateAnalyzeRequest = Pick<AnalyzeDao.AnalyzeRecord, 'id'> &
    Partial<Pick<AnalyzeDao.AnalyzeRecord, 'analyzeName' | 'analyzeDesc' | 'currentConfigId'>> & {
      chartConfig?: AnalyzeConfigDto.AnalyzeConfigPayload
    }

  /**
   * 删除分析请求参数
   */
  type DeleteAnalyzeRequest = Pick<AnalyzeDao.AnalyzeRecord, 'id'>

  /**
   * 创建分析请求参数
   */
  type CreateAnalyzeRequest = Pick<AnalyzeDao.AnalyzeRecord, 'analyzeName' | 'analyzeDesc'> & {
    currentConfigId?: number | null
    chartConfig?: AnalyzeConfigDto.AnalyzeConfigPayload
  }

  /**
   * 更新分析名称请求参数
   */
  type UpdateAnalyzeNameRequest = Pick<AnalyzeDao.AnalyzeRecord, 'id' | 'analyzeName'>

  /**
   * 更新分析描述请求参数
   */
  type UpdateAnalyzeDescRequest = Pick<AnalyzeDao.AnalyzeRecord, 'id' | 'analyzeDesc'>
}
