import { ChartMapper } from '../mapper/chartMapper'
import { ChartConfigService } from './chartConfigService'
import { ChartConfigMapper } from '../mapper/chartConfigMapper'
import dayjs from 'dayjs'

const logger = new Logger({
  fileName: 'chartService',
  folderName: 'chartService'
})
/**
 * @desc 分析服务
 */
export class ChartService {
  private chartMapper: ChartMapper

  // private chartConfigMapper: ChartConfigMapper
  private chartConfigService: ChartConfigService

  constructor() {
    this.chartMapper = new ChartMapper()
    this.chartConfigService = new ChartConfigService()
  }

  /**
   * @desc 格式化图表
   * @param chart {ChartDao.ChartOption} 图表
   * @returns {ChartVo.ChartOption}
   */
  private formatChart(
    chart: ChartDao.ChartOption
  ): ChartVo.ChartOption {
    const chartConfig = chart.chartConfig || {
      dataSource: null,
      column: [],
      dimension: [],
      filter: [],
      group: [],
      order: []
    }

    return {
      ...chart,
      chartConfigId: chart.chartConfigId || null,
      createTime: dayjs(chart.createTime).format(
        'YYYY-MM-DD HH:mm:ss'
      ),
      updateTime: dayjs(chart.updateTime).format(
        'YYYY-MM-DD HH:mm:ss'
      ),
      chartConfig: {
        dataSource: chartConfig.dataSource || null,

        column: Array.isArray(chartConfig.column)
          ? chartConfig.column.map((col) => ({
              columnName:
                typeof col.columnName === 'function'
                  ? col.columnName('')
                  : col.columnName,
              columnType:
                typeof col.columnType === 'function'
                  ? col.columnType('')
                  : col.columnType,
              columnComment: col.columnComment,
              alias:
                typeof col.columnName === 'function'
                  ? col.columnName('')
                  : col.columnName,
              displayName:
                typeof col.columnName === 'function'
                  ? col.columnName('')
                  : col.columnName
            }))
          : [],
        dimension: Array.isArray(chartConfig.dimension)
          ? chartConfig.dimension.map((dim) => ({
              columnName:
                typeof dim.columnName === 'function'
                  ? dim.columnName('')
                  : dim.columnName,
              columnType:
                typeof dim.columnType === 'function'
                  ? dim.columnType('')
                  : dim.columnType,
              columnComment: dim.columnComment,
              alias:
                typeof dim.columnName === 'function'
                  ? dim.columnName('')
                  : dim.columnName,
              displayName:
                typeof dim.columnName === 'function'
                  ? dim.columnName('')
                  : dim.columnName,
              __invalid: dim.__invalid
            }))
          : [],
        filter: Array.isArray(chartConfig.filter)
          ? chartConfig.filter.map((fil) => ({
              columnName:
                typeof fil.columnName === 'function'
                  ? fil.columnName('')
                  : fil.columnName,
              columnType:
                typeof fil.columnType === 'function'
                  ? fil.columnType('')
                  : fil.columnType,
              columnComment: fil.columnComment,
              alias:
                typeof fil.columnName === 'function'
                  ? fil.columnName('')
                  : fil.columnName,
              displayName:
                typeof fil.columnName === 'function'
                  ? fil.columnName('')
                  : fil.columnName,
              filterType: fil.filterType,
              filterValue: fil.filterValue,
              aggregationType: fil.aggregationType
            }))
          : [],
        group: Array.isArray(chartConfig.group)
          ? chartConfig.group.map((grp) => ({
              columnName:
                typeof grp.columnName === 'function'
                  ? grp.columnName('')
                  : grp.columnName,
              columnType:
                typeof grp.columnType === 'function'
                  ? grp.columnType('')
                  : grp.columnType,
              columnComment: grp.columnComment,
              alias:
                typeof grp.columnName === 'function'
                  ? grp.columnName('')
                  : grp.columnName,
              displayName:
                typeof grp.columnName === 'function'
                  ? grp.columnName('')
                  : grp.columnName,
              __invalid: grp.__invalid
            }))
          : [],
        order: Array.isArray(chartConfig.order)
          ? chartConfig.order.map((ord) => ({
              columnName:
                typeof ord.columnName === 'function'
                  ? ord.columnName('')
                  : ord.columnName,
              columnType:
                typeof ord.columnType === 'function'
                  ? ord.columnType('')
                  : ord.columnType,
              columnComment: ord.columnComment,
              alias:
                typeof ord.columnName === 'function'
                  ? ord.columnName('')
                  : ord.columnName,
              displayName:
                typeof ord.columnName === 'function'
                  ? ord.columnName('')
                  : ord.columnName,
              orderType: ord.orderType,
              aggregationType: ord.aggregationType
            }))
          : []
      }
    }
  }

