import { AnalyzeConfigMapper } from '@/server/mapper/analyzeConfigMapper'
import { BaseService } from '@/server/service/baseService'

export class AnalyzeConfigService extends BaseService {
  private analyzeConfigMapper: AnalyzeConfigMapper

  constructor() {
    super()
    this.analyzeConfigMapper = new AnalyzeConfigMapper()
  }

  private convertDaoToVo(configRecord: AnalyzeConfigDao.AnalyzeConfigRecord): AnalyzeConfigVo.AnalyzeConfigResponse {
    const normalizedData = this.normalizeConfigRecord(configRecord)
    return {
      ...normalizedData,
      columns: normalizedData.columns.map((item: AnalyzeConfigDao.ColumnItem) => ({
        ...item,
        displayName: item.displayName || item.columnComment
      })),
      dimensions: normalizedData.dimensions.map((item: AnalyzeConfigDao.DimensionOption) => ({
        ...item,
        displayName: item.displayName || item.columnComment
      })),
      filters: normalizedData.filters.map((item: AnalyzeConfigDao.FilterOption) => ({
        ...item,
        displayName: item.displayName || item.columnComment
      })),
      groups: normalizedData.groups.map((item: AnalyzeConfigDao.GroupOption) => ({
        ...item,
        displayName: item.displayName || item.columnComment
      })),
      orders: normalizedData.orders.map((item: AnalyzeConfigDao.OrderOption) => ({
        ...item,
        displayName: item.displayName || item.columnComment
      }))
    }
  }

  public async getAnalyzeConfig(
    queryRequest: AnalyzeConfigDto.GetAnalyzeConfigRequest
  ): Promise<AnalyzeConfigVo.AnalyzeConfigResponse> {
    const configRecord = await this.analyzeConfigMapper.getAnalyzeConfig(queryRequest)
    if (!configRecord) {
      throw new Error('分析配置不存在')
    }
    return this.convertDaoToVo(configRecord)
  }

  public async getAnalyzeConfigHistory(analyzeId: number): Promise<AnalyzeConfigVo.AnalyzeConfigResponse[]> {
    const configs = await this.analyzeConfigMapper.getAnalyzeConfigHistory(analyzeId)
    return configs.map((config) => this.convertDaoToVo(config))
  }

  public async createAnalyzeConfigVersion(
    createRequest: AnalyzeConfigDto.CreateAnalyzeConfigRequest
  ): Promise<AnalyzeConfigVo.AnalyzeConfigResponse> {
    const { createdBy, createTime, updateTime } = await this.getDefaultInfo()
    const versionNo = await this.analyzeConfigMapper.getNextVersionNo(createRequest.analyzeId)
    const createParams: AnalyzeConfigDao.CreateAnalyzeConfigParams = {
      ...createRequest,
      versionNo,
      columns: createRequest.columns || [],
      dimensions: createRequest.dimensions || [],
      filters: createRequest.filters || [],
      groups: createRequest.groups || [],
      orders: createRequest.orders || [],
      commonChartConfig: createRequest.commonChartConfig,
      privateChartConfig: createRequest.privateChartConfig,
      createdBy,
      createTime,
      updateTime
    }
    const configId = await this.analyzeConfigMapper.createAnalyzeConfig(createParams)
    return this.getAnalyzeConfig({ id: configId })
  }

  public async deleteAnalyzeConfigs(deleteRequest: AnalyzeConfigDto.DeleteAnalyzeConfigsRequest): Promise<boolean> {
    const { updatedBy, updateTime } = await this.getDefaultInfo()
    return await this.analyzeConfigMapper.deleteAnalyzeConfigs({
      analyzeId: deleteRequest.analyzeId,
      updatedBy,
      updateTime
    })
  }

  private normalizeConfigRecord(
    configRecord: AnalyzeConfigDao.AnalyzeConfigRecord
  ): AnalyzeConfigDao.AnalyzeConfigRecord {
    return {
      ...configRecord,
      columns: configRecord.columns || [],
      dimensions: configRecord.dimensions || [],
      filters: configRecord.filters || [],
      groups: configRecord.groups || [],
      orders: configRecord.orders || []
    }
  }
}
