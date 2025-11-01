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
   * @returns {AnalyseVo.GetAnalyseResponse}
   */
  private dao2Vo(
    chart: AnalyseDao.AnalyseOption,
    chartConfig: ChartConfigVo.ChartConfigResponse | null
  ): AnalyseVo.GetAnalyseResponse {
    return {
      ...chart,
      chartConfig: chartConfig
    }
  }

  /**
   * @desc 删除分析
   * @param deleteAnalyseRequest {AnalyseDto.DeleteAnalyseRequest}
   * @returns {Promise<AnalyseVo.DeleteAnalyseResponse>}
   */
  public async deleteAnalyse(
    deleteAnalyseRequest: AnalyseDto.DeleteAnalyseRequest
  ): Promise<AnalyseVo.DeleteAnalyseResponse> {
    const analyseOption = await this.getAnalyse(deleteAnalyseRequest)
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
      id: deleteAnalyseRequest.id,
      updatedBy,
      updateTime
    }
    const deleteAnalyseResult = await this.analyseMapper.deleteAnalyse(deleteParams)
    return deleteAnalyseResult
  }
  /**
   * @desc 获取分析
   * @param id {number} 分析id
   * @returns {Promise<AnalyseVo.GetAnalyseResponse>}
   */
  public async getAnalyse(analyseParams: AnalyseDto.GetAnalyseRequest): Promise<AnalyseVo.GetAnalyseResponse> {
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
   * @returns {Promise<Array<AnalyseVo.GetAnalyseResponse>>}
   */
  public async getAnalyses(): Promise<Array<AnalyseVo.GetAnalyseResponse>> {
    const analyseOptions = await this.analyseMapper.getAnalyses()
    const promises = analyseOptions.map(async (item) => {
      if (item.chartConfigId) {
        const chartConfig = await this.chartConfigService.getChartConfig(item.chartConfigId)
        return this.dao2Vo(item, chartConfig)
      } else {
        return this.dao2Vo(item, null)
      }
    })
    const getAnalysesResult = await Promise.all(promises)
    return getAnalysesResult
  }

  /**
   * @desc 保存图表
   * @param updateAnalyseRequest {AnalyseDto.UpdateAnalyseRequest} 图表
   * @returns {Promise<AnalyseVo.UpdateAnalyseResponse>}
   */
  public async updateAnalyse(
    updateAnalyseRequest: AnalyseDto.UpdateAnalyseRequest
  ): Promise<AnalyseVo.UpdateAnalyseResponse> {
    // 解构图表配置，剩余的为图表配置
    const { chartConfig, ...restOption } = updateAnalyseRequest
    let chartConfigId = updateAnalyseRequest.chartConfigId
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
    const updateParams = {
      ...restOption,
      updateTime,
      updatedBy,
      chartConfigId
    } as AnalyseDto.UpdateAnalyseRequest
    const updateAnalyseResponse = await this.analyseMapper.updateAnalyse(updateParams)

    return updateAnalyseResponse
  }

  /**
   * @desc 创建图表
   * @param createAnalyseRequest {AnalyseDto.CreateAnalyseRequest} 图表
   * @returns {Promise<AnalyseVo.CreateAnalyseResponse>}
   */
  public async createAnalyse(
    createAnalyseRequest: AnalyseDto.CreateAnalyseRequest
  ): Promise<AnalyseVo.CreateAnalyseResponse> {
    const { chartConfig, ...restOption } = createAnalyseRequest
    const { createdBy, updatedBy, createTime, updateTime } = await this.getDefaultInfo()
    let chartConfigId = createAnalyseRequest.chartConfigId || null
    if (chartConfig) {
      // 如果图表配置不存在，则创建默认图表配置
      chartConfigId = await this.chartConfigService.createChartConfig(chartConfig)
    }
    restOption.chartConfigId = chartConfigId
    restOption.createdBy = createdBy
    restOption.updatedBy = updatedBy
    restOption.createTime = createTime
    restOption.updateTime = updateTime
    const createAnalyseResponse = await this.analyseMapper.createAnalyse(restOption as AnalyseDto.CreateAnalyseRequest)
    return createAnalyseResponse
  }

  /**
   * @desc 更新图表名称
   * @param analyseOption {AnalyseDto.AnalyseOption} 图表
   * @returns {Promise<boolean>}
   */
  public async updateAnalyseName(
    updateAnalyseNameRequest: AnalyseDto.UpdateAnalyseNameRequest
  ): Promise<AnalyseVo.UpdateAnalyseNameResponse> {
    const { updatedBy, updateTime } = await this.getDefaultInfo()
    updateAnalyseNameRequest.updatedBy = updatedBy
    updateAnalyseNameRequest.updateTime = updateTime
    const updateAnalyseNameResponse = await this.analyseMapper.updateAnalyse(
      updateAnalyseNameRequest as AnalyseDto.UpdateAnalyseRequest
    )
    return updateAnalyseNameResponse
  }

  /**
   * @desc 更新图表描述
   * @param updateAnalyseDescRequest {AnalyseDto.UpdateAnalyseDescRequest} 图表
   * @returns {Promise<AnalyseVo.UpdateAnalyseDescResponse>}
   */
  public async updateAnalyseDesc(
    updateAnalyseDescRequest: AnalyseDto.UpdateAnalyseDescRequest
  ): Promise<AnalyseVo.UpdateAnalyseDescResponse> {
    const { updatedBy, updateTime } = await this.getDefaultInfo()
    updateAnalyseDescRequest.updatedBy = updatedBy
    updateAnalyseDescRequest.updateTime = updateTime
    const updateAnalyseDescResponse = await this.analyseMapper.updateAnalyse(
      updateAnalyseDescRequest as AnalyseDto.UpdateAnalyseRequest
    )
    return updateAnalyseDescResponse
  }
}
