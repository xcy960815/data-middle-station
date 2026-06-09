import { AnalyzeConfigMapper } from '@/server/mapper/analyzeConfigMapper'
import { BaseService } from '@/server/service/baseService'

/**
 * @desc 分析配置服务，负责分析配置的 CRUD 业务编排。
 */
export class AnalyzeConfigService extends BaseService {
  private analyzeConfigMapper: AnalyzeConfigMapper

  constructor() {
    super()
    this.analyzeConfigMapper = new AnalyzeConfigMapper()
  }

  /**
   * 将 DAO 记录转换为 VO 响应结构，同步展示名。
   * @param {AnalyzeConfigDao.AnalyzeConfigRecord} configRecord 数据库配置记录。
   * @returns {AnalyzeConfigVo.AnalyzeConfigResponse} 前端可用的分析配置响应。
   */
  private convertDaoToVo(configRecord: AnalyzeConfigDao.AnalyzeConfigRecord): AnalyzeConfigVo.AnalyzeConfigResponse {
    const normalizedData = this.normalizeConfigRecord(configRecord)
    return {
      ...normalizedData,
      measures: normalizedData.measures.map((item: AnalyzeConfigDao.MeasureOption) => ({
        ...item,
        displayName: item.displayName || item.columnComment
      })),
      filters: normalizedData.filters.map((item: AnalyzeConfigDao.FilterOption) => ({
        ...item,
        displayName: item.displayName || item.columnComment
      })),
      dimensions: normalizedData.dimensions.map((item: AnalyzeConfigDao.DimensionOption) => ({
        ...item,
        displayName: item.displayName || item.columnComment
      })),
      orders: normalizedData.orders.map((item: AnalyzeConfigDao.OrderOption) => ({
        ...item,
        displayName: item.displayName || item.columnComment
      }))
    }
  }

  /**
   * 根据查询条件获取单条分析配置。
   * @param {AnalyzeConfigDto.GetAnalyzeConfigRequest} queryRequest 查询参数（按 id 或 analyzeId）。
   * @returns {Promise<AnalyzeConfigVo.AnalyzeConfigResponse>} 分析配置响应。
   */
  public async getAnalyzeConfig(
    queryRequest: AnalyzeConfigDto.GetAnalyzeConfigRequest
  ): Promise<AnalyzeConfigVo.AnalyzeConfigResponse> {
    const configRecord = await this.analyzeConfigMapper.getAnalyzeConfig(queryRequest)
    if (!configRecord) {
      throw new Error('分析配置不存在')
    }
    return this.convertDaoToVo(configRecord)
  }

  /**
   * 获取指定分析的全部历史配置版本。
   * @param {number} analyzeId 分析 ID。
   * @returns {Promise<AnalyzeConfigVo.AnalyzeConfigResponse[]>} 配置版本列表。
   */
  public async getAnalyzeConfigHistory(analyzeId: number): Promise<AnalyzeConfigVo.AnalyzeConfigResponse[]> {
    const configs = await this.analyzeConfigMapper.getAnalyzeConfigHistory(analyzeId)
    return configs.map((config) => this.convertDaoToVo(config))
  }

  /**
   * 创建新的分析配置版本，数据直接透传入库，不做任何迁移。
   * @param {AnalyzeConfigDto.CreateAnalyzeConfigRequest} createRequest 创建请求参数。
   * @returns {Promise<AnalyzeConfigVo.AnalyzeConfigResponse>} 新建的配置响应。
   */
  public async createAnalyzeConfigVersion(
    createRequest: AnalyzeConfigDto.CreateAnalyzeConfigRequest
  ): Promise<AnalyzeConfigVo.AnalyzeConfigResponse> {
    const { createdBy, createTime, updateTime } = await this.getDefaultInfo()
    const versionNo = await this.analyzeConfigMapper.getNextVersionNo(createRequest.analyzeId)
    const createParams: AnalyzeConfigDao.CreateAnalyzeConfigParams = {
      ...createRequest,
      versionNo,
      measures: createRequest.measures || [],
      filters: createRequest.filters || [],
      dimensions: createRequest.dimensions || [],
      orders: createRequest.orders || [],
      createdBy,
      createTime,
      updateTime
    }
    const configId = await this.analyzeConfigMapper.createAnalyzeConfig(createParams)
    return this.getAnalyzeConfig({ id: configId })
  }

  /**
   * 软删除指定分析的全部配置版本。
   * @param {AnalyzeConfigDto.DeleteAnalyzeConfigsRequest} deleteRequest 删除请求参数。
   * @returns {Promise<boolean>} 是否删除成功。
   */
  public async deleteAnalyzeConfigs(deleteRequest: AnalyzeConfigDto.DeleteAnalyzeConfigsRequest): Promise<boolean> {
    const { updatedBy, updateTime } = await this.getDefaultInfo()
    return await this.analyzeConfigMapper.deleteAnalyzeConfigs({
      analyzeId: deleteRequest.analyzeId,
      updatedBy,
      updateTime
    })
  }

  /**
   * 将配置记录中的可选数组字段兜底为空数组，避免下游空指针。
   * @param {AnalyzeConfigDao.AnalyzeConfigRecord} configRecord 原始数据库记录。
   * @returns {AnalyzeConfigDao.AnalyzeConfigRecord} 数组字段已兜底的记录。
   */
  private normalizeConfigRecord(
    configRecord: AnalyzeConfigDao.AnalyzeConfigRecord
  ): AnalyzeConfigDao.AnalyzeConfigRecord {
    return {
      ...configRecord,
      measures: configRecord.measures || [],
      filters: configRecord.filters || [],
      dimensions: configRecord.dimensions || [],
      orders: configRecord.orders || []
    }
  }
}
