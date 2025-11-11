/**
 * 前端传入的图表配置
 */
declare namespace AnalyzeDto {
  /**
   * 创建分析请求参数
   */
  type CreateAnalyzeRequest = AnalyzeVo.GetAnalyzeResponse
  /**
   * 获取分析请求参数
   */
  type GetAnalyzeRequest = {
    /**
     * 分析id
     */
    id: AnalyzeVo.GetAnalyzeResponse['id']
    /**
     * 更新人
     */
    updatedBy?: AnalyzeVo.GetAnalyzeResponse['updatedBy']
    /**
     * 更新时间
     */
    updateTime?: AnalyzeVo.GetAnalyzeResponse['updateTime']
    /**
     * 创建人
     */
    createdBy?: AnalyzeVo.GetAnalyzeResponse['createdBy']
    /**
     * 创建时间
     */
    createTime?: AnalyzeVo.GetAnalyzeResponse['createTime']
    /**
     * 分析名称
     */
    analyzeName?: AnalyzeVo.GetAnalyzeResponse['analyzeName']
    /**
     * 分析描述
     */
    analyzeDesc?: AnalyzeVo.GetAnalyzeResponse['analyzeDesc']
  }
  /**
   * 更新分析请求参数
   */
  type UpdateAnalyzeRequest = AnalyzeVo.GetAnalyzeResponse
  /**
   * 更新分析名称请求参数
   */
  type UpdateAnalyzeNameRequest = {
    id: AnalyzeVo.GetAnalyzeResponse['id']
    analyzeName: AnalyzeVo.GetAnalyzeResponse['analyzeName']
    updatedBy: AnalyzeVo.GetAnalyzeResponse['updatedBy']
    updateTime: AnalyzeVo.GetAnalyzeResponse['updateTime']
  }
  /**
   * 更新分析描述请求参数
   */
  type UpdateAnalyzeDescRequest = {
    id: AnalyzeVo.GetAnalyzeResponse['id']
    analyzeDesc: AnalyzeVo.GetAnalyzeResponse['analyzeDesc']
    updatedBy: AnalyzeVo.GetAnalyzeResponse['updatedBy']
    updateTime: AnalyzeVo.GetAnalyzeResponse['updateTime']
  }
  /**
   * 删除分析请求参数
   */
  type DeleteAnalyzeRequest = {
    id: AnalyzeVo.GetAnalyzeResponse['id']
    updatedBy?: AnalyzeVo.GetAnalyzeResponse['updatedBy']
    updateTime?: AnalyzeVo.GetAnalyzeResponse['updateTime']
  }
}
