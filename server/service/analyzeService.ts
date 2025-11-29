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
   * @param analyzeRecord {AnalyzeDao.AnalyzeOptions} 分析记录
   * @param resolvedChartConfig {AnalyzeConfigVo.ChartConfigOptions | null} 关联图表配置
   * @returns {AnalyzeVo.GetAnalyzeOptions}
   */
  private convertDaoToVo(
    analyzeRecord: AnalyzeDao.AnalyzeOptions,
    resolvedChartConfig: AnalyzeConfigVo.ChartConfigOptions | null
  ): AnalyzeVo.AnalyzeOptions {
    return {
      ...analyzeRecord,
      chartConfig: resolvedChartConfig
    }
  }
  /**
   * @desc 删除分析
   * @param {AnalyzeDto.DeleteAnalyzeOptions} deleteOptions
   * @returns {Promise<AnalyzeVo.DeleteAnalyzeResponse>}
   */
  public async deleteAnalyze(deleteOptions: AnalyzeDto.DeleteAnalyzeOptions): Promise<AnalyzeVo.DeleteAnalyzeOptions> {
    const queryOptions: AnalyzeDao.GetAnalyzeOptions = {
      id: deleteOptions.id
    }
    const analyzeRecord = await this.analyzeMapper.getAnalyze(queryOptions)
    if (!analyzeRecord) {
      throw new Error('分析不存在')
    }
    if (analyzeRecord.chartConfigId) {
      const deleteChartConfigOptions: AnalyzeConfigDao.DeleteChartConfigOptions = {
        id: analyzeRecord.chartConfigId,
        updatedBy: analyzeRecord.updatedBy,
        updateTime: analyzeRecord.updateTime
      }
      // 删除图表配置
      await this.chartConfigService.deleteChartConfig(deleteChartConfigOptions)
    }
    const { updatedBy, updateTime } = await super.getDefaultInfo()
    const deleteAnalyzeOptions: AnalyzeDao.DeleteAnalyzeOptions = {
      id: analyzeRecord.id,
      updatedBy,
      updateTime
    }
    const deleteAnalyzeResult = await this.analyzeMapper.deleteAnalyze(deleteAnalyzeOptions)
    return deleteAnalyzeResult
  }
  /**
   * @desc 获取分析
   * @param {AnalyzeDto.GetAnalyzeOptions} queryOptions
   * @returns {Promise<AnalyzeVo.GetAnalyzeResponse>}
   */
  public async getAnalyze(queryOptions: AnalyzeDto.GetAnalyzeOptions): Promise<AnalyzeVo.GetAnalyzeOptions> {
    const analyzeRecord = await this.analyzeMapper.getAnalyze(queryOptions)
    if (!analyzeRecord) {
      throw new Error('分析不存在')
    } else if (analyzeRecord.chartConfigId) {
      const getChartConfigOptions: AnalyzeConfigDao.GetChartConfigOptions = {
        id: analyzeRecord.chartConfigId
      }
      const chartConfigVo = await this.chartConfigService.getChartConfig(getChartConfigOptions)
      return this.convertDaoToVo(analyzeRecord, chartConfigVo)
    } else {
      return this.convertDaoToVo(analyzeRecord, null)
    }
  }

  /**
   * @desc 获取所有图表
   * @returns {Promise<Array<AnalyzeVo.GetAnalyzeResponse>>}
   */
  public async getAnalyzes(): Promise<Array<AnalyzeVo.GetAnalyzeOptions>> {
    const analyzeRecordList = await this.analyzeMapper.getAnalyzes()
    const promises = analyzeRecordList.map(async (analyzeRecord) => {
      if (analyzeRecord.chartConfigId) {
        const getChartConfigOptions: AnalyzeConfigDao.GetChartConfigOptions = {
          id: analyzeRecord.chartConfigId
        }
        const chartConfigVo = await this.chartConfigService.getChartConfig(getChartConfigOptions)
        return this.convertDaoToVo(analyzeRecord, chartConfigVo)
      } else {
        return this.convertDaoToVo(analyzeRecord, null)
      }
    })
    const getAnalyzesResult = await Promise.all(promises)
    return getAnalyzesResult
  }

  /**
   * @desc 更新分析
   * @param {AnalyzeDto.UpdateAnalyzeOptions} updateOptions
   * @returns {Promise<AnalyzeVo.UpdateAnalyzeResponse>}
   */
  public async updateAnalyze(updateOptions: AnalyzeDto.UpdateAnalyzeOptions): Promise<AnalyzeVo.UpdateAnalyzeOptions> {
    // 解构分析配置，剩余的为分析配置
    const { chartConfig, ...restOption } = updateOptions
    let chartConfigId = updateOptions.chartConfigId
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
   * @param createOptions {AnalyzeDto.CreateAnalyzeRequest} 图表
   * @returns {Promise<AnalyzeVo.CreateAnalyzeResponse>}
   */
  public async createAnalyze(createOptions: AnalyzeDto.CreateAnalyzeOptions): Promise<AnalyzeVo.CreateAnalyzeOptions> {
    const { chartConfig, ...restAnalyzeOption } = createOptions
    const { createdBy, updatedBy, createTime, updateTime } = await this.getDefaultInfo()
    let chartConfigId = createOptions.chartConfigId || null
    if (chartConfig) {
      // 如果图表配置不存在，则创建默认图表配置
      chartConfigId = await this.chartConfigService.createChartConfig(chartConfig)
    }
    const enrichedOptions = {
      ...restAnalyzeOption,
      createdBy,
      updatedBy,
      createTime,
      updateTime,
      chartConfigId
    }
    const createAnalyzeResponseId = await this.analyzeMapper.createAnalyze(enrichedOptions)
    return this.getAnalyze({ id: createAnalyzeResponseId })
  }

  /**
   * @desc 更新图表名称
   * @param updateOptions {AnalyzeDto.AnalyzeOption} 图表
   * @returns {Promise<boolean>}
   */
  public async updateAnalyzeName(
    updateOptions: AnalyzeDto.UpdateAnalyzeNameOptions
  ): Promise<AnalyzeVo.UpdateAnalyzeNameOptions> {
    const { updatedBy, updateTime } = await this.getDefaultInfo()
    const enrichedOptions: AnalyzeDao.UpdateAnalyzeNameOptions = {
      ...updateOptions,
      updatedBy,
      updateTime
    }
    const updateAnalyzeNameResponse = await this.analyzeMapper.updateAnalyzeName(enrichedOptions)
    return updateAnalyzeNameResponse
  }

  /**
   * @desc 更新图表描述
   * @param updateOptions {AnalyzeDto.UpdateAnalyzeDescRequest} 图表
   * @returns {Promise<AnalyzeVo.UpdateAnalyzeDescResponse>}
   */
  public async updateAnalyzeDesc(
    updateOptions: AnalyzeDto.UpdateAnalyzeDescOptions
  ): Promise<AnalyzeVo.UpdateAnalyzeDescOptions> {
    const { updatedBy, updateTime } = await this.getDefaultInfo()
    const enrichedOptions: AnalyzeDao.UpdateAnalyzeDescOptions = {
      ...updateOptions,
      updatedBy,
      updateTime
    }
    const updateAnalyzeDescResponse = await this.analyzeMapper.updateAnalyzeDesc(enrichedOptions)
    return updateAnalyzeDescResponse
  }
}
