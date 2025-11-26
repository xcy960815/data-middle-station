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
   * @param chartConfigOption {AnalyzeConfigDao.ChartConfig} 图表配置
   * @returns {AnalyzeConfigVo.ChartConfig} 图表配置
   */
  private convertDaoToVo(chartConfigDao: AnalyzeConfigDao.ChartConfig): AnalyzeConfigVo.ChartConfigResponse {
    const dtoPayload = this.convertDaoToDto(chartConfigDao)
    return {
      ...dtoPayload,
      /**
       * 列配置
       */
      columns: chartConfigDao.columns.map((item: AnalyzeConfigDao.ColumnOptions) => ({
        ...item,
        displayName: item.displayName || item.columnComment
      })),
      /**
       * 维度配置
       */
      dimensions: chartConfigDao.dimensions.map((item: AnalyzeConfigDao.DimensionOption) => ({
        ...item,
        displayName: item.displayName || item.columnComment
      })),
      /**
       * 过滤配置
       */
      filters: chartConfigDao.filters.map((item: AnalyzeConfigDao.FilterOption) => ({
        ...item,
        displayName: item.displayName || item.columnComment
      })),
      /**
       * 分组配置
       */
      groups: chartConfigDao.groups.map((item: AnalyzeConfigDao.GroupOption) => ({
        ...item,
        displayName: item.displayName || item.columnComment
      })),
      /**
       * 排序配置
       */
      orders: chartConfigDao.orders.map((item: AnalyzeConfigDao.OrderOption) => ({
        ...item,
        displayName: item.displayName || item.columnComment
      }))
    }
  }

  /**
   * @desc 获取图表
   * @param id {number} 图表id
   * @returns {Promise<AnalyzeConfigVo.ChartConfigResponse>}
   */
  public async getChartConfig(chartConfigId: number): Promise<AnalyzeConfigVo.ChartConfigResponse> {
    const chartConfigDao = await this.chartConfigMapper.getChartConfig(chartConfigId)
    return this.convertDaoToVo(chartConfigDao)
  }

  /**
   * @desc 保存图表配置
   * @param chartConfig {AnalyzeConfigDto.ChartConfig} 图表配置
   * @returns {Promise<boolean>}
   */
  public async updateChartConfig(chartConfigDto: AnalyzeConfigDto.UpdateChartConfigRequest): Promise<boolean> {
    const { updatedBy, updateTime } = await this.getDefaultInfo()
    chartConfigDto.updatedBy = updatedBy
    chartConfigDto.updateTime = updateTime
    const daoPayload = this.convertDtoToDao(chartConfigDto)
    const updateChartResult = await this.chartConfigMapper.updateChartConfig(this.convertDaoToDto(daoPayload))
    return updateChartResult
  }

  /**
   * @desc 创建图表配置
   * @param chartConfigDto {AnalyzeConfigDto.CreateChartConfigRequest} 图表配置
   * @returns {Promise<number>}
   */
  public async createChartConfig(chartConfigDto: AnalyzeConfigDto.CreateChartConfigRequest): Promise<number> {
    const { createdBy, createTime, updateTime, updatedBy } = await this.getDefaultInfo()
    chartConfigDto.createdBy = createdBy
    chartConfigDto.createTime = createTime
    chartConfigDto.updateTime = updateTime
    chartConfigDto.updatedBy = updatedBy
    chartConfigDto.isDeleted = 0
    const enrichedChartConfigRequest = {
      id: 0,
      ...chartConfigDto
    } as AnalyzeConfigDto.UpdateChartConfigRequest
    const daoPayload = this.convertDtoToDao(enrichedChartConfigRequest)
    const chartConfigId = await this.chartConfigMapper.createChartConfig(
      this.convertDaoToDto(daoPayload) as AnalyzeConfigDto.CreateChartConfigRequest
    )
    return chartConfigId
  }

  /**
   * @desc 删除图表配置
   * @param deleteChartConfigRequest {AnalyzeConfigDto.DeleteChartConfigRequest} 图表配置删除请求参数
   * @returns {Promise<boolean>}
   */
  public async deleteChartConfig(deleteChartConfigDto: AnalyzeConfigDto.DeleteChartConfigRequest): Promise<boolean> {
    return await this.chartConfigMapper.deleteChartConfig(deleteChartConfigDto)
  }

  /**
   * @desc DAO -> DTO
   */
  private convertDaoToDto(chartConfigDao: AnalyzeConfigDao.ChartConfig): AnalyzeConfigDto.UpdateChartConfigRequest {
    return {
      ...chartConfigDao,
      columns: chartConfigDao.columns || [],
      dimensions: chartConfigDao.dimensions || [],
      filters: chartConfigDao.filters || [],
      groups: chartConfigDao.groups || [],
      orders: chartConfigDao.orders || []
    }
  }

  /**
   * @desc DTO -> DAO
   */
  private convertDtoToDao(chartConfigDto: AnalyzeConfigDto.UpdateChartConfigRequest): AnalyzeConfigDao.ChartConfig {
    return {
      ...chartConfigDto,
      columns: chartConfigDto.columns || [],
      dimensions: chartConfigDto.dimensions || [],
      filters: chartConfigDto.filters || [],
      groups: chartConfigDto.groups || [],
      orders: chartConfigDto.orders || [],
      commonChartConfig: chartConfigDto.commonChartConfig,
      privateChartConfig: chartConfigDto.privateChartConfig,
      isDeleted: Number(chartConfigDto.isDeleted ?? 0)
    }
  }
}
