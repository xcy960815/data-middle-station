/**
 * @desc  分析响应
 */
declare namespace AnalyseVo {
  /**
   * 图表数据
   */
  type ChartDataVo = Array<{
    [key: string]: string | number
  }>
  /**
   * 获取分析响应
   */
  type GetAnalyseResponse = {
    id: number
    /**
     * 分析名称
     */
    analyseName: string
    /**
     * 分析描述
     */
    analyseDesc: string
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
    chartConfig: ChartConfigVo.ChartConfigResponse | null
  }
  /**
   * 更新分析响应
   */
  type UpdateAnalyseResponse = boolean

  /**
   * 更新分析描述响应
   */
  type UpdateAnalyseDescResponse = boolean

  /**
   * 更新分析名称响应
   */
  type UpdateAnalyseNameResponse = boolean

  /**
   * 创建分析响应
   */
  type CreateAnalyseResponse = boolean

  /**
   * 删除分析响应
   */
  type DeleteAnalyseResponse = boolean
}
