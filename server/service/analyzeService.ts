import { AnalyzeMapper } from '@/server/mapper/analyzeMapper'
import { BaseService } from '@/server/service/baseService'
import { ChartConfigService } from '@/server/service/chartConfigService'

/**
 * @desc 分析服务
 */
export class AnalyzeService extends BaseService {
  /**
   * 图表mapper
   */
  private analyzeMapper: AnalyzeMapper

  /**
   * 图表配置服务
   */
  private chartConfigService: ChartConfigService

  constructor() {
    super()
    this.analyzeMapper = new AnalyzeMapper()
    this.chartConfigService = new ChartConfigService()
  }

  /**
   * @desc dao 转 vo
   * @param chart {AnalyzeDao.AnalyzeOption} 图表
   * @returns {AnalyzeVo.GetAnalyzeResponse}
   */
  private dao2Vo(
    chart: AnalyzeDao.AnalyzeOption,
    chartConfig: ChartConfigVo.ChartConfigResponse | null
  ): AnalyzeVo.GetAnalyzeResponse {
    return {
      ...chart,
      chartConfig: chartConfig
    }
  }

  /**
   * @desc 删除分析
   * @param deleteAnalyzeRequest {AnalyzeDto.DeleteAnalyzeRequest}
   * @returns {Promise<AnalyzeVo.DeleteAnalyzeResponse>}
   */
  public async deleteAnalyze(
    deleteAnalyzeRequest: AnalyzeDto.DeleteAnalyzeRequest
  ): Promise<AnalyzeVo.DeleteAnalyzeResponse> {
    const analyzeOption = await this.getAnalyze(deleteAnalyzeRequest)
    if (analyzeOption.chartConfigId) {
      const deleteChartConfigRequest: ChartConfigDto.DeleteChartConfigRequest = {
        id: analyzeOption.chartConfigId,
        updatedBy: analyzeOption.updatedBy,
        updateTime: analyzeOption.updateTime
      }
      // 删除图表配置
      await this.chartConfigService.deleteChartConfig(deleteChartConfigRequest)
    }
    const { updatedBy, updateTime } = await super.getDefaultInfo()
    const deleteParams: AnalyzeDto.DeleteAnalyzeRequest = {
      id: deleteAnalyzeRequest.id,
      updatedBy,
      updateTime
    }
    const deleteAnalyzeResult = await this.analyzeMapper.deleteAnalyze(deleteParams)
    return deleteAnalyzeResult
  }
  /**
   * @desc 获取分析
   * @param id {number} 分析id
   * @returns {Promise<AnalyzeVo.GetAnalyzeResponse>}
   */
  public async getAnalyze(analyzeParams: AnalyzeDto.GetAnalyzeRequest): Promise<AnalyzeVo.GetAnalyzeResponse> {
    const analyzeOption = await this.analyzeMapper.getAnalyze(analyzeParams)
    if (!analyzeOption) {
      throw new Error('图表不存在')
    } else if (analyzeOption.chartConfigId) {
      const chartConfig = await this.chartConfigService.getChartConfig(analyzeOption.chartConfigId)
      return this.dao2Vo(analyzeOption, chartConfig)
    } else {
      return this.dao2Vo(analyzeOption, null)
    }
  }

  /**
   * @desc 获取所有图表
   * @returns {Promise<Array<AnalyzeVo.GetAnalyzeResponse>>}
   */
  public async getAnalyzes(): Promise<Array<AnalyzeVo.GetAnalyzeResponse>> {
    const analyzeOptions = await this.analyzeMapper.getAnalyzes()
    const promises = analyzeOptions.map(async (item) => {
      if (item.chartConfigId) {
        const chartConfig = await this.chartConfigService.getChartConfig(item.chartConfigId)
        return this.dao2Vo(item, chartConfig)
      } else {
        return this.dao2Vo(item, null)
      }
    })
    const getAnalyzesResult = await Promise.all(promises)
    return getAnalyzesResult
  }

