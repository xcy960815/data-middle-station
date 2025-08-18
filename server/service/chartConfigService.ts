import dayjs from 'dayjs'
import { ChartConfigMapper } from '../mapper/chartConfigMapper'

/**
 * @desc 分析服务
 */
export class ChartConfigService {
  private chartConfigMapper: ChartConfigMapper

  constructor() {
    this.chartConfigMapper = new ChartConfigMapper()
  }
  /**
   * @desc 获取默认信息
   * @returns {Promise<{createdBy: string, updatedBy: string, createTime: string, updateTime: string}>}
   */
  private async getDefaultInfo() {
    const createdBy = (await RedisStorage.getItem<string>(`userName`)) || 'system'
    const updatedBy = (await RedisStorage.getItem<string>(`userName`)) || 'system'
    const createTime = dayjs().format('YYYY-MM-DD HH:mm:ss')
    const updateTime = dayjs().format('YYYY-MM-DD HH:mm:ss')
    return { createdBy, updatedBy, createTime, updateTime }
  }
  /**
   * @desc 将dao对象转换为vo对象
   * @param chartConfigOption {ChartConfigDao.ChartConfig} 图表配置
   * @returns {ChartConfigVo.ChartConfig} 图表配置
   */
  private dao2Vo(chartConfigOption: ChartConfigDao.ChartConfig): ChartConfigVo.ChartConfig {
    return {
      ...chartConfigOption,
      commonChartConfig: chartConfigOption.commonChartConfig,
      privateChartConfig: chartConfigOption.privateChartConfig,
      /**
       * 列配置
       */
      column: chartConfigOption.column.map((item) => ({
        columnName: item.columnName,
        columnType: item.columnType,
        columnComment: item.columnComment,
        displayName: item.displayName || item.columnComment
      })),
      /**
       * 维度配置
       */
      dimension: chartConfigOption.dimension.map((item) => ({
        ...item,
        columnName: item.columnName,
        columnType: item.columnType,
        columnComment: item.columnComment,
        displayName: item.displayName || item.columnComment
      })),
      /**
       * 过滤配置
       */
      filter: chartConfigOption.filter.map((item) => ({
        ...item,
        columnName: item.columnName,
        columnType: item.columnType,
        columnComment: item.columnComment,
        displayName: item.columnComment
      })),
      /**
       * 分组配置
       */
      group: chartConfigOption.group.map((item) => ({
        ...item,
        columnName: item.columnName,
        columnType: item.columnType,
        columnComment: item.columnComment,
        displayName: item.displayName || item.columnComment
      })),
      /**
       * 排序配置
       */
      order: chartConfigOption.order.map((item) => ({
        ...item,
        columnName: item.columnName,
        columnType: item.columnType,
        columnComment: item.columnComment,
        displayName: item.columnComment
      }))
    }
  }

  /**
   * @desc 将vo对象转换为dao对象
   * @param chartConfigOption {ChartConfigDto.ChartConfig} 图表配置
   * @returns {ChartConfigDao.ChartConfig} 图表配置
   */
  private vo2Dao(chartConfigOption: ChartConfigDto.ChartConfig): ChartConfigDao.ChartConfig {
    return {
      ...chartConfigOption
    }
  }

  /**
   * @desc 获取图表
   * @param id {number} 图表id
   * @returns {Promise<ChartConfigVo.ChartConfig>}
   */
  public async getChartConfig(id: number): Promise<ChartConfigVo.ChartConfig> {
    const chartConfigOption = await this.chartConfigMapper.getChartConfig(id)
    return this.dao2Vo(chartConfigOption)
  }

  /**
   * @desc 保存图表配置
   * @param chartConfig {ChartConfigDto.ChartConfig} 图表配置
   * @returns {Promise<boolean>}
   */
  public async updateChartConfig(chartConfigDto: ChartConfigDto.ChartConfig): Promise<boolean> {
    const { updatedBy, updateTime } = await this.getDefaultInfo()
    chartConfigDto.updatedBy = updatedBy
    chartConfigDto.updateTime = updateTime
    const updateChartResult = await this.chartConfigMapper.updateChartConfig(this.vo2Dao(chartConfigDto))
    return updateChartResult
  }

  /**
   * @desc 创建图表配置
   * @param chartConfigDto {ChartConfigDto.ChartConfig} 图表配置
   * @returns {Promise<number>}
   */
  public async createChartConfig(chartConfigDto: ChartConfigDto.ChartConfig): Promise<number> {
    const { createdBy, createTime, updateTime, updatedBy } = await this.getDefaultInfo()
    chartConfigDto.createdBy = createdBy
    chartConfigDto.createTime = createTime
    chartConfigDto.updateTime = updateTime
    chartConfigDto.updatedBy = updatedBy
    const chartConfigId = await this.chartConfigMapper.createChartConfig(this.vo2Dao(chartConfigDto))
    return chartConfigId
  }

  /**
   * @desc 删除图表配置
   * @param id {number} 图表配置id
   * @returns {Promise<boolean>}
   */
  public async deleteChartConfig(id: number): Promise<boolean> {
    const { updatedBy, updateTime } = await this.getDefaultInfo()
    const deleteParams = {
      id,
      updatedBy,
      updateTime
    }
    return await this.chartConfigMapper.deleteChartConfig(deleteParams)
  }
}
