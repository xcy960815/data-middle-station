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
   * @param analyzeRecord {AnalyzeDao.AnalyzeRecord} 分析记录
   * @param resolvedChartConfig {AnalyzeConfigVo.ChartConfigResponse | null} 关联图表配置
   * @returns {AnalyzeVo.AnalyzeDetailResponse}
   */
  private convertDaoToVo(
    analyzeRecord: AnalyzeDao.AnalyzeRecord,
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
   * @param {AnalyzeDto.DeleteAnalyzeRequest} deleteRequest
   * @returns {Promise<boolean>}
   */
  public async deleteAnalyze(deleteRequest: AnalyzeDto.DeleteAnalyzeRequest): Promise<boolean> {
    const queryParams: AnalyzeDao.GetAnalyzeParams = {
      id: deleteRequest.id
    }
    const analyzeRecord = await this.analyzeMapper.getAnalyze(queryParams)
    if (!analyzeRecord) {
      throw new Error('分析不存在')
    }
    await this.assertAnalyzePermission(deleteRequest.id, 'manage')
    if (analyzeRecord.chartConfigId) {
      const deleteChartConfigRequest: AnalyzeConfigDto.DeleteChartConfigRequest = {
        id: analyzeRecord.chartConfigId
      }
      // 删除图表配置
      await this.chartConfigService.deleteChartConfig(deleteChartConfigRequest)
    }
    const { updatedBy, updateTime } = await super.getDefaultInfo()
    const deleteAnalyzeParams: AnalyzeDao.DeleteAnalyzeParams = {
      id: analyzeRecord.id,
      updatedBy,
      updateTime
    }
    const deleteAnalyzeResult = await this.analyzeMapper.deleteAnalyze(deleteAnalyzeParams)
    return deleteAnalyzeResult
  }
  /**
   * @desc 获取分析
   * @param {AnalyzeDto.GetAnalyzeRequest} queryRequest
   * @returns {Promise<AnalyzeVo.AnalyzeDetailResponse>}
   */
  public async getAnalyze(queryRequest: AnalyzeDto.GetAnalyzeRequest): Promise<AnalyzeVo.AnalyzeDetailResponse> {
    const { trackViewCount = false, ...analyzeQueryParams } = queryRequest
    const analyzeRecord = await this.analyzeMapper.getAnalyze(analyzeQueryParams)
    if (!analyzeRecord) {
      throw new Error('分析不存在')
    }
    await this.assertAnalyzePermission(analyzeRecord.id, 'view')

    if (trackViewCount) {
      await this.analyzeMapper.updateViewCount(analyzeRecord.id)
      analyzeRecord.viewCount += 1
    }

    if (analyzeRecord.chartConfigId) {
      const getChartConfigRequest: AnalyzeConfigDto.GetChartConfigRequest = {
        id: analyzeRecord.chartConfigId
      }
      const resolvedChartConfig = await this.chartConfigService.getChartConfig(getChartConfigRequest)
      return this.convertDaoToVo(analyzeRecord, resolvedChartConfig)
    }

    return this.convertDaoToVo(analyzeRecord, null)
  }

  /**
   * @desc 获取所有图表
   * @returns {Promise<AnalyzeVo.AnalyzeListResponse>}
   */
  public async getAnalyzes(
    queryRequest: AnalyzeDto.GetAnalyzeListRequest = {}
  ): Promise<AnalyzeVo.AnalyzeListResponse> {
    const currentUser = this.getCurrentUser()
    const normalizedQueryParams: AnalyzeDao.GetAnalyzeListParams = {
      page: Math.max(1, Math.floor(Number(queryRequest.page || 1))),
      pageSize: Math.min(100, Math.max(1, Math.floor(Number(queryRequest.pageSize || 12)))),
      keyword: queryRequest.keyword?.trim() || '',
      sortField: queryRequest.sortField || 'updateTime',
      sortOrder: queryRequest.sortOrder || 'desc',
      currentUserName: currentUser?.userName,
      roleCodes: currentUser?.roleCodes || []
    }

    const [total, list] = await Promise.all([
      this.analyzeMapper.countAnalyzes(normalizedQueryParams),
      this.analyzeMapper.getAnalyzeList(normalizedQueryParams)
    ])

    return {
      list,
      total,
      page: normalizedQueryParams.page,
      pageSize: normalizedQueryParams.pageSize,
      keyword: normalizedQueryParams.keyword || '',
      sortField: normalizedQueryParams.sortField,
      sortOrder: normalizedQueryParams.sortOrder
    }
  }

  /**
   * @desc 更新分析
   * @param {AnalyzeDto.UpdateAnalyzeRequest} updateRequest
   * @returns {Promise<AnalyzeVo.AnalyzeDetailResponse>}
   */
  public async updateAnalyze(updateRequest: AnalyzeDto.UpdateAnalyzeRequest): Promise<AnalyzeVo.AnalyzeDetailResponse> {
    await this.assertAnalyzePermission(updateRequest.id, 'edit')
    // 拆出图表配置后，剩余字段为分析实体本身的更新载荷
    const { chartConfig, ...analyzeUpdatePayload } = updateRequest
    let chartConfigId = updateRequest.chartConfigId
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

    const updateParams: AnalyzeDao.UpdateAnalyzeParams = {
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
   * @param {AnalyzeDto.CreateAnalyzeRequest} createRequest
   * @returns {Promise<AnalyzeVo.AnalyzeDetailResponse>}
   */
  public async createAnalyze(createRequest: AnalyzeDto.CreateAnalyzeRequest): Promise<AnalyzeVo.AnalyzeDetailResponse> {
    const { chartConfig, ...restAnalyzePayload } = createRequest
    const { createdBy, updatedBy, createTime, updateTime } = await this.getDefaultInfo()
    let chartConfigId = createRequest.chartConfigId || null
    if (chartConfig) {
      // 如果图表配置不存在，则创建默认图表配置
      const createChartConfigResponse = await this.chartConfigService.createChartConfig(chartConfig)
      chartConfigId = createChartConfigResponse.id
    }
    const createAnalyzeParams = {
      ...restAnalyzePayload,
      createdBy,
      updatedBy,
      createTime,
      updateTime,
      chartConfigId
    }
    const analyzeId = await this.analyzeMapper.createAnalyze(createAnalyzeParams)
    return this.getAnalyze({ id: analyzeId })
  }

  /**
   * @desc 更新图表名称
   * @param {AnalyzeDto.UpdateAnalyzeNameRequest} updateRequest
   * @returns {Promise<boolean>}
   */
  public async updateAnalyzeName(updateRequest: AnalyzeDto.UpdateAnalyzeNameRequest): Promise<boolean> {
    await this.assertAnalyzePermission(updateRequest.id, 'edit')
    const { updatedBy, updateTime } = await this.getDefaultInfo()
    const updateAnalyzeNameParams = {
      ...updateRequest,
      updatedBy,
      updateTime
    }
    const updateAnalyzeNameResponse = await this.analyzeMapper.updateAnalyzeName(updateAnalyzeNameParams)
    return updateAnalyzeNameResponse
  }

  /**
   * @desc 更新图表描述
   * @param {AnalyzeDto.UpdateAnalyzeDescRequest} updateRequest
   * @returns {Promise<boolean>}
   */
  public async updateAnalyzeDesc(updateRequest: AnalyzeDto.UpdateAnalyzeDescRequest): Promise<boolean> {
    await this.assertAnalyzePermission(updateRequest.id, 'edit')
    const { updatedBy, updateTime } = await this.getDefaultInfo()
    const updateAnalyzeDescParams = {
      ...updateRequest,
      updatedBy,
      updateTime
    }
    const updateAnalyzeDescResponse = await this.analyzeMapper.updateAnalyzeDesc(updateAnalyzeDescParams)
    return updateAnalyzeDescResponse
  }
}