  /**
   * @desc 保存图表
   * @param updateAnalyzeRequest {AnalyzeDto.UpdateAnalyzeRequest} 图表
   * @returns {Promise<AnalyzeVo.UpdateAnalyzeResponse>}
   */
  public async updateAnalyze(
    updateAnalyzeRequest: AnalyzeDto.UpdateAnalyzeRequest
  ): Promise<AnalyzeVo.UpdateAnalyzeResponse> {
    // 解构图表配置，剩余的为图表配置
    const { chartConfig, ...restOption } = updateAnalyzeRequest
    let chartConfigId = updateAnalyzeRequest.chartConfigId
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
    } as AnalyzeDto.UpdateAnalyzeRequest
    const updateAnalyzeResponse = await this.analyzeMapper.updateAnalyze(updateParams)

    return updateAnalyzeResponse
  }

  /**
   * @desc 创建图表
   * @param createAnalyzeRequest {AnalyzeDto.CreateAnalyzeRequest} 图表
   * @returns {Promise<AnalyzeVo.CreateAnalyzeResponse>}
   */
  public async createAnalyze(
    createAnalyzeRequest: AnalyzeDto.CreateAnalyzeRequest
  ): Promise<AnalyzeVo.CreateAnalyzeResponse> {
    const { chartConfig, ...restOption } = createAnalyzeRequest
    const { createdBy, updatedBy, createTime, updateTime } = await this.getDefaultInfo()
    let chartConfigId = createAnalyzeRequest.chartConfigId || null
    if (chartConfig) {
      // 如果图表配置不存在，则创建默认图表配置
      chartConfigId = await this.chartConfigService.createChartConfig(chartConfig)
    }
    restOption.chartConfigId = chartConfigId
    restOption.createdBy = createdBy
    restOption.updatedBy = updatedBy
    restOption.createTime = createTime
    restOption.updateTime = updateTime
    const createAnalyzeResponse = await this.analyzeMapper.createAnalyze(restOption as AnalyzeDto.CreateAnalyzeRequest)
    return createAnalyzeResponse
  }

  /**
   * @desc 更新图表名称
   * @param analyzeOption {AnalyzeDto.AnalyzeOption} 图表
   * @returns {Promise<boolean>}
   */
  public async updateAnalyzeName(
    updateAnalyzeNameRequest: AnalyzeDto.UpdateAnalyzeNameRequest
  ): Promise<AnalyzeVo.UpdateAnalyzeNameResponse> {
    const { updatedBy, updateTime } = await this.getDefaultInfo()
    updateAnalyzeNameRequest.updatedBy = updatedBy
    updateAnalyzeNameRequest.updateTime = updateTime
    const updateAnalyzeNameResponse = await this.analyzeMapper.updateAnalyze(
      updateAnalyzeNameRequest as AnalyzeDto.UpdateAnalyzeRequest
    )
    return updateAnalyzeNameResponse
  }

  /**
   * @desc 更新图表描述
   * @param updateAnalyzeDescRequest {AnalyzeDto.UpdateAnalyzeDescRequest} 图表
   * @returns {Promise<AnalyzeVo.UpdateAnalyzeDescResponse>}
   */
  public async updateAnalyzeDesc(
    updateAnalyzeDescRequest: AnalyzeDto.UpdateAnalyzeDescRequest
  ): Promise<AnalyzeVo.UpdateAnalyzeDescResponse> {
    const { updatedBy, updateTime } = await this.getDefaultInfo()
    updateAnalyzeDescRequest.updatedBy = updatedBy
    updateAnalyzeDescRequest.updateTime = updateTime
    const updateAnalyzeDescResponse = await this.analyzeMapper.updateAnalyze(
      updateAnalyzeDescRequest as AnalyzeDto.UpdateAnalyzeRequest
    )
    return updateAnalyzeDescResponse
  }
}
