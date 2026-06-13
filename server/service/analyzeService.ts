import { AnalyzeMapper } from '@/server/mapper/analyzeMapper'
import { BaseService } from '@/server/service/baseService'
import { AnalyzeConfigService } from '@/server/service/analyzeConfigService'
import { ResourcePermissionService } from '@/server/service/resourcePermissionService'

/**
 * 分析服务，提供分析图表实体的创建、查询、更新、删除、版本切换等业务逻辑
 */
export class AnalyzeService extends BaseService {
  /**
   * 图表映射器
   * @private
   * @type {AnalyzeMapper}
   */
  private analyzeMapper: AnalyzeMapper

  /**
   * 分析配置服务
   * @private
   * @type {AnalyzeConfigService}
   */
  private analyzeConfigService: AnalyzeConfigService

  /**
   * 资源权限服务
   * @private
   * @type {ResourcePermissionService}
   */
  private resourcePermissionService: ResourcePermissionService

  /**
   * 构造函数，初始化服务依赖的各类 Mapper 与 Service 实例
   */
  constructor() {
    super()
    this.analyzeMapper = new AnalyzeMapper()
    this.analyzeConfigService = new AnalyzeConfigService()
    this.resourcePermissionService = new ResourcePermissionService()
  }

  /**
   * 将 DAO 层的分析实体及对应的图表配置拼装转换为 VO 层的分析详情响应数据
   * @private
   * @param {AnalyzeDao.AnalyzeRecord} analyzeRecord DAO 层分析数据记录
   * @param {AnalyzeConfigVo.AnalyzeConfigResponse | null} resolvedChartConfig 当前生效的分析配置详情，如果无配置则为 null
   * @returns {AnalyzeVo.AnalyzeDetailResponse} VO 层分析详情数据
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
   * 校验当前用户对指定分析资源的最低权限
   * @private
   * @param {number} analyzeId 分析资源 ID
   * @param {Exclude<PermissionVo.ResourcePermissionType, 'none'>} requiredPermission 所需权限级别
   * @returns {Promise<void>}
   * @throws {Error} 权限不足时抛出异常
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
   * 删除分析图表及其关联的配置版本信息
   * @param {AnalyzeDto.DeleteAnalyzeRequest} deleteRequest 删除分析的请求参数
   * @returns {Promise<boolean>} 是否删除成功
   * @throws {Error} 分析不存在或权限不足时抛出异常
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
   * 获取分析详情
   * @param {AnalyzeDto.GetAnalyzeRequest} queryRequest 查询详情的请求参数，可包含是否追踪浏览量等
   * @returns {Promise<AnalyzeVo.AnalyzeDetailResponse>} 分析详情响应数据
   * @throws {Error} 分析不存在或权限不足时抛出异常
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
   * 分页获取分析图表列表
   * @param {AnalyzeDto.GetAnalyzeListRequest} [queryRequest={}] 查询列表的请求参数
   * @returns {Promise<AnalyzeVo.AnalyzeListResponse>} 分析图表列表分页响应数据
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
   * 获取分析图表的配置版本历史列表
   * @param {AnalyzeConfigDto.GetAnalyzeConfigHistoryRequest} queryRequest 获取历史的请求参数，包含分析资源 ID
   * @returns {Promise<AnalyzeConfigVo.AnalyzeConfigResponse[]>} 分析配置版本历史列表
   * @throws {Error} 权限不足时抛出异常
   */
  public async getAnalyzeConfigHistory(
    queryRequest: AnalyzeConfigDto.GetAnalyzeConfigHistoryRequest
  ): Promise<AnalyzeConfigVo.AnalyzeConfigResponse[]> {
    await this.assertAnalyzePermission(queryRequest.analyzeId, 'view')
    return await this.analyzeConfigService.getAnalyzeConfigHistory(queryRequest.analyzeId)
  }

  /**
   * 切换分析图表使用的配置版本
   * @param {AnalyzeConfigDto.SwitchAnalyzeConfigVersionRequest} switchRequest 切换版本请求参数，包含分析资源 ID 和目标配置 ID
   * @returns {Promise<AnalyzeVo.AnalyzeDetailResponse>} 切换后的分析详情数据
   * @throws {Error} 权限不足、配置不属于当前分析或更新失败时抛出异常
   */
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
   * 更新分析图表及其配置（会自动创建新的配置版本）
   * @param {AnalyzeDto.UpdateAnalyzeRequest} updateRequest 更新请求参数
   * @returns {Promise<AnalyzeVo.AnalyzeDetailResponse>} 更新后的分析详情数据
   * @throws {Error} 权限不足或保存失败时抛出异常
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
   * 创建分析图表
   * @param {AnalyzeDto.CreateAnalyzeRequest} createRequest 创建分析请求参数
   * @returns {Promise<AnalyzeVo.AnalyzeDetailResponse>} 创建后的分析详情数据
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
   * 更新分析图表的名称
   * @param {AnalyzeDto.UpdateAnalyzeNameRequest} updateRequest 更新名称请求参数
   * @returns {Promise<boolean>} 是否更新成功
   * @throws {Error} 权限不足时抛出异常
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
   * 更新分析图表的描述信息
   * @param {AnalyzeDto.UpdateAnalyzeDescRequest} updateRequest 更新描述请求参数
   * @returns {Promise<boolean>} 是否更新成功
   * @throws {Error} 权限不足时抛出异常
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
