import { ChartConfigMapper } from '@/server/mapper/chartConfigMapper'
import { BaseService } from '@/server/service/baseService'

/**
 * @desc 分析服务
 */
export class ChartConfigService extends BaseService {
  private chartConfigMapper: ChartConfigMapper

  constructor() {
    super()
    this.chartConfigMapper = new ChartConfigMapper()
  }
  /**
   * @desc 将dao对象转换为vo对象
   * @param chartConfigRecord {AnalyzeConfigDao.ChartConfigRecord} 图表配置
   * @returns {AnalyzeConfigVo.ChartConfigResponse} 图表配置
   */
  private convertDaoToVo(chartConfigRecord: AnalyzeConfigDao.ChartConfigRecord): AnalyzeConfigVo.ChartConfigResponse {
    const normalizedData = this.convertDaoToDto(chartConfigRecord)
    return {
      ...normalizedData,
      /**
       * 列配置
       */
      columns: normalizedData.columns.map((item: AnalyzeConfigDao.ColumnItem) => ({
        ...item,
        displayName: item.displayName || item.columnComment
      })),
      /**
       * 维度配置
       */
      dimensions: normalizedData.dimensions.map((item: AnalyzeConfigDao.DimensionOption) => ({
        ...item,
        displayName: item.displayName || item.columnComment
      })),
      /**
       * 过滤配置
       */
      filters: normalizedData.filters.map((item: AnalyzeConfigDao.FilterOption) => ({
        ...item,
        displayName: item.displayName || item.columnComment
      })),
      /**
       * 分组配置
       */
      groups: normalizedData.groups.map((item: AnalyzeConfigDao.GroupOption) => ({
        ...item,
        displayName: item.displayName || item.columnComment
      })),
      /**
       * 排序配置
       */
      orders: normalizedData.orders.map((item: AnalyzeConfigDao.OrderOption) => ({
        ...item,
        displayName: item.displayName || item.columnComment
      }))
    }
  }

  /**
   * @desc 获取图表
   * @param {AnalyzeConfigDto.GetChartConfigRequest} queryRequest 图表配置请求参数
   * @returns {Promise<AnalyzeConfigVo.ChartConfigResponse>}
   */
  public async getChartConfig(
    queryRequest: AnalyzeConfigDto.GetChartConfigRequest
  ): Promise<AnalyzeConfigVo.ChartConfigResponse> {
    const chartConfigRecord = await this.chartConfigMapper.getChartConfig(queryRequest)
    return this.convertDaoToVo(chartConfigRecord)
  }

  /**
   * @desc 更新图表配置
   * @param {AnalyzeConfigDto.UpdateChartConfigRequest} updateRequest 图表配置
   * @returns {Promise<boolean>}
   */
  public async updateChartConfig(updateRequest: AnalyzeConfigDto.UpdateChartConfigRequest): Promise<boolean> {
    const { updatedBy, updateTime } = await this.getDefaultInfo()
    const updateParams = {
      ...updateRequest,
      updatedBy,
      updateTime
    }
    const updateChartResult = await this.chartConfigMapper.updateChartConfig(updateParams)
    return updateChartResult
  }

  /**
   * @desc 创建图表配置
   * @param {AnalyzeConfigDto.CreateChartConfigRequest} createRequest 图表配置
   * @returns {Promise<AnalyzeConfigVo.ChartConfigResponse>}
   */
  public async createChartConfig(
    createRequest: AnalyzeConfigDto.CreateChartConfigRequest
  ): Promise<AnalyzeConfigVo.ChartConfigResponse> {
    const { createdBy, createTime, updateTime, updatedBy } = await this.getDefaultInfo()
    const createParams = {
      ...createRequest,
      createdBy,
      createTime,
      updateTime,
      updatedBy
    }
    const chartConfigId = await this.chartConfigMapper.createChartConfig(createParams)
    return this.getChartConfig({ id: chartConfigId })
  }

  /**
   * @desc 删除图表配置
   * @param {AnalyzeConfigDto.DeleteChartConfigRequest} deleteRequest 图表配置删除请求参数
   * @returns {Promise<boolean>}
   */
  public async deleteChartConfig(deleteRequest: AnalyzeConfigDto.DeleteChartConfigRequest): Promise<boolean> {
    const { updatedBy, updateTime } = await this.getDefaultInfo()
    const deleteParams: AnalyzeConfigDao.DeleteChartConfigParams = {
      id: deleteRequest.id,
      updatedBy,
      updateTime
    }
    return await this.chartConfigMapper.deleteChartConfig(deleteParams)
  }

  /**
   * @desc DAO -> DTO
   */
  private convertDaoToDto(chartConfigRecord: AnalyzeConfigDao.ChartConfigRecord): AnalyzeConfigDao.ChartConfigRecord {
    return {
      ...chartConfigRecord,
      columns: chartConfigRecord.columns || [],
      dimensions: chartConfigRecord.dimensions || [],
      filters: chartConfigRecord.filters || [],
      groups: chartConfigRecord.groups || [],
      orders: chartConfigRecord.orders || []
    }
  }

  /**
   * @desc DTO -> DAO
   */
  private convertDtoToDao(
    chartConfigData: AnalyzeConfigDto.UpdateChartConfigRequest &
      Pick<AnalyzeConfigDao.UpdateChartConfigParams, 'updatedBy' | 'updateTime'>
  ): AnalyzeConfigDao.UpdateChartConfigParams {
    return {
      ...chartConfigData,
      updatedBy: chartConfigData.updatedBy,
      updateTime: chartConfigData.updateTime,
      columns: chartConfigData.columns || [],
      dimensions: chartConfigData.dimensions || [],
      filters: chartConfigData.filters || [],
      groups: chartConfigData.groups || [],
      orders: chartConfigData.orders || [],
      commonChartConfig: chartConfigData.commonChartConfig,
      privateChartConfig: chartConfigData.privateChartConfig
    }
  }
}
