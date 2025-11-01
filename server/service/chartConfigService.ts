import { ChartConfigMapper } from '../mapper/chartConfigMapper'
import { BaseService } from './baseService'

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
   * @param chartConfigOption {ChartConfigDao.ChartConfig} 图表配置
   * @returns {ChartConfigVo.ChartConfig} 图表配置
   */
  private dao2Vo(chartConfigOption: ChartConfigDao.ChartConfig): ChartConfigVo.ChartConfigResponse {
    return {
      ...chartConfigOption,
      commonChartConfig: chartConfigOption.commonChartConfig,
      privateChartConfig: chartConfigOption.privateChartConfig,
      /**
       * 列配置
       */
      columns: chartConfigOption.columns.map((item) => ({
        ...item,
        displayName: item.displayName || item.columnComment
      })),
      /**
       * 维度配置
       */
      dimensions: chartConfigOption.dimensions.map((item) => ({
        ...item,
        displayName: item.displayName || item.columnComment
      })),
      /**
       * 过滤配置
       */
      filters: chartConfigOption.filters.map((item) => ({
        ...item,
        displayName: item.displayName || item.columnComment
      })),
      /**
       * 分组配置
       */
      groups: chartConfigOption.groups.map((item) => ({
        ...item,
        displayName: item.displayName || item.columnComment
      })),
      /**
       * 排序配置
       */
      orders: chartConfigOption.orders.map((item) => ({
        ...item,
        displayName: item.displayName || item.columnComment
      }))
    }
  }

  /**
   * @desc 获取图表
   * @param id {number} 图表id
   * @returns {Promise<ChartConfigVo.ChartConfigResponse>}
   */
  public async getChartConfig(id: number): Promise<ChartConfigVo.ChartConfigResponse> {
    const chartConfigOption = await this.chartConfigMapper.getChartConfig(id)
    return this.dao2Vo(chartConfigOption)
  }

  /**
   * @desc 保存图表配置
   * @param chartConfig {ChartConfigDto.ChartConfig} 图表配置
   * @returns {Promise<boolean>}
   */
  public async updateChartConfig(chartConfigRequest: ChartConfigDto.UpdateChartConfigRequest): Promise<boolean> {
    const { updatedBy, updateTime } = await this.getDefaultInfo()
    chartConfigRequest.updatedBy = updatedBy
    chartConfigRequest.updateTime = updateTime
    const updateChartResult = await this.chartConfigMapper.updateChartConfig(chartConfigRequest)
    return updateChartResult
  }

  /**
   * @desc 创建图表配置
   * @param chartConfigDto {ChartConfigDto.CreateChartConfigRequest} 图表配置
   * @returns {Promise<number>}
   */
  public async createChartConfig(chartConfigRequest: ChartConfigDto.CreateChartConfigRequest): Promise<number> {
    const { createdBy, createTime, updateTime, updatedBy } = await this.getDefaultInfo()
    chartConfigRequest.createdBy = createdBy
    chartConfigRequest.createTime = createTime
    chartConfigRequest.updateTime = updateTime
    chartConfigRequest.updatedBy = updatedBy
    chartConfigRequest.isDeleted = 0
    const chartConfigId = await this.chartConfigMapper.createChartConfig(chartConfigRequest)
    return chartConfigId
  }

  /**
   * @desc 删除图表配置
   * @param deleteChartConfigRequest {ChartConfigDto.DeleteChartConfigRequest} 图表配置删除请求参数
   * @returns {Promise<boolean>}
   */
  public async deleteChartConfig(deleteChartConfigRequest: ChartConfigDto.DeleteChartConfigRequest): Promise<boolean> {
    return await this.chartConfigMapper.deleteChartConfig(deleteChartConfigRequest)
  }
}
