import { AnalyzeMapper } from '@/server/mapper/analyzeMapper'
import { BaseService } from '@/server/service/baseService'
import { ChartConfigService } from '@/server/service/chartConfigService'

type AnalyzePermissionLevel = 'view' | 'edit' | 'manage'

const ANALYZE_PERMISSION_LEVEL_MAP: Record<PermissionVo.AnalyzePermissionType, number> = {
  none: 0,
  view: 1,
  edit: 2,
  manage: 3
}

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
   * @param analyzeRecord {AnalyzeDao.AnalyzeOption} 分析记录
   * @param resolvedChartConfig {AnalyzeConfigVo.ChartConfigResponse | null} 关联图表配置
   * @returns {AnalyzeVo.AnalyzeDetailResponse}
   */
  private convertDaoToVo(
    analyzeRecord: AnalyzeDao.AnalyzeOption,
    resolvedChartConfig: AnalyzeConfigVo.ChartConfigResponse | null
  ): AnalyzeVo.AnalyzeDetailResponse {
    return {
      ...analyzeRecord,
      chartConfig: resolvedChartConfig
    }
  }

  /**
   * @desc 校验当前用户对分析的最低权限。
   */
  private async assertAnalyzePermission(analyzeId: number, requiredPermission: AnalyzePermissionLevel): Promise<void> {
    const currentUser = this.getCurrentUser()
    if (!currentUser) {
      return
    }

    const permission = await this.analyzeMapper.getAnalyzePermission(
      analyzeId,
      currentUser.userName,
      currentUser.roleCodes || []
    )
    if (ANALYZE_PERMISSION_LEVEL_MAP[permission] < ANALYZE_PERMISSION_LEVEL_MAP[requiredPermission]) {
      throw new Error('无权访问该分析')
    }
  }

  /**
   * @desc 删除分析
   * @param {AnalyzeDto.DeleteAnalyzeRequest} deleteOptions
   * @returns {Promise<boolean>}
   */
  public async deleteAnalyze(deleteOptions: AnalyzeDto.DeleteAnalyzeRequest): Promise<boolean> {
    const queryOptions: AnalyzeDao.GetAnalyzeOptions = {
      id: deleteOptions.id
    }
    const analyzeRecord = await this.analyzeMapper.getAnalyze(queryOptions)
    if (!analyzeRecord) {
      throw new Error('分析不存在')
    }
    await this.assertAnalyzePermission(deleteOptions.id, 'manage')
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
   * @param {AnalyzeDto.GetAnalyzeRequest} queryOptions
   * @returns {Promise<AnalyzeVo.AnalyzeDetailResponse>}
   */
  public async getAnalyze(queryOptions: AnalyzeDto.GetAnalyzeRequest): Promise<AnalyzeVo.AnalyzeDetailResponse> {
    const { trackViewCount = false, ...analyzeQueryOptions } = queryOptions
    const analyzeRecord = await this.analyzeMapper.getAnalyze(analyzeQueryOptions)
    if (!analyzeRecord) {
      throw new Error('分析不存在')
    }
    await this.assertAnalyzePermission(analyzeRecord.id, 'view')

    if (trackViewCount) {
      await this.analyzeMapper.updateViewCount(analyzeRecord.id)
      analyzeRecord.viewCount += 1
    }

    if (analyzeRecord.chartConfigId) {
      const getChartConfigOptions: AnalyzeConfigDao.GetChartConfigOptions = {
        id: analyzeRecord.chartConfigId
      }
      const resolvedChartConfig = await this.chartConfigService.getChartConfig(getChartConfigOptions)
      return this.convertDaoToVo(analyzeRecord, resolvedChartConfig)
    }

    return this.convertDaoToVo(analyzeRecord, null)
  }

  /**
   * @desc 获取所有图表
   * @returns {Promise<AnalyzeVo.AnalyzeListResponse>}
   */
  public async getAnalyzes(
    queryOptions: AnalyzeDto.GetAnalyzeListRequest = {}
  ): Promise<AnalyzeVo.AnalyzeListResponse> {
    const currentUser = this.getCurrentUser()
    const normalizedQueryOptions: AnalyzeDao.GetAnalyzeListOptions = {
      page: Math.max(1, Math.floor(Number(queryOptions.page || 1))),
      pageSize: Math.min(100, Math.max(1, Math.floor(Number(queryOptions.pageSize || 12)))),
      keyword: queryOptions.keyword?.trim() || '',
      sortField: queryOptions.sortField || 'updateTime',
      sortOrder: queryOptions.sortOrder || 'desc',
      currentUserName: currentUser?.userName,
      roleCodes: currentUser?.roleCodes || []
    }

    const [total, list] = await Promise.all([
      this.analyzeMapper.countAnalyzes(normalizedQueryOptions),
      this.analyzeMapper.getAnalyzeList(normalizedQueryOptions)
    ])

    return {
      list,
      total,
      page: normalizedQueryOptions.page,
      pageSize: normalizedQueryOptions.pageSize,
      keyword: normalizedQueryOptions.keyword || '',
      sortField: normalizedQueryOptions.sortField,
      sortOrder: normalizedQueryOptions.sortOrder
    }
  }

  /**
   * @desc 更新分析
   * @param {AnalyzeDto.UpdateAnalyzeRequest} updateOptions
   * @returns {Promise<AnalyzeVo.AnalyzeDetailResponse>}
   */
  public async updateAnalyze(updateOptions: AnalyzeDto.UpdateAnalyzeRequest): Promise<AnalyzeVo.AnalyzeDetailResponse> {
    await this.assertAnalyzePermission(updateOptions.id, 'edit')
    // 拆出图表配置后，剩余字段为分析实体本身的更新载荷
    const { chartConfig, ...analyzeUpdatePayload } = updateOptions
    let chartConfigId = updateOptions.chartConfigId
    if (chartConfig) {
      if (!chartConfigId) {
        // 如果图表配置不存在，则创建默认图表配置
        const createChartConfigResponse = await this.chartConfigService.createChartConfig(chartConfig)
        chartConfigId = createChartConfigResponse.id
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
      ...analyzeUpdatePayload,
      updateTime,
      updatedBy,
      chartConfigId
    }
    const updateAnalyzeResponse = await this.analyzeMapper.updateAnalyze(updateParams)
    if (!updateAnalyzeResponse) {
      throw new Error('保存失败')
    }

    return await this.getAnalyze({ id: updateParams.id })
  }

  /**
   * @desc 创建图表
   * @param {AnalyzeDto.CreateAnalyzeRequest} createOptions
   * @returns {Promise<AnalyzeVo.AnalyzeDetailResponse>}
   */
  public async createAnalyze(createOptions: AnalyzeDto.CreateAnalyzeRequest): Promise<AnalyzeVo.AnalyzeDetailResponse> {
    const { chartConfig, ...restAnalyzeOption } = createOptions
    const { createdBy, updatedBy, createTime, updateTime } = await this.getDefaultInfo()
    let chartConfigId = createOptions.chartConfigId || null
    if (chartConfig) {
      // 如果图表配置不存在，则创建默认图表配置
      const createChartConfigResponse = await this.chartConfigService.createChartConfig(chartConfig)
      chartConfigId = createChartConfigResponse.id
    }
    const createAnalyzeOptions = {
      ...restAnalyzeOption,
      createdBy,
      updatedBy,
      createTime,
      updateTime,
      chartConfigId
    }
    const analyzeId = await this.analyzeMapper.createAnalyze(createAnalyzeOptions)
    return this.getAnalyze({ id: analyzeId })
  }

  /**
   * @desc 更新图表名称
   * @param {AnalyzeDto.UpdateAnalyzeNameRequest} updateOptions
   * @returns {Promise<boolean>}
   */
  public async updateAnalyzeName(updateOptions: AnalyzeDto.UpdateAnalyzeNameRequest): Promise<boolean> {
    await this.assertAnalyzePermission(updateOptions.id, 'edit')
    const { updatedBy, updateTime } = await this.getDefaultInfo()
    const updateAnalyzeNameOptions = {
      ...updateOptions,
      updatedBy,
      updateTime
    }
    const updateAnalyzeNameResponse = await this.analyzeMapper.updateAnalyzeName(updateAnalyzeNameOptions)
    return updateAnalyzeNameResponse
  }

  /**
   * @desc 更新图表描述
   * @param {AnalyzeDto.UpdateAnalyzeDescRequest} updateOptions
   * @returns {Promise<boolean>}
   */
  public async updateAnalyzeDesc(updateOptions: AnalyzeDto.UpdateAnalyzeDescRequest): Promise<boolean> {
    await this.assertAnalyzePermission(updateOptions.id, 'edit')
    const { updatedBy, updateTime } = await this.getDefaultInfo()
    const updateAnalyzeDescOptions = {
      ...updateOptions,
      updatedBy,
      updateTime
    }
    const updateAnalyzeDescResponse = await this.analyzeMapper.updateAnalyzeDesc(updateAnalyzeDescOptions)
    return updateAnalyzeDescResponse
  }
}
