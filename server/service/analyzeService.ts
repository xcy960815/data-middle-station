import { AnalyzeMapper } from '@/server/mapper/analyzeMapper'
import { BaseService } from '@/server/service/baseService'
import { AnalyzeConfigService } from '@/server/service/analyzeConfigService'
import { ResourcePermissionService } from '@/server/service/resourcePermissionService'

/**
 * @desc 分析服务
 */
export class AnalyzeService extends BaseService {
  /**
   * 图表mapper
   */
  private analyzeMapper: AnalyzeMapper

  /**
   * 分析配置服务
   */
  private analyzeConfigService: AnalyzeConfigService
  private resourcePermissionService: ResourcePermissionService

  constructor() {
    super()
    this.analyzeMapper = new AnalyzeMapper()
    this.analyzeConfigService = new AnalyzeConfigService()
    this.resourcePermissionService = new ResourcePermissionService()
  }

  /**
   * @desc DAO 转 VO
   * @param analyzeRecord {AnalyzeDao.AnalyzeRecord} 分析记录
   * @param resolvedChartConfig {AnalyzeConfigVo.AnalyzeConfigResponse | null} 当前生效的分析配置
   * @returns {AnalyzeVo.AnalyzeDetailResponse}
   */
  private convertDaoToVo(
    analyzeRecord: AnalyzeDao.AnalyzeRecord,
    resolvedChartConfig: AnalyzeConfigVo.AnalyzeConfigResponse | null
  ): AnalyzeVo.AnalyzeDetailResponse {
    return {
      ...analyzeRecord,
      chartConfig: resolvedChartConfig
    }
  }

  /**
   * @desc 校验当前用户对分析的最低权限。
   */
  private async assertAnalyzePermission(
    analyzeId: number,
    requiredPermission: Exclude<PermissionVo.ResourcePermissionType, 'none'>
  ): Promise<void> {
    await this.resourcePermissionService.assertResourcePermission({
      resourceType: 'analyze',
      resourceId: analyzeId,
      requiredPermission
    })
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
    await this.analyzeConfigService.deleteAnalyzeConfigs({ analyzeId: analyzeRecord.id })
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

    if (analyzeRecord.currentConfigId) {
      const getAnalyzeConfigRequest: AnalyzeConfigDto.GetAnalyzeConfigRequest = {
        id: analyzeRecord.currentConfigId
      }
      const resolvedAnalyzeConfig = await this.analyzeConfigService.getAnalyzeConfig(getAnalyzeConfigRequest)
      return this.convertDaoToVo(analyzeRecord, resolvedAnalyzeConfig)
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

  public async getAnalyzeConfigHistory(
    queryRequest: AnalyzeConfigDto.GetAnalyzeConfigHistoryRequest
  ): Promise<AnalyzeConfigVo.AnalyzeConfigResponse[]> {
    await this.assertAnalyzePermission(queryRequest.analyzeId, 'view')
    return await this.analyzeConfigService.getAnalyzeConfigHistory(queryRequest.analyzeId)
  }

  public async switchAnalyzeConfigVersion(
    switchRequest: AnalyzeConfigDto.SwitchAnalyzeConfigVersionRequest
  ): Promise<AnalyzeVo.AnalyzeDetailResponse> {
    await this.assertAnalyzePermission(switchRequest.analyzeId, 'edit')
    const targetConfig = await this.analyzeConfigService.getAnalyzeConfig({ id: switchRequest.configId })
    if (targetConfig.analyzeId !== switchRequest.analyzeId) {
      throw new Error('分析配置版本不属于当前分析')
    }
    const { updatedBy, updateTime } = await this.getDefaultInfo()
    const updateResult = await this.analyzeMapper.updateAnalyze({
      id: switchRequest.analyzeId,
      currentConfigId: targetConfig.id,
      updatedBy,
      updateTime
    })
    if (!updateResult) {
      throw new Error('切换分析配置版本失败')
    }
    return await this.getAnalyze({ id: switchRequest.analyzeId })
  }

  /**
   * @desc 更新分析
   * @param {AnalyzeDto.UpdateAnalyzeRequest} updateRequest
   * @returns {Promise<AnalyzeVo.AnalyzeDetailResponse>}
   */
  public async updateAnalyze(updateRequest: AnalyzeDto.UpdateAnalyzeRequest): Promise<AnalyzeVo.AnalyzeDetailResponse> {
    await this.assertAnalyzePermission(updateRequest.id, 'edit')
    // 拆出配置后，剩余字段为分析实体本身的更新载荷。
    const { chartConfig, ...analyzeUpdatePayload } = updateRequest
    let currentConfigId = updateRequest.currentConfigId
    if (chartConfig) {
      const createAnalyzeConfigResponse = await this.analyzeConfigService.createAnalyzeConfigVersion({
        ...chartConfig,
        analyzeId: updateRequest.id
      })
      currentConfigId = createAnalyzeConfigResponse.id
    }
    const { updatedBy, updateTime } = await super.getDefaultInfo()

    const updateParams: AnalyzeDao.UpdateAnalyzeParams = {
      ...analyzeUpdatePayload,
      updateTime,
      updatedBy,
      currentConfigId
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
    const createAnalyzeParams = {
      ...restAnalyzePayload,
      createdBy,
      updatedBy,
      createTime,
      updateTime,
      currentConfigId: null
    }
    const analyzeId = await this.analyzeMapper.createAnalyze(createAnalyzeParams)
    if (chartConfig) {
      const createAnalyzeConfigResponse = await this.analyzeConfigService.createAnalyzeConfigVersion({
        ...chartConfig,
        analyzeId
      })
      await this.analyzeMapper.updateAnalyze({
        id: analyzeId,
        currentConfigId: createAnalyzeConfigResponse.id,
        updatedBy,
        updateTime
      })
    }
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
