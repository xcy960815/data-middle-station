import { AnalyseMapper } from '../mapper/analyseMapper'
import { ChartConfigService } from './chartConfigService'
import dayjs from 'dayjs'

const logger = new Logger({
  fileName: 'analyseService',
  folderName: 'analyseService'
})
/**
 * @desc 分析服务
 */
export class AnalyseService {
  /**
   * 图表mapper
   */
  private analyseMapper: AnalyseMapper

  /**
   * 图表配置服务
   */
  private chartConfigService: ChartConfigService

  constructor() {
    this.analyseMapper = new AnalyseMapper()
    this.chartConfigService = new ChartConfigService()
  }

  /**
   * @desc dao 转 vo
   * @param chart {AnalyseDao.AnalyseOption} 图表
   * @returns {AnalyseVo.AnalyseOption}
   */
  private dao2Vo(
    chart: AnalyseDao.AnalyseOption,
    chartConfig: ChartConfigVo.ChartConfig | null
  ): AnalyseVo.AnalyseOption {
    return {
      ...chart,
      chartConfig: chartConfig
    }
  }

  /**
   * @desc 删除分析
   * @param id {number} 分析id
   * @returns {Promise<boolean>}
   */
  public async deleteAnalyse(id: number): Promise<boolean> {
    return this.analyseMapper.deleteAnalyse(id)
  }
  /**
   * @desc 获取分析
   * @param id {number} 分析id
   * @returns {Promise<AnalyseVo.AnalyseOption>}
   */
  public async getAnalyse(id: number): Promise<AnalyseVo.AnalyseOption> {
    const AnalyseOption = await this.analyseMapper.getAnalyse(id)
    if (!AnalyseOption) {
      throw new Error('图表不存在')
    } else if (AnalyseOption.chartConfigId) {
      // throw new Error('图表配置不存在')
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
    const analysesDao = await this.analyseMapper.getAnalyses()
    return analysesDao.map((item) => this.dao2Vo(item, null))
  }

  /**
   * @desc 保存图表
   * @param chart {AnalyseDto.AnalyseOption} 图表
   * @returns {Promise<boolean>}
   */
  public async updateAnalyse(AnalyseOptionDto: AnalyseDto.AnalyseOption): Promise<boolean> {
    // 解构图表配置，剩余的为图表配置
    const { chartConfig, ...AnalyseOption } = AnalyseOptionDto

    let chartConfigId = AnalyseOption.chartConfigId
    if (chartConfig) {
      if (!chartConfigId) {
        // 如果图表配置不存在，则创建默认图表配置
        chartConfigId = await this.chartConfigService.createChartConfig(chartConfig)
      } else {
        // 如果图表配置存在，则更新图表配置
        await this.chartConfigService.updateChartConfig(chartConfig)
      }
    }

    // 更新图表
    const createdBy = await RedisStorage.getItem<string>(`username`)
    const updatedBy = await RedisStorage.getItem<string>(`username`)
    const updateTime = dayjs().format('YYYY-MM-DD HH:mm:ss')
    const updateAnalyseResult = await this.analyseMapper.updateAnalyse({
      id: AnalyseOption.id,
      analyseName: AnalyseOption.analyseName,
      chartConfigId,
      analyseDesc: AnalyseOption.analyseDesc,
      viewCount: 0,
      createTime: AnalyseOption.createTime,
      updateTime: updateTime,
      createdBy: createdBy ?? 'system',
      updatedBy: updatedBy ?? 'system'
    })

    return updateAnalyseResult
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
        dataSource: analyseOptionDto.chartConfig?.dataSource || undefined,
        column: analyseOptionDto.chartConfig?.column,
        dimension: analyseOptionDto.chartConfig?.dimension,
        filter: analyseOptionDto.chartConfig?.filter,
        group: analyseOptionDto.chartConfig?.group,
        order: analyseOptionDto.chartConfig?.order
      })
    }
    const createdBy = await RedisStorage.getItem<string>(`username`)
    const updatedBy = await RedisStorage.getItem<string>(`username`)
    const updateTime = dayjs().format('YYYY-MM-DD HH:mm:ss')
    const analyseOption: AnalyseDto.AnalyseOption = {
      analyseName: analyseOptionDto.analyseName,
      chartConfigId: chartConfigId,
      analyseDesc: analyseOptionDto.analyseDesc,
      viewCount: 0,
      createTime: currentTime,
      updateTime: updateTime,
      createdBy: createdBy || 'system',
      updatedBy: updatedBy || 'system'
    }

    return this.analyseMapper.createAnalyse(analyseOption)
  }

  /**
   * @desc 更新图表名称
   * @param AnalyseOption {AnalyseDto.AnalyseOption} 图表
   * @returns {Promise<boolean>}
   */
  public async updateAnalyseName(AnalyseOption: AnalyseDto.AnalyseOption): Promise<boolean> {
    const updatedBy = await RedisStorage.getItem<string>(`username`)
    AnalyseOption.updatedBy = updatedBy ?? 'system'
    return this.analyseMapper.updateAnalyse(AnalyseOption)
  }

  /**
   * @desc 更新图表描述
   * @param AnalyseOption {AnalyseDto.AnalyseOption} 图表
   * @returns {Promise<boolean>}
   */
  public async updateAnalyseDesc(AnalyseOption: AnalyseDto.AnalyseOption): Promise<boolean> {
    const updatedBy = await RedisStorage.getItem<string>(`username`)
    AnalyseOption.updatedBy = updatedBy ?? 'system'
    AnalyseOption.updateTime = dayjs().format('YYYY-MM-DD HH:mm:ss')
    return this.analyseMapper.updateAnalyse(AnalyseOption)
  }
}
