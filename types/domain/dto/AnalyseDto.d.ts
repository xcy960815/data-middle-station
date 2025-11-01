/**
 * 前端传入的图表配置
 */
declare namespace AnalyseDto {
  /**
   * 创建分析请求参数
   */
  type CreateAnalyseRequest = AnalyseVo.GetAnalyseResponse
  /**
   * 获取分析请求参数
   */
  type GetAnalyseRequest = {
    /**
     * 分析id
     */
    id: AnalyseVo.GetAnalyseResponse['id']
    /**
     * 更新人
     */
    updatedBy?: AnalyseVo.GetAnalyseResponse['updatedBy']
    /**
     * 更新时间
     */
    updateTime?: AnalyseVo.GetAnalyseResponse['updateTime']
    /**
     * 创建人
     */
    createdBy?: AnalyseVo.GetAnalyseResponse['createdBy']
    /**
     * 创建时间
     */
    createTime?: AnalyseVo.GetAnalyseResponse['createTime']
    /**
     * 分析名称
     */
    analyseName?: AnalyseVo.GetAnalyseResponse['analyseName']
    /**
     * 分析描述
     */
    analyseDesc?: AnalyseVo.GetAnalyseResponse['analyseDesc']
  }
  /**
   * 更新分析请求参数
   */
  type UpdateAnalyseRequest = AnalyseVo.GetAnalyseResponse
  /**
   * 更新分析名称请求参数
   */
  type UpdateAnalyseNameRequest = {
    id: AnalyseVo.GetAnalyseResponse['id']
    analyseName: AnalyseVo.GetAnalyseResponse['analyseName']
    updatedBy: AnalyseVo.GetAnalyseResponse['updatedBy']
    updateTime: AnalyseVo.GetAnalyseResponse['updateTime']
  }
  /**
   * 更新分析描述请求参数
   */
  type UpdateAnalyseDescRequest = {
    id: AnalyseVo.GetAnalyseResponse['id']
    analyseDesc: AnalyseVo.GetAnalyseResponse['analyseDesc']
    updatedBy: AnalyseVo.GetAnalyseResponse['updatedBy']
    updateTime: AnalyseVo.GetAnalyseResponse['updateTime']
  }
  /**
   * 删除分析请求参数
   */
  type DeleteAnalyseRequest = {
    id: AnalyseVo.GetAnalyseResponse['id']
    updatedBy?: AnalyseVo.GetAnalyseResponse['updatedBy']
    updateTime?: AnalyseVo.GetAnalyseResponse['updateTime']
  }
}
