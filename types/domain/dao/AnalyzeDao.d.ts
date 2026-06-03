/**
 * @desc  分析表结构
 */
declare namespace AnalyzeDao {
  type AnalyzeListSortField = 'analyzeName' | 'createTime' | 'updateTime' | 'viewCount'

  type AnalyzeListSortOrder = 'asc' | 'desc'

  /**
   * 分析配置
   */
  type AnalyzeRecord = {
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
     * 当前生效的分析配置版本 ID
     */
    currentConfigId: number | null
    /**
     * 是否删除：0-未删除，1-已删除
     */
    isDeleted: number | null
  }
  /**
   * 获取分析请求参数
   */
  type GetAnalyzeParams = Partial<AnalyzeRecord> & {
    id: number
  }

  /**
   * 获取分析列表请求参数
   */
  type GetAnalyzeListParams = {
    page: number
    pageSize: number
    keyword?: string
    sortField: AnalyzeListSortField
    sortOrder: AnalyzeListSortOrder
    currentUserName?: string
    roleCodes?: string[]
  }
  /**
   * 创建分析请求参数
   */
  type CreateAnalyzeParams = Pick<
    AnalyzeRecord,
    'analyzeName' | 'analyzeDesc' | 'createdBy' | 'updatedBy' | 'createTime' | 'updateTime'
  > & {
    currentConfigId?: number | null
  }

  /**
   * 更新分析请求参数
   */
  type UpdateAnalyzeParams = Pick<AnalyzeRecord, 'id' | 'updatedBy' | 'updateTime'> &
    Partial<Pick<AnalyzeRecord, 'analyzeName' | 'analyzeDesc' | 'currentConfigId'>>

  /**
   * 更新分析描述请求参数
   */
  type UpdateAnalyzeDescParams = Pick<AnalyzeRecord, 'id' | 'analyzeDesc' | 'updatedBy' | 'updateTime'>
  /**
   * 更新分析名称请求参数
   */
  type UpdateAnalyzeNameParams = Pick<AnalyzeRecord, 'id' | 'analyzeName' | 'updatedBy' | 'updateTime'>
  /**
   * 删除分析请求参数
   */
  type DeleteAnalyzeParams = Pick<AnalyzeRecord, 'id' | 'updatedBy' | 'updateTime'>
}
