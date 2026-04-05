/**
 * @desc  分析表结构
 */
declare namespace AnalyzeDao {
  type AnalyzeListSortField = 'analyzeName' | 'createTime' | 'updateTime' | 'viewCount'

  type AnalyzeListSortOrder = 'asc' | 'desc'

  /**
   * 分析配置
   */
  type AnalyzeOption = {
    /**
     * 分析id
     */
    id: number
    /**
     * 分析名称
     */
    analyzeName: string
    /**
     * 分析描述
     */
    analyzeDesc: string
    /**
     * 分析浏览量
     */
    viewCount: number
    /**
     * 分析创建时间
     */
    createTime: string
    /**
     * 分析更新时间
     */
    updateTime: string
    /**
     * 分析创建人
     */
    createdBy: string
    /**
     * 分析更新人
     */
    updatedBy: string
    /**
     * 分析配置id
     */
    chartConfigId: number | null
    /**
     * 是否删除：0-未删除，1-已删除
     */
    isDeleted: number | null
  }
  /**
   * 获取分析请求参数
   */
  type GetAnalyzeOptions = Partial<AnalyzeOption> & {
    id: number
  }

  /**
   * 获取分析列表请求参数
   */
  type GetAnalyzeListOptions = {
    page: number
    pageSize: number
    keyword?: string
    sortField: AnalyzeListSortField
    sortOrder: AnalyzeListSortOrder
  }
  /**
   * 创建分析请求参数
   */
  type CreateAnalyzeOptions = Pick<
    AnalyzeOption,
    'analyzeName' | 'analyzeDesc' | 'createdBy' | 'updatedBy' | 'createTime' | 'updateTime'
  > & {
    chartConfigId?: number | null
  }

  /**
   * 更新分析请求参数
   */
  type UpdateAnalyzeOptions = Pick<AnalyzeOption, 'id' | 'updatedBy' | 'updateTime'> &
    Partial<Pick<AnalyzeOption, 'analyzeName' | 'analyzeDesc' | 'chartConfigId'>>

  /**
   * 更新分析描述请求参数
   */
  type UpdateAnalyzeDescOptions = Pick<AnalyzeOption, 'id' | 'analyzeDesc' | 'updatedBy' | 'updateTime'>
  /**
   * 更新分析名称请求参数
   */
  type UpdateAnalyzeNameOptions = Pick<AnalyzeOption, 'id' | 'analyzeName' | 'updatedBy' | 'updateTime'>
  /**
   * 删除分析请求参数
   */
  type DeleteAnalyzeOptions = Pick<AnalyzeOption, 'id' | 'updatedBy' | 'updateTime'>
}
