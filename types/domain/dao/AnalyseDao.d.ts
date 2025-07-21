/**
 * @desc  分析表结构
 */
declare namespace AnalyseDao {
  /**
   * 分析数据
   */
  type ChartData = Array<{
    [key: string]: string | number
  }>

  /**
   * 分析配置
   */
  type AnalyseOption = {
    /**
     * 分析id
     */
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
  }
}
