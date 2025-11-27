/**
 * @desc  分析表结构
 */
declare namespace AnalyzeDao {
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
  type GetAnalyzeOptions = Partial<Pick<AnalyzeOption, 'id' | 'analyzeName' | 'analyzeDesc' | 'updatedBy' | 'updateTime' | 'createdBy'>> & {
    id: number
  }
  /**
   * 创建分析请求参数
   */
  type CreateAnalyzeOptions = Omit<AnalyzeOption, 'id' | 'isDeleted'>

  /**
   * 更新分析请求参数
   */
  type UpdateAnalyzeOptions = Omit<AnalyzeOption, 'isDeleted' | 'createTime' | 'createdBy'>

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
