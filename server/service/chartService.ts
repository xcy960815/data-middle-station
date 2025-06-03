import { ChartMapper } from '../mapper/chartMapper'
import { ChartConfigService } from './chartConfigService'
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
  private dao2Vo(
    chart: ChartDao.ChartOption,
    chartConfig: ChartConfigVo.ChartConfig | null
  ): ChartVo.ChartOption {
    return {
      ...chart,
      chartConfig: chartConfig
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
      return this.dao2Vo(chartOption, chartConfig)
    } else {
      return this.dao2Vo(chartOption, null)
    }
  }

  /**
   * @desc 获取所有图表
   * @returns {Promise<ChartVo.ChartsOption[]>}
   */
  public async getCharts(): Promise<ChartVo.ChartOption[]> {
    const chart = await this.chartMapper.getCharts()
    return chart.map((item) => this.dao2Vo(item, null))
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
          chartType: chartConfig?.chartType || '',
          dataSource: chartConfig?.dataSource || '',
          column: chartConfig?.column,
          dimension: chartConfig?.dimension,
          filter: chartConfig?.filter,
          group: chartConfig?.group,
          order: chartConfig?.order,
          limit: chartConfig?.limit
        })
    } else {
      await this.chartConfigService.updateChartConfig({
        id: chartConfigId,
        chartType: chartConfig?.chartType || '',
        dataSource: chartConfig?.dataSource || '',
        column: chartConfig?.column,
        dimension: chartConfig?.dimension,
        filter: chartConfig?.filter,
        group: chartConfig?.group,
        order: chartConfig?.order,
        limit: chartConfig?.limit
      })
    }

    const updateChartResult =
      await this.chartMapper.updateChart({
        id: chartOption.id,
        chartName: chartOption.chartName,
        // chartType: chartOption.chartType,
        chartConfigId,
        chartDesc: chartOption.chartDesc,
        viewCount: 0,
        createTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        updateTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        createdBy: 'system',
        updatedBy: 'system'
      })

    return updateChartResult
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
            chartsOptionDto.chartConfig?.dataSource || '',
          column: chartsOptionDto.chartConfig?.column,
          dimension: chartsOptionDto.chartConfig?.dimension,
          filter: chartsOptionDto.chartConfig?.filter,
          group: chartsOptionDto.chartConfig?.group,
          order: chartsOptionDto.chartConfig?.order
        })
    }
    const chartOption: ChartDto.ChartOption = {
      chartName: chartsOptionDto.chartName,
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
