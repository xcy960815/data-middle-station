/**
 * 前端请求数据
 */
declare namespace AnalyzeDto {
  type AnalyzeOption = AnalyzeDao.AnalyzeOption & {
    chartConfig?: AnalyzeConfigDao.ChartConfigOptions
  }

  type AnalyzeListSortField = AnalyzeDao.AnalyzeListSortField

  type AnalyzeListSortOrder = AnalyzeDao.AnalyzeListSortOrder

  /**
   * 获取分析请求参数
   */
  type GetAnalyzeOptions = Partial<AnalyzeOption> & {
    id: number
    trackViewCount?: boolean
  }

  /**
   * 获取分析列表请求参数
   */
  type GetAnalyzesOptions = {
    page?: number
    pageSize?: number
    keyword?: string
    sortField?: AnalyzeListSortField
    sortOrder?: AnalyzeListSortOrder
  }

  /**
   * 更新分析请求参数
   */
  type UpdateAnalyzeOptions = Pick<AnalyzeDao.AnalyzeOption, 'id'> &
    Partial<Pick<AnalyzeDao.AnalyzeOption, 'analyzeName' | 'analyzeDesc' | 'chartConfigId'>> & {
      chartConfig?: Omit<
        AnalyzeConfigDao.ChartConfigOptions,
        'id' | 'createTime' | 'createdBy' | 'updateTime' | 'updatedBy' | 'isDeleted'
      >
    }

  /**
   * 删除分析请求参数
   */
  type DeleteAnalyzeOptions = Pick<AnalyzeDao.AnalyzeOption, 'id'>

  /**
   * 创建分析请求参数
   */
  type CreateAnalyzeOptions = Pick<AnalyzeDao.AnalyzeOption, 'analyzeName' | 'analyzeDesc'> & {
    chartConfigId?: number | null
    chartConfig?: Omit<
      AnalyzeConfigDao.ChartConfigOptions,
      'id' | 'createTime' | 'createdBy' | 'updateTime' | 'updatedBy' | 'isDeleted'
    >
  }

  /**
   * 更新分析名称请求参数
   */
  type UpdateAnalyzeNameOptions = Pick<AnalyzeDao.AnalyzeOption, 'id' | 'analyzeName'>

  /**
   * 更新分析描述请求参数
   */
  type UpdateAnalyzeDescOptions = Pick<AnalyzeDao.AnalyzeOption, 'id' | 'analyzeDesc'>
}
