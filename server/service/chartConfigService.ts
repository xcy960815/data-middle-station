import { ChartConfigMapper } from '../mapper/chartConfigMapper'
import dayjs from 'dayjs'

const logger = new Logger({
  fileName: 'chartService',
  folderName: 'chartService'
})
/**
 * @desc 分析服务
 */
export class ChartConfigService {
  private chartConfigMapper: ChartConfigMapper

  constructor() {
    this.chartConfigMapper = new ChartConfigMapper()
  }

  /**
   * @desc 将dao对象转换为vo对象
   * @param chartConfigOption {ChartConfigDao.ChartConfig} 图表配置
   * @returns {ChartConfigVo.ChartConfig} 图表配置
   */
  private dao2Vo(
    chartConfigOption: ChartConfigDao.ChartConfig
  ): ChartConfigVo.ChartConfig {
    return {
      ...chartConfigOption,
      column: chartConfigOption.column.map((item) => ({
        columnName:
          typeof item.columnName === 'function'
            ? item.columnName('')
            : item.columnName,
        columnType:
          typeof item.columnType === 'function'
            ? item.columnType('')
            : item.columnType,
        columnComment: item.columnComment,
        alias: item.columnComment,
        displayName: item.columnComment
      })),
      dimension: chartConfigOption.dimension.map(
        (item) => ({
          ...item,
          columnName:
            typeof item.columnName === 'function'
              ? item.columnName('')
              : item.columnName,
          columnType:
            typeof item.columnType === 'function'
              ? item.columnType('')
              : item.columnType,
          columnComment: item.columnComment,
          alias: item.columnComment,
          displayName: item.columnComment
        })
      ),
      filter: chartConfigOption.filter.map((item) => ({
        ...item,
        columnName:
          typeof item.columnName === 'function'
            ? item.columnName('')
            : item.columnName,
        columnType:
          typeof item.columnType === 'function'
            ? item.columnType('')
            : item.columnType,
        columnComment: item.columnComment,
        alias: item.columnComment,
        displayName: item.columnComment
      })),
      group: chartConfigOption.group.map((item) => ({
        ...item,
        columnName:
          typeof item.columnName === 'function'
            ? item.columnName('')
            : item.columnName,
        columnType:
          typeof item.columnType === 'function'
            ? item.columnType('')
            : item.columnType,
        columnComment: item.columnComment,
        alias: item.columnComment,
        displayName: item.columnComment
      })),
      order: chartConfigOption.order.map((item) => ({
        ...item,
        columnName:
          typeof item.columnName === 'function'
            ? item.columnName('')
            : item.columnName,
        columnType:
          typeof item.columnType === 'function'
            ? item.columnType('')
            : item.columnType,
        columnComment: item.columnComment,
        alias: item.columnComment,
        displayName: item.columnComment
      }))
    }
  }

  /**
   * @desc 获取图表
   * @param id {number} 图表id
   * @returns {Promise<ChartConfigVo.ChartConfig>}
   */
  public async getChartConfig(
    id: number
  ): Promise<ChartConfigVo.ChartConfig> {
    const chartConfigOption =
      await this.chartConfigMapper.getChartConfig(id)
    return this.dao2Vo(chartConfigOption)
  }

  /**
   * @desc 保存图表配置
   * @param chartConfig {ChartConfigDto.ChartConfig} 图表配置
   * @returns {Promise<boolean>}
   */
  public async updateChartConfig(
    chartConfigDto: ChartConfigDto.ChartConfig
  ): Promise<boolean> {
    const updateChartResult =
      await this.chartConfigMapper.updateChart({
        id: chartConfigDto.id,
        dataSource: chartConfigDto?.dataSource,
        column: chartConfigDto?.column,
        dimension: chartConfigDto?.dimension,
        filter: chartConfigDto?.filter,
        group: chartConfigDto?.group,
        order: chartConfigDto?.order
      })
    return updateChartResult
  }

  /**
   * @desc 创建图表配置
   * @param chartConfigDto {ChartConfigDto.ChartConfig} 图表配置
   * @returns {Promise<number>}
   */
  public async createChartConfig(
    chartConfigDto: ChartConfigDto.ChartConfig
  ): Promise<number> {
    const currentTime = dayjs().format(
      'YYYY-MM-DD HH:mm:ss'
    )
    const chartConfigId =
      await this.chartConfigMapper.createChartConfig({
        dataSource: chartConfigDto.dataSource,
        column: chartConfigDto.column,
        dimension: chartConfigDto.dimension,
        filter: chartConfigDto.filter,
        group: chartConfigDto.group,
        order: chartConfigDto.order,
        limit: chartConfigDto.limit,
        createTime: currentTime,
        updateTime: currentTime
      })

    return chartConfigId
  }
}