  /**
   * @desc 获取图表
   * @param id {number} 图表id
   * @returns {Promise<ChartVo.ChartsOption>}
   */
  public async getChart(
    id: number
  ): Promise<ChartVo.ChartOption> {
    const chartOption = await this.chartMapper.getChart(id)
    if (!chartOption) {
      throw new Error('图表不存在')
    } else if (chartOption.chartConfigId) {
      // throw new Error('图表配置不存在')
      logger.info(
        `获取图表配置: ${chartOption.chartConfigId}`
      )
      const chartConfig =
        await this.chartConfigService.getChartConfig(
          chartOption.chartConfigId
        )
      return this.formatChart({
        ...chartOption,
        chartConfig
      })
    } else {
      return this.formatChart(chartOption)
    }
  }

  /**
   * @desc 获取所有图表
   * @returns {Promise<ChartVo.ChartsOption[]>}
   */
  public async getCharts(): Promise<ChartVo.ChartOption[]> {
    const chart = await this.chartMapper.getCharts()
    return chart.map(this.formatChart)
  }

  /**
   * @desc 保存图表
   * @param chart {ChartDto.ChartOption} 图表
   * @returns {Promise<boolean>}
   */
  public async updateChart(
    chartOptionDto: ChartDto.ChartOption
  ): Promise<boolean> {
    const { chartConfig, ...chartOption } = chartOptionDto

    let chartConfigId = chartOption.chartConfigId

    if (!chartConfigId) {
      // 如果图表配置不存在，则创建默认图表配置
      chartConfigId =
        await this.chartConfigService.createChartConfig({
          dataSource: chartConfig?.dataSource,
          column: chartConfig?.column,
          dimension: chartConfig?.dimension,
          filter: chartConfig?.filter,
          group: chartConfig?.group,
          order: chartConfig?.order
        })
    } else {
      const updateChartResult =
        await this.chartConfigService.updateChartConfig({
          id: chartConfigId,
          dataSource: chartConfig?.dataSource,
          column: chartConfig?.column,
          dimension: chartConfig?.dimension,
          filter: chartConfig?.filter,
          group: chartConfig?.group,
          order: chartConfig?.order
        })
    }

    const updateChartConfigResult =
      await this.chartMapper.updateChart({
        id: chartOption.id,
        chartName: chartOption.chartName,
        chartType: chartOption.chartType,
        chartConfigId,
        chartDesc: chartOption.chartDesc,
        chartConfig: undefined,
        viewCount: 0,
        createTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        updateTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        createdBy: 'system',
        updatedBy: 'system'
      })

    return updateChartConfigResult
  }

  /**
   * @desc 创建图表
   * @param chart {ChartDto.ChartOption} 图表
   * @returns {Promise<boolean>}
   */
  public async createChart(
    chartsOptionDto: ChartDto.ChartOption
  ): Promise<boolean> {
    const currentTime = dayjs().format(
      'YYYY-MM-DD HH:mm:ss'
    )
    let chartConfigId =
      chartsOptionDto.chartConfigId || null
    if (chartsOptionDto.chartConfig) {
      // 如果图表配置不存在，则创建默认图表配置
      chartConfigId =
        await this.chartConfigService.createChartConfig({
          dataSource:
            chartsOptionDto.chartConfig?.dataSource,
          column: chartsOptionDto.chartConfig?.column,
          dimension: chartsOptionDto.chartConfig?.dimension,
          filter: chartsOptionDto.chartConfig?.filter,
          group: chartsOptionDto.chartConfig?.group,
          order: chartsOptionDto.chartConfig?.order
        })
    }
    const chartOption: ChartDto.ChartOption = {
      chartName: chartsOptionDto.chartName,
      chartType: chartsOptionDto.chartType,
      chartConfigId: chartConfigId,
      chartDesc: chartsOptionDto.chartDesc,
      viewCount: 0,
      createTime: currentTime,
      updateTime: currentTime,
      createdBy: 'system',
      updatedBy: 'system'
    }

    return this.chartMapper.createChart(chartOption)
  }

  /**
   * @desc 更新图表名称
   * @param chartOption {ChartDto.ChartOption} 图表
   * @returns {Promise<boolean>}
   */
  public async updateChartName(
    chartOption: ChartDto.ChartOption
  ): Promise<boolean> {
    return this.chartMapper.updateChart(chartOption)
  }

  /**
   * @desc 更新图表描述
   * @param chartOption {ChartDto.ChartOption} 图表
   * @returns {Promise<boolean>}
   */
  public async updateChartDesc(
    chartOption: ChartDto.ChartOption
  ): Promise<boolean> {
    return this.chartMapper.updateChart(chartOption)
  }
}
