/**
 * @desc  图表表结构
 */
declare namespace AnalyseDao {
  /**
   * 图表数据
   */
  type ChartDataDao = Array<{
    [key: string]: string | number
  }>

  /**
   * 图表配置
   */
  type AnalyseOption = {
    /**
     * 图表id
     */
    id: number
    /**
     * 图表名称
     */
    analyseName: string
    /**
     * 图表描述
     */
    analyseDesc: string
    /**
     * 图表浏览量
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
  }
}
