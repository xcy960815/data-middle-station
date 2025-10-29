import { AnalyseMapper } from '../mapper/analyseMapper'
import { BaseService } from './baseService'
import { ChartConfigService } from './chartConfigService'

/**
 * @desc 分析服务
 */
export class AnalyseService extends BaseService {
  /**
   * 图表mapper
   */
  private analyseMapper: AnalyseMapper

  /**
   * 图表配置服务
   */
  private chartConfigService: ChartConfigService

  constructor() {
    super()
    this.analyseMapper = new AnalyseMapper()
    this.chartConfigService = new ChartConfigService()
  }

  /**
   * @desc dao 转 vo
   * @param chart {AnalyseDao.AnalyseOption} 图表
   * @returns {AnalyseVo.AnalyseResponse}
   */
  private dao2Vo(
    chart: AnalyseDao.AnalyseOption,
    chartConfig: ChartConfigVo.ChartConfigResponse | null
  ): AnalyseVo.AnalyseResponse {
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
    const analyseOption = await this.getAnalyse(id)
    if (analyseOption.chartConfigId) {
      const deleteChartConfigRequest: ChartConfigDto.DeleteChartConfigRequest = {
        id: analyseOption.chartConfigId,
        updatedBy: analyseOption.updatedBy,
        updateTime: analyseOption.updateTime
      }
      // 删除图表配置
      await this.chartConfigService.deleteChartConfig(deleteChartConfigRequest)
    }
    const { updatedBy, updateTime } = await super.getDefaultInfo()
    const deleteParams: AnalyseDto.DeleteAnalyseRequest = {
      id,
      updatedBy,
      updateTime
    }
    return this.analyseMapper.deleteAnalyse(deleteParams)
  }
  /**
   * @desc 获取分析
   * @param id {number} 分析id
   * @returns {Promise<AnalyseVo.AnalyseResponse>}
   */
  public async getAnalyse(analyseParams: AnalyseDto.GetAnalyseRequest): Promise<AnalyseVo.AnalyseResponse> {
    const analyseOption = await this.analyseMapper.getAnalyse(analyseParams)
    if (!analyseOption) {
      throw new Error('图表不存在')
    } else if (analyseOption.chartConfigId) {
      const chartConfig = await this.chartConfigService.getChartConfig(analyseOption.chartConfigId)
      return this.dao2Vo(analyseOption, chartConfig)
    } else {
      return this.dao2Vo(analyseOption, null)
    }
  }

  /**
   * @desc 获取所有图表
   * @returns {Promise<AnalyseVo.ChartsOption[]>}
   */
  public async getAnalyses(): Promise<AnalyseVo.AnalyseResponse[]> {
    const analyseOptions = await this.analyseMapper.getAnalyses()
    const promises = analyseOptions.map(async (item) => {
      if (item.chartConfigId) {
        const chartConfig = await this.chartConfigService.getChartConfig(item.chartConfigId)
        return this.dao2Vo(item, chartConfig)
      } else {
        return this.dao2Vo(item, null)
      }
    })
    return Promise.all(promises)
  }

  /**
   * @desc 保存图表
   * @param chart {AnalyseDto.AnalyseOption} 图表
   * @returns {Promise<boolean>}
   */
  public async updateAnalyse(analyseOptionDto: AnalyseDto.UpdateAnalyseRequest): Promise<boolean> {
    // 解构图表配置，剩余的为图表配置
    const { chartConfig, ...analyseOption } = analyseOptionDto
    let chartConfigId = analyseOption.chartConfigId
    if (chartConfig) {
      if (!chartConfigId) {
        // 如果图表配置不存在，则创建默认图表配置
        chartConfigId = await this.chartConfigService.createChartConfig(chartConfig)
      } else {
        // 如果图表配置存在，则更新图表配置
        await this.chartConfigService.updateChartConfig({
          ...chartConfig,
          id: chartConfigId
        })
      }
    }
    // 更新图表
    const { updatedBy, updateTime } = await super.getDefaultInfo()
    analyseOption.updateTime = updateTime
    analyseOption.updatedBy = updatedBy
    analyseOption.chartConfigId = chartConfigId
    const updateAnalyseResult = await this.analyseMapper.updateAnalyse(analyseOption)

    return updateAnalyseResult
  }

  /**
   * @desc 创建图表
   * @param analyseOptionDto {AnalyseDto.AnalyseOption} 图表
   * @returns {Promise<boolean>}
   */
  public async createAnalyse(analyseOptionDto: AnalyseDto.CreateAnalyseRequest): Promise<boolean> {
    const { chartConfig, ...restOption } = analyseOptionDto
    const { createdBy, updatedBy, createTime, updateTime } = await this.getDefaultInfo()
    let chartConfigId = analyseOptionDto.chartConfigId || null
    if (chartConfig) {
      // 如果图表配置不存在，则创建默认图表配置
      chartConfigId = await this.chartConfigService.createChartConfig(chartConfig)
    }
    restOption.chartConfigId = chartConfigId
    restOption.createdBy = createdBy
    restOption.updatedBy = updatedBy
    restOption.createTime = createTime
    restOption.updateTime = updateTime
    const createAnalyseResult = await this.analyseMapper.createAnalyse(restOption)
    return createAnalyseResult
  }

  /**
   * @desc 更新图表名称
   * @param analyseOption {AnalyseDto.AnalyseOption} 图表
   * @returns {Promise<boolean>}
   */
  public async updateAnalyseName(analyseOption: AnalyseDto.UpdateAnalyseNameRequest): Promise<boolean> {
    const { updatedBy, updateTime } = await this.getDefaultInfo()
    analyseOption.updatedBy = updatedBy
    analyseOption.updateTime = updateTime
    return this.analyseMapper.updateAnalyse(analyseOption)
  }

  /**
   * @desc 更新图表描述
   * @param analyseOption {AnalyseDto.UpdateAnalyseDescRequest} 图表
   * @returns {Promise<boolean>}
   */
  public async updateAnalyseDesc(analyseOption: AnalyseDto.UpdateAnalyseDescRequest): Promise<boolean> {
    const { updatedBy, updateTime } = await this.getDefaultInfo()
    analyseOption.updatedBy = updatedBy
    analyseOption.updateTime = updateTime
    return this.analyseMapper.updateAnalyse(analyseOption)
  }
}
