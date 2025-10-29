/**
 * 前端传入的图表配置
 */
declare namespace AnalyseDto {
  /**
   * 创建分析请求参数
   */
  type CreateAnalyseRequest = AnalyseVo.AnalyseResponse
  /**
   * 获取分析请求参数
   */
  type GetAnalyseRequest = {
    id: AnalyseVo.AnalyseResponse['id']
    updatedBy?: AnalyseVo.AnalyseResponse['updatedBy']
    updateTime?: AnalyseVo.AnalyseResponse['updateTime']
    createdBy?: AnalyseVo.AnalyseResponse['createdBy']
    createTime?: AnalyseVo.AnalyseResponse['createTime']
    analyseName?: AnalyseVo.AnalyseResponse['analyseName']
    analyseDesc?: AnalyseVo.AnalyseResponse['analyseDesc']
  }
  /**
   * 更新分析请求参数
   */
  type UpdateAnalyseRequest = AnalyseVo.AnalyseResponse
  /**
   * 更新分析名称请求参数
   */
  type UpdateAnalyseNameRequest = {
    id: AnalyseVo.AnalyseResponse['id']
    analyseName: AnalyseVo.AnalyseResponse['analyseName']
    updatedBy: AnalyseVo.AnalyseResponse['updatedBy']
    updateTime: AnalyseVo.AnalyseResponse['updateTime']
  }
  /**
   * 更新分析描述请求参数
   */
  type UpdateAnalyseDescRequest = {
    id: AnalyseVo.AnalyseResponse['id']
    analyseDesc: AnalyseVo.AnalyseResponse['analyseDesc']
    updatedBy: AnalyseVo.AnalyseResponse['updatedBy']
    updateTime: AnalyseVo.AnalyseResponse['updateTime']
  }
  /**
   * 删除分析请求参数
   */
  type DeleteAnalyseRequest = {
    id: AnalyseVo.AnalyseResponse['id']
    updatedBy?: AnalyseVo.AnalyseResponse['updatedBy']
    updateTime?: AnalyseVo.AnalyseResponse['updateTime']
  }
}
