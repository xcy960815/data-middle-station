/**
 * 前端传入的图表配置
 */
declare namespace AnalyzeConfigDto {
  type AnalyzeConfigPayload = Omit<
    AnalyzeConfigDao.AnalyzeConfigRecord,
    'id' | 'analyzeId' | 'versionNo' | 'createTime' | 'createdBy' | 'updateTime' | 'isDeleted'
  >

  /**
   * 获取分析配置请求参数
   */
  type GetAnalyzeConfigRequest = {
    id: number
  }

  type GetAnalyzeConfigHistoryRequest = {
    analyzeId: number
  }

  type SwitchAnalyzeConfigVersionRequest = {
    analyzeId: number
    configId: number
  }

  /**
   * 分析配置删除请求参数
   */
  type DeleteAnalyzeConfigsRequest = {
    analyzeId: number
  }

  /**
   * 创建分析配置请求参数
   */
  type CreateAnalyzeConfigRequest = AnalyzeConfigPayload & {
    analyzeId: number
  }
}
