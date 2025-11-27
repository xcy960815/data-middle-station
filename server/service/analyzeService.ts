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
   * @desc DAO 转 VO
   * @param analyzeDao {AnalyzeDao.AnalyzeOption} 分析记录
   * @param resolvedChartConfig {AnalyzeConfigVo.ChartConfigResponse | null} 关联图表配置
   * @returns {AnalyzeVo.GetAnalyzeResponse}
   */
  private convertDaoToVo(
    analyzeDao: AnalyzeDao.AnalyzeOption,
    resolvedChartConfig: AnalyzeConfigVo.ChartConfigOptions | null
  ): AnalyzeVo.GetAnalyzeOptions {
    return {
      ...analyzeDao,
      chartConfig: resolvedChartConfig
    }
  }
  /**
   * @desc 删除分析
   * @param {AnalyzeDto.DeleteAnalyzeOption} deleteAnalyzeOptions
   * @returns {Promise<AnalyzeVo.DeleteAnalyzeResponse>}
   */
  public async deleteAnalyze(
    deleteAnalyzeOptions: AnalyzeDto.DeleteAnalyzeOption
  ): Promise<AnalyzeVo.DeleteAnalyzeResponse> {
    const getAnalyzeDao: AnalyzeDao.GetAnalyzeOptions = {
      id: deleteAnalyzeOptions.id
    }
    const analyzeDao = await this.analyzeMapper.getAnalyze(getAnalyzeDao)
    if (!analyzeDao) {
      throw new Error('分析不存在')
    }
    if (analyzeDao.chartConfigId) {
      const deleteChartConfigDao: AnalyzeConfigDao.DeleteChartConfigOption = {
        id: analyzeDao.chartConfigId,
        updatedBy: analyzeDao.updatedBy,
        updateTime: analyzeDao.updateTime
      }
      // 删除图表配置
      await this.chartConfigService.deleteChartConfig(deleteChartConfigDao)
    }
    const { updatedBy, updateTime } = await super.getDefaultInfo()
    const deleteAnalyzeDao: AnalyzeDao.DeleteAnalyzeOptions = {
      id: analyzeDao.id,
      updatedBy,
      updateTime
    }
    const deleteAnalyzeResult = await this.analyzeMapper.deleteAnalyze(deleteAnalyzeDao)
    return deleteAnalyzeResult
  }
  /**
   * @desc 获取分析
   * @param {AnalyzeDto.GetAnalyzeOptions} analyzeOptions
   * @returns {Promise<AnalyzeVo.GetAnalyzeOptions>}
   */
  public async getAnalyze(analyzeOptions: AnalyzeDto.GetAnalyzeOptions): Promise<AnalyzeVo.GetAnalyzeOptions> {
    const analyzeDao = await this.analyzeMapper.getAnalyze(analyzeOptions)
    if (!analyzeDao) {
      throw new Error('分析不存在')
    } else if (analyzeDao.chartConfigId) {
      const getChartConfigOptions: AnalyzeConfigDao.GetChartConfigOptions = {
        id: analyzeDao.chartConfigId
      }
      const chartConfigVo = await this.chartConfigService.getChartConfig(getChartConfigOptions)
      return this.convertDaoToVo(analyzeDao, chartConfigVo)
    } else {
      return this.convertDaoToVo(analyzeDao, null)
    }
  }

  /**
   * @desc 获取所有图表
   * @returns {Promise<Array<AnalyzeVo.GetAnalyzeOptions>>}
   */
  public async getAnalyzes(): Promise<Array<AnalyzeVo.GetAnalyzeOptions>> {
    const analyzeDaoList = await this.analyzeMapper.getAnalyzes()
    const promises = analyzeDaoList.map(async (analyzeDao) => {
      if (analyzeDao.chartConfigId) {
        const getChartConfigOptions: AnalyzeConfigDao.GetChartConfigOptions = {
          id: analyzeDao.chartConfigId
        }
        const chartConfigVo = await this.chartConfigService.getChartConfig(getChartConfigOptions)
        return this.convertDaoToVo(analyzeDao, chartConfigVo)
      } else {
        return this.convertDaoToVo(analyzeDao, null)
      }
    })
    const getAnalyzesResult = await Promise.all(promises)
    return getAnalyzesResult
  }

  /**
   * @desc 更新分析
   * @param {AnalyzeDto.UpdateAnalyzeOptions} updateAnalyzeOptions
   * @returns {Promise<AnalyzeVo.UpdateAnalyzeResponse>}
   */
  public async updateAnalyze(
    updateAnalyzeOptions: AnalyzeDto.UpdateAnalyzeOptions
  ): Promise<AnalyzeVo.UpdateAnalyzeResponse> {
    // 解构分析配置，剩余的为分析配置
    const { chartConfig, ...restOption } = updateAnalyzeOptions
    let chartConfigId = updateAnalyzeOptions.chartConfigId
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

    const updateParams: AnalyzeDao.UpdateAnalyzeOptions = {
      ...restOption,
      updateTime,
      updatedBy,
      chartConfigId
    }
    const updateAnalyzeResponse = await this.analyzeMapper.updateAnalyze(updateParams)

    return updateAnalyzeResponse
  }

  /**
   * @desc 创建图表
   * @param createAnalyzeRequest {AnalyzeDto.CreateAnalyzeRequest} 图表
   * @returns {Promise<AnalyzeVo.CreateAnalyzeResponse>}
   */
  public async createAnalyze(
    createAnalyzeRequest: AnalyzeDto.CreateAnalyzeOptions
  ): Promise<AnalyzeVo.CreateAnalyzeResponse> {
    const { chartConfig, ...restAnalyzeOption } = createAnalyzeRequest
    const { createdBy, updatedBy, createTime, updateTime } = await this.getDefaultInfo()
    let chartConfigId = createAnalyzeRequest.chartConfigId || null
    if (chartConfig) {
      // 如果图表配置不存在，则创建默认图表配置
      chartConfigId = await this.chartConfigService.createChartConfig(chartConfig)
    }
    const enrichedAnalyzeOption = {
      ...restAnalyzeOption,
      createdBy,
      updatedBy,
      createTime,
      updateTime,
      chartConfigId
    }
    const createAnalyzeResponse = await this.analyzeMapper.createAnalyze(enrichedAnalyzeOption)
    return createAnalyzeResponse
  }

  /**
   * @desc 更新图表名称
   * @param analyzeOption {AnalyzeDto.AnalyzeOption} 图表
   * @returns {Promise<boolean>}
   */
  public async updateAnalyzeName(
    updateAnalyzeNameRequest: AnalyzeDto.UpdateAnalyzeNameOptions
  ): Promise<AnalyzeVo.UpdateAnalyzeNameResponse> {
    const { updatedBy, updateTime } = await this.getDefaultInfo()
    const enrichedAnalyzeNameOptions: AnalyzeDao.UpdateAnalyzeNameOptions = {
      ...updateAnalyzeNameRequest,
      updatedBy,
      updateTime
    }
    const updateAnalyzeNameResponse = await this.analyzeMapper.updateAnalyzeName(enrichedAnalyzeNameOptions)
    return updateAnalyzeNameResponse
  }

  /**
   * @desc 更新图表描述
   * @param updateAnalyzeDescRequest {AnalyzeDto.UpdateAnalyzeDescRequest} 图表
   * @returns {Promise<AnalyzeVo.UpdateAnalyzeDescResponse>}
   */
  public async updateAnalyzeDesc(
    updateAnalyzeDescRequest: AnalyzeDto.UpdateAnalyzeDescOptions
  ): Promise<AnalyzeVo.UpdateAnalyzeDescResponse> {
    const { updatedBy, updateTime } = await this.getDefaultInfo()
    const enrichedAnalyzeDescOptions: AnalyzeDao.UpdateAnalyzeDescOptions = {
      ...updateAnalyzeDescRequest,
      updatedBy,
      updateTime
    }
    const updateAnalyzeDescResponse = await this.analyzeMapper.updateAnalyzeDesc(enrichedAnalyzeDescOptions)
    return updateAnalyzeDescResponse
  }
}
