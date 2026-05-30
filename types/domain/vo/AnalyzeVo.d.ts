/**
 * @desc  分析响应
 */
declare namespace AnalyzeVo {
  type AnalyzeDetailResponse = AnalyzeDao.AnalyzeOption & {
    /**
     * 图表配置
     */
    chartConfig: AnalyzeConfigVo.ChartConfigResponse | null
    analyzePermission?: PermissionVo.AnalyzePermissionType
  }

  type AnalyzeListItem = Pick<
    AnalyzeDao.AnalyzeOption,
    'id' | 'analyzeName' | 'analyzeDesc' | 'viewCount' | 'createTime' | 'updateTime' | 'createdBy' | 'updatedBy'
  > & {
    analyzePermission?: PermissionVo.AnalyzePermissionType
  }

  type AnalyzeListResponse = {
    list: AnalyzeListItem[]
    total: number
    page: number
    pageSize: number
    keyword: string
    sortField: AnalyzeDao.AnalyzeListSortField
    sortOrder: AnalyzeDao.AnalyzeListSortOrder
  }
}
