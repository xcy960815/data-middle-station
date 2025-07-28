import { AnalyseMapper } from '../mapper/analyseMapper'
import { ChartConfigService } from './chartConfigService'
import dayjs from 'dayjs'

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
   * @desc 将vo对象转换为dao对象
   * @param analyseOption {AnalyseVo.AnalyseOption}
   * @returns {AnalyseDao.AnalyseOption}
   */
  private dto2Dao(analyseOption: Omit<AnalyseDto.AnalyseOption, 'chartConfig'>): AnalyseDao.AnalyseOption {
    return {
      ...analyseOption,
      isDeleted: null
    }
  }

  /**
   * @desc 获取默认信息
   * @returns {Promise<{createdBy: string, updatedBy: string, createTime: string, updateTime: string}>}
   */
  private async getDefaultInfo() {
    const createdBy = (await RedisStorage.getItem<string>(`userName`)) || 'system'
    const updatedBy = (await RedisStorage.getItem<string>(`userName`)) || 'system'
    const createTime = dayjs().format('YYYY-MM-DD HH:mm:ss')
    const updateTime = dayjs().format('YYYY-MM-DD HH:mm:ss')
    return { createdBy, updatedBy, createTime, updateTime }
  }
  /**
   * @desc 删除分析
   * @param id {number} 分析id
   * @returns {Promise<boolean>}
   */
  public async deleteAnalyse(id: number): Promise<boolean> {
    const analyseOption = await this.getAnalyse(id)
    if (analyseOption.chartConfigId) {
      // 删除图表配置
      await this.chartConfigService.deleteChartConfig(analyseOption.chartConfigId)
    }
    const { updatedBy, updateTime } = await this.getDefaultInfo()
    const deleteParams = {
      id,
      updatedBy,
      updateTime
    }
    return this.analyseMapper.deleteAnalyse(deleteParams)
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
  public async updateAnalyse(analyseOptionDto: AnalyseDto.AnalyseOption): Promise<boolean> {
    // 解构图表配置，剩余的为图表配置
    const { chartConfig, ...analyseOption } = analyseOptionDto
    let chartConfigId = analyseOption.chartConfigId
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
    const { updatedBy, updateTime } = await this.getDefaultInfo()
    analyseOption.updateTime = updateTime
    analyseOption.updatedBy = updatedBy
    analyseOption.chartConfigId = chartConfigId
    const updateAnalyseResult = await this.analyseMapper.updateAnalyse(this.dto2Dao(analyseOption))

    return updateAnalyseResult
  }

  /**
   * @desc 创建图表
   * @param analyseOptionDto {AnalyseDto.AnalyseOption} 图表
   * @returns {Promise<boolean>}
   */
  public async createAnalyse(analyseOptionDto: AnalyseDto.AnalyseOption): Promise<boolean> {
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
    const createAnalyseResult = await this.analyseMapper.createAnalyse(this.dto2Dao(restOption))
    return createAnalyseResult
  }

  /**
   * @desc 更新图表名称
   * @param analyseOption {AnalyseDto.AnalyseOption} 图表
   * @returns {Promise<boolean>}
   */
  public async updateAnalyseName(analyseOption: AnalyseDto.AnalyseOption): Promise<boolean> {
    const { chartConfig, ...restOption } = analyseOption
    const { updatedBy, updateTime } = await this.getDefaultInfo()
    restOption.updatedBy = updatedBy
    restOption.updateTime = updateTime
    return this.analyseMapper.updateAnalyse(this.dto2Dao(restOption))
  }

  /**
   * @desc 更新图表描述
   * @param analyseOption {AnalyseDto.AnalyseOption} 图表
   * @returns {Promise<boolean>}
   */
  public async updateAnalyseDesc(analyseOption: AnalyseDto.AnalyseOption): Promise<boolean> {
    const { chartConfig, ...restOption } = analyseOption
    const { updatedBy, updateTime } = await this.getDefaultInfo()
    restOption.updatedBy = updatedBy
    restOption.updateTime = updateTime
    return this.analyseMapper.updateAnalyse(this.dto2Dao(restOption))
  }
}
