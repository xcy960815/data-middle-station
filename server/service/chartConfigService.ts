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
   * @returns {AnalyzeConfigVo.ChartConfigOptions} 图表配置
   */
  private convertDaoToVo(chartConfigDao: AnalyzeConfigDao.ChartConfigOptions): AnalyzeConfigVo.ChartConfigOptions {
    const normalizedDao = this.convertDaoToDto(chartConfigDao)
    return {
      ...normalizedDao,
      /**
       * 列配置
       */
      columns: normalizedDao.columns.map((item: AnalyzeConfigDao.ColumnOptions) => ({
        ...item,
        displayName: item.displayName || item.columnComment
      })),
      /**
       * 维度配置
       */
      dimensions: normalizedDao.dimensions.map((item: AnalyzeConfigDao.DimensionOption) => ({
        ...item,
        displayName: item.displayName || item.columnComment
      })),
      /**
       * 过滤配置
       */
      filters: normalizedDao.filters.map((item: AnalyzeConfigDao.FilterOption) => ({
        ...item,
        displayName: item.displayName || item.columnComment
      })),
      /**
       * 分组配置
       */
      groups: normalizedDao.groups.map((item: AnalyzeConfigDao.GroupOption) => ({
        ...item,
        displayName: item.displayName || item.columnComment
      })),
      /**
       * 排序配置
       */
      orders: normalizedDao.orders.map((item: AnalyzeConfigDao.OrderOption) => ({
        ...item,
        displayName: item.displayName || item.columnComment
      }))
    }
  }

  /**
   * @desc 获取图表
   * @param {AnalyzeConfigDto.GetChartConfigOptions} chartConfigOptions 图表配置请求参数
   * @returns {Promise<AnalyzeConfigVo.ChartConfigResponse>}
   */
  public async getChartConfig(chartConfigOptions: AnalyzeConfigDto.GetChartConfigOptions): Promise<AnalyzeConfigVo.ChartConfigOptions> {
    const chartConfigDao = await this.chartConfigMapper.getChartConfig(chartConfigOptions)
    return this.convertDaoToVo(chartConfigDao)
  }

  /**
   * @desc 更新图表配置
   * @param {AnalyzeConfigDto.UpdateChartConfigOptions} chartConfigOptions 图表配置
   * @returns {Promise<boolean>}
   */
  public async updateChartConfig(chartConfigOptions: AnalyzeConfigDto.UpdateChartConfigOptions): Promise<boolean> {
    const { updatedBy, updateTime } = await this.getDefaultInfo()
    const enrichedChartConfigOption = {
      ...chartConfigOptions,
      updatedBy,
      updateTime
    }
    const updateChartResult = await this.chartConfigMapper.updateChartConfig(enrichedChartConfigOption)
    return updateChartResult
  }

  /**
   * @desc 创建图表配置
   * @param {AnalyzeConfigDto.CreateChartConfigOptions} chartConfigOptions 图表配置
   * @returns {Promise<number>}
   */
  public async createChartConfig(chartConfigOptions: AnalyzeConfigDto.CreateChartConfigOptions): Promise<number> {
    const { createdBy, createTime, updateTime, updatedBy } = await this.getDefaultInfo()
    const enrichedChartConfigOption = {
      ...chartConfigOptions,
      createdBy,
      createTime,
      updateTime,
      updatedBy
    }
    const chartConfigId = await this.chartConfigMapper.createChartConfig(enrichedChartConfigOption)
    return chartConfigId
  }

  /**
   * @desc 删除图表配置
   * @param {AnalyzeConfigDto.DeleteChartConfigOptions} deleteChartConfigOptions 图表配置删除请求参数
   * @returns {Promise<boolean>}
   */
  public async deleteChartConfig(deleteChartConfigOptions: AnalyzeConfigDto.DeleteChartConfigOptions): Promise<boolean> {
    const deleteParams: AnalyzeConfigDao.DeleteChartConfigOption = {
      id: deleteChartConfigOptions.id,
      updatedBy: deleteChartConfigOptions.updatedBy,
      updateTime: deleteChartConfigOptions.updateTime
    }
    return await this.chartConfigMapper.deleteChartConfig(deleteParams)
  }

  /**
   * @desc DAO -> DTO
   */
  private convertDaoToDto(chartConfigDao: AnalyzeConfigDao.ChartConfigOptions): AnalyzeConfigDao.ChartConfigOptions {
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
  private convertDtoToDao(
    chartConfigDto: AnalyzeConfigDto.UpdateChartConfigOptions &
      Pick<AnalyzeConfigDao.UpdateChartConfigOptions, 'updatedBy' | 'updateTime'>
  ): AnalyzeConfigDao.UpdateChartConfigOptions {
    return {
      ...chartConfigDto,
      updatedBy: chartConfigDto.updatedBy,
      updateTime: chartConfigDto.updateTime,
      columns: chartConfigDto.columns || [],
      dimensions: chartConfigDto.dimensions || [],
      filters: chartConfigDto.filters || [],
      groups: chartConfigDto.groups || [],
      orders: chartConfigDto.orders || [],
      commonChartConfig: chartConfigDto.commonChartConfig,
      privateChartConfig: chartConfigDto.privateChartConfig
    }
  }
}
