/**
 * @desc  分析响应
 */
declare namespace AnalyzeVo {
  /**
   * 图表数据
   */
  type AnalyzeData = Array<{
    [key: string]: string | number
  }>
  /**
   * 获取分析响应
   */
  type GetAnalyzeOptions = {
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
     * 访问次数
     */
    viewCount: number
    /**
     * 创建时间
     */
    createTime: string
    /**
     * 更新时间
     */
    updateTime: string
    /**
     * 创建人
     */
    createdBy: string
    /**
     * 更新人
     */
    updatedBy: string
    /**
     * 图表配置id
     */
    chartConfigId: number | null
    /**
     * 图表配置
     */
    chartConfig: AnalyzeConfigVo.ChartConfigOptions | null
  }
  /**
   * 更新分析选项
   */
  type UpdateAnalyzeOptions = boolean

  /**
   * 更新分析描述选项
   */
  type UpdateAnalyzeDescOptions = boolean

  /**
   * 更新分析名称选项
   */
  type UpdateAnalyzeNameOptions = boolean

  /**
   * 创建分析选项
   */
  type CreateAnalyzeOptions = boolean

  /**
   * 删除分析选项
   */
  type DeleteAnalyzeOptions = boolean
}
