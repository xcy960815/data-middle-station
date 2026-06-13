import { AnalyzeConfigMapper } from '@/server/mapper/analyzeConfigMapper'
import { BaseService } from '@/server/service/baseService'

/**
 * @class AnalyzeConfigService
 * @extends BaseService
 * @description 分析配置服务类，负责数据分析配置的创建、获取、删除及历史版本管理等业务逻辑的编排。
 */
export class AnalyzeConfigService extends BaseService {
  /**
   * 分析配置数据访问映射器
   * @private
   * @type {AnalyzeConfigMapper}
   */
  private analyzeConfigMapper: AnalyzeConfigMapper

  /**
   * 构造函数，初始化分析配置映射器
   */
  constructor() {
    super()
    this.analyzeConfigMapper = new AnalyzeConfigMapper()
  }

  /**
   * 将数据库配置记录 (DAO) 转换为业务返回对象 (VO)，如果展示名为空则使用原始列备注兜底。
   * @private
   * @param {AnalyzeConfigDao.AnalyzeConfigRecord} configRecord 数据库原始配置记录
   * @returns {AnalyzeConfigVo.AnalyzeConfigResponse} 规范化并处理好展示名后的分析配置响应对象
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
   * 根据查询请求参数获取单条分析配置详情
   * @public
   * @param {AnalyzeConfigDto.GetAnalyzeConfigRequest} queryRequest 查询参数对象，可包含 id 或 analyzeId
   * @throws {Error} 分析配置记录不存在时抛出异常
   * @returns {Promise<AnalyzeConfigVo.AnalyzeConfigResponse>} 分析配置的业务视图对象
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
   * 获取指定分析看板的所有历史配置版本列表
   * @public
   * @param {number} analyzeId 分析看板 ID
   * @returns {Promise<AnalyzeConfigVo.AnalyzeConfigResponse[]>} 历史配置版本列表
   */
  public async getAnalyzeConfigHistory(analyzeId: number): Promise<AnalyzeConfigVo.AnalyzeConfigResponse[]> {
    const configs = await this.analyzeConfigMapper.getAnalyzeConfigHistory(analyzeId)
    return configs.map((config) => this.convertDaoToVo(config))
  }

  /**
   * 创建新的分析配置版本。新版配置的版本号将自动递增。
   * @public
   * @param {AnalyzeConfigDto.CreateAnalyzeConfigRequest} createRequest 创建分析配置的请求参数对象
   * @returns {Promise<AnalyzeConfigVo.AnalyzeConfigResponse>} 新创建的分析配置响应对象
   */
  public async createAnalyzeConfigVersion(
    createRequest: AnalyzeConfigDto.CreateAnalyzeConfigRequest
  ): Promise<AnalyzeConfigVo.AnalyzeConfigResponse> {
    const { createdBy, createTime, updateTime } = await this.getDefaultInfo()
    const versionNo = await this.analyzeConfigMapper.getNextVersionNo(createRequest.analyzeId)
    const createParams: AnalyzeConfigDao.CreateAnalyzeConfigParams = {
      ...createRequest,
      versionNo,
      datasetId: createRequest.datasetId ?? null,
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
   * 软删除指定分析看板下的所有配置版本
   * @public
   * @param {AnalyzeConfigDto.DeleteAnalyzeConfigsRequest} deleteRequest 删除配置请求参数对象，包含 analyzeId
   * @returns {Promise<boolean>} 是否软删除成功
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
   * 规范化配置记录，确保 measures、filters、dimensions 和 orders 数组字段不为 null 或 undefined。
   * @private
   * @param {AnalyzeConfigDao.AnalyzeConfigRecord} configRecord 原始配置记录
   * @returns {AnalyzeConfigDao.AnalyzeConfigRecord} 字段已做防空/兜底处理的配置记录
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
