import { AnalyseMapper } from '../mapper/analyseMapper'
import { ChartConfigService } from './chartConfigService'
import dayjs from 'dayjs'

const logger = new Logger({
  fileName: 'analyseService',
  folderName: 'analyseService',
})
/**
 * @desc 分析服务
 */
export class AnalyseService {
  private analyseMapper: AnalyseMapper

  // private chartConfigMapper: ChartConfigMapper
  private chartConfigService: ChartConfigService

  constructor() {
    this.analyseMapper = new AnalyseMapper()
    this.chartConfigService = new ChartConfigService()
  }

  /**
   * @desc 格式化图表
   * @param chart {AnalyseDao.AnalyseOption} 图表
   * @returns {AnalyseVo.AnalyseOption}
   */
  private dao2Vo(
    chart: AnalyseDao.AnalyseOption,
    chartConfig: ChartConfigVo.ChartConfig | null
  ): AnalyseVo.AnalyseOption {
    return {
      ...chart,
      chartConfig: chartConfig,
    }
  }

  /**
   * @desc 获取图表
   * @param id {number} 图表id
   * @returns {Promise<AnalyseVo.ChartsOption>}
   */
  public async getAnalyse(id: number): Promise<AnalyseVo.AnalyseOption> {
    const AnalyseOption = await this.analyseMapper.getAnalyse(id)
    if (!AnalyseOption) {
      throw new Error('图表不存在')
    } else if (AnalyseOption.chartConfigId) {
      // throw new Error('图表配置不存在')
      logger.info(`获取图表配置: ${AnalyseOption.chartConfigId}`)
      const chartConfig = await this.chartConfigService.getChartConfig(AnalyseOption.chartConfigId)
      return this.dao2Vo(AnalyseOption, chartConfig)
    } else {
      return this.dao2Vo(AnalyseOption, null)
    }
  }

  /**
   * @desc 获取所有图表
   * @returns {Promise<AnalyseVo.ChartsOption[]>}
   */
  public async getAnalyses(): Promise<AnalyseVo.AnalyseOption[]> {
    const chart = await this.analyseMapper.getCharts()
    return chart.map(item => this.dao2Vo(item, null))
  }

  /**
   * @desc 保存图表
   * @param chart {AnalyseDto.AnalyseOption} 图表
   * @returns {Promise<boolean>}
   */
  public async updateAnalyse(AnalyseOptionDto: AnalyseDto.AnalyseOption): Promise<boolean> {
    const { chartConfig, ...AnalyseOption } = AnalyseOptionDto
    let chartConfigId = AnalyseOption.chartConfigId

    if (!chartConfigId) {
      // 如果图表配置不存在，则创建默认图表配置
      chartConfigId = await this.chartConfigService.createChartConfig({
        chartType: chartConfig?.chartType || '',
        dataSource: chartConfig?.dataSource || '',
        column: chartConfig?.column,
        dimension: chartConfig?.dimension,
        filter: chartConfig?.filter,
        group: chartConfig?.group,
        order: chartConfig?.order,
        limit: chartConfig?.limit,
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
        limit: chartConfig?.limit,
      })
    }

    const updateChartResult = await this.analyseMapper.updateAnalyse({
      id: AnalyseOption.id,
      analyseName: AnalyseOption.analyseName,
      chartConfigId,
      analyseDesc: AnalyseOption.analyseDesc,
      viewCount: 0,
      createTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      updateTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      createdBy: 'system',
      updatedBy: 'system',
    })

    return updateChartResult
  }

  /**
   * @desc 创建图表
   * @param chart {AnalyseDto.AnalyseOption} 图表
   * @returns {Promise<boolean>}
   */
  public async createAnalyse(analyseOptionDto: AnalyseDto.AnalyseOption): Promise<boolean> {
    const currentTime = dayjs().format('YYYY-MM-DD HH:mm:ss')
    let chartConfigId = analyseOptionDto.chartConfigId || null
    if (analyseOptionDto.chartConfig) {
      // 如果图表配置不存在，则创建默认图表配置
      chartConfigId = await this.chartConfigService.createChartConfig({
        dataSource: analyseOptionDto.chartConfig?.dataSource || '',
        column: analyseOptionDto.chartConfig?.column,
        dimension: analyseOptionDto.chartConfig?.dimension,
        filter: analyseOptionDto.chartConfig?.filter,
        group: analyseOptionDto.chartConfig?.group,
        order: analyseOptionDto.chartConfig?.order,
      })
    }
    const analyseOption: AnalyseDto.AnalyseOption = {
      analyseName: analyseOptionDto.analyseName,
      chartConfigId: chartConfigId,
      analyseDesc: analyseOptionDto.analyseDesc,
      viewCount: 0,
      createTime: currentTime,
      updateTime: currentTime,
      createdBy: 'system',
      updatedBy: 'system',
    }

    return this.analyseMapper.createAnalyse(analyseOption)
  }

  /**
   * @desc 更新图表名称
   * @param AnalyseOption {AnalyseDto.AnalyseOption} 图表
   * @returns {Promise<boolean>}
   */
  public async updateAnalyseName(AnalyseOption: AnalyseDto.AnalyseOption): Promise<boolean> {
    return this.analyseMapper.updateAnalyse(AnalyseOption)
  }

  /**
   * @desc 更新图表描述
   * @param AnalyseOption {AnalyseDto.AnalyseOption} 图表
   * @returns {Promise<boolean>}
   */
  public async updateAnalyseDesc(AnalyseOption: AnalyseDto.AnalyseOption): Promise<boolean> {
    return this.analyseMapper.updateAnalyse(AnalyseOption)
  }
}
