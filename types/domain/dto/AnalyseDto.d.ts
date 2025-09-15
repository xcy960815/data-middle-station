/**
 * 前端传入的图表配置
 */
declare namespace AnalyseDto {
  /**
   * 获取分析请求参数
   */
  type CreateAnalyseRequest = AnalyseVo.AnalyseOption
  /**
   * 获取分析请求参数
   */
  type GetAnalyseRequest = {
    id: number
  }
  /**
   * 更新分析请求参数
   */
  type UpdateAnalyseRequest = AnalyseVo.AnalyseOption
  /**
   * 更新分析名称请求参数
   */
  type UpdateAnalyseNameRequest = {
    id: AnalyseVo.AnalyseOption['id']
    analyseName: AnalyseVo.AnalyseOption['analyseName']
    updatedBy: AnalyseVo.AnalyseOption['updatedBy']
    updateTime: AnalyseVo.AnalyseOption['updateTime']
  }
  /**
   * 更新分析描述请求参数
   */
  type UpdateAnalyseDescRequest = {
    id: AnalyseVo.AnalyseOption['id']
    analyseDesc: AnalyseVo.AnalyseOption['analyseDesc']
    updatedBy: AnalyseVo.AnalyseOption['updatedBy']
    updateTime: AnalyseVo.AnalyseOption['updateTime']
  }
  /**
   * 删除分析请求参数
   */
  type DeleteAnalyseRequest = {
    id: AnalyseVo.AnalyseOption['id']
    updatedBy?: AnalyseVo.AnalyseOption['updatedBy']
    updateTime?: AnalyseVo.AnalyseOption['updateTime']
  }
}
