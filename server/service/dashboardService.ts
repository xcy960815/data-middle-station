import { AnalyzeService } from '@/server/service/analyzeService'
import { BaseService } from '@/server/service/baseService'
import { DashboardMapper } from '@/server/mapper/dashboardMapper'
import { ResourcePermissionService } from '@/server/service/resourcePermissionService'

/**
 * 默认看板布局配置
 * @type {DashboardDao.LayoutConfig}
 */
const DEFAULT_LAYOUT_CONFIG: DashboardDao.LayoutConfig = {
  columnCount: 24,
  rowHeight: 60
}

/**
 * 看板组件最小宽度
 * @type {number}
 */
const MIN_WIDGET_WIDTH = 1

/**
 * 看板组件最小高度
 * @type {number}
 */
const MIN_WIDGET_HEIGHT = 1

/**
 * 看板服务，负责看板的 CRUD 业务编排、布局/组件配置版本控制以及组件关联的数据查询与组装
 */
export class DashboardService extends BaseService {
  /**
   * 看板数据访问映射器
   * @private
   * @type {DashboardMapper}
   */
  private dashboardMapper: DashboardMapper

  /**
   * 分析服务
   * @private
   * @type {AnalyzeService}
   */
  private analyzeService: AnalyzeService

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
    this.dashboardMapper = new DashboardMapper()
    this.analyzeService = new AnalyzeService()
    this.resourcePermissionService = new ResourcePermissionService()
  }

  /**
   * 解析并组装看板中的所有组件，关联对应的分析图表数据
   * @private
   * @param {DashboardDao.DashboardRecord} dashboardRecord DAO 层的看板记录
   * @param {DashboardDao.DashboardConfigRecord | null} dashboardConfig 关联的看板配置记录
   * @returns {Promise<DashboardVo.DashboardWidgetItem[]>} 组装后的看板组件列表
   */
  private async resolveDashboardWidgets(
    dashboardRecord: DashboardDao.DashboardRecord,
    dashboardConfig: DashboardDao.DashboardConfigRecord | null
  ): Promise<DashboardVo.DashboardWidgetItem[]> {
    const widgetConfigs = dashboardConfig?.widgetsConfig || []
    const resolvedWidgets = await Promise.all(
      widgetConfigs.map(async (widgetConfig, index) => {
        try {
          const analyze = await this.analyzeService.getAnalyze({ id: widgetConfig.analyzeId })
          return {
            id: index + 1,
            dashboardId: dashboardRecord.id,
            ...widgetConfig,
            createTime: dashboardConfig?.createTime || dashboardRecord.createTime,
            updateTime: dashboardConfig?.updateTime || dashboardRecord.updateTime,
            createdBy: dashboardConfig?.createdBy || dashboardRecord.createdBy,
            updatedBy: dashboardRecord.updatedBy,
            isDeleted: 0,
            analyze
          }
        } catch (_error) {
          return {
            id: index + 1,
            dashboardId: dashboardRecord.id,
            ...widgetConfig,
            createTime: dashboardConfig?.createTime || dashboardRecord.createTime,
            updateTime: dashboardConfig?.updateTime || dashboardRecord.updateTime,
            createdBy: dashboardConfig?.createdBy || dashboardRecord.createdBy,
            updatedBy: dashboardRecord.updatedBy,
            isDeleted: 0,
            analyze: null
          }
        }
      })
    )

    return resolvedWidgets
  }

  /**
   * 获取看板列表（分页）
   * @param {DashboardDto.GetDashboardListRequest} [queryRequest={}] 看板分页查询参数
   * @returns {Promise<DashboardVo.DashboardListResponse>} 看板列表及分页信息响应数据
   */
  public async getDashboards(
    queryRequest: DashboardDto.GetDashboardListRequest = {}
  ): Promise<DashboardVo.DashboardListResponse> {
    const currentUser = this.getCurrentUser()
    const normalizedQueryParams: DashboardDao.GetDashboardListParams = {
      page: Math.max(1, Math.floor(Number(queryRequest.page || 1))),
      pageSize: Math.min(100, Math.max(1, Math.floor(Number(queryRequest.pageSize || 12)))),
      keyword: queryRequest.keyword?.trim() || '',
      sortField: queryRequest.sortField || 'updateTime',
      sortOrder: queryRequest.sortOrder || 'desc',
      currentUserName: currentUser?.userName,
      roleCodes: currentUser?.roleCodes || []
    }

    const [total, list] = await Promise.all([
      this.dashboardMapper.countDashboards(normalizedQueryParams),
      this.dashboardMapper.getDashboardList(normalizedQueryParams)
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
   * 获取单个看板详情，包含组件列表、布局配置以及当前用户的权限标识
   * @param {DashboardDto.GetDashboardRequest} queryRequest 查询参数，包含看板 ID
   * @returns {Promise<DashboardVo.DashboardDetailResponse>} 看板详情响应数据
   * @throws {Error} 看板不存在、无权访问或查询失败时抛出异常
   */
  public async getDashboard(
    queryRequest: DashboardDto.GetDashboardRequest
  ): Promise<DashboardVo.DashboardDetailResponse> {
    const currentUser = this.getCurrentUser()
    await this.resourcePermissionService.assertResourcePermission({
      resourceType: 'dashboard',
      resourceId: queryRequest.id,
      requiredPermission: 'view'
    })
    const dashboardRecord = await this.dashboardMapper.getDashboard({
      id: queryRequest.id,
      currentUserName: currentUser?.userName,
      roleCodes: currentUser?.roleCodes || []
    })
    if (!dashboardRecord) {
      throw new Error('看板不存在或无权访问')
    }

    const dashboardConfig = dashboardRecord.currentConfigId
      ? await this.dashboardMapper.getDashboardConfig({ id: dashboardRecord.currentConfigId })
      : null
    const resolvedWidgets = await this.resolveDashboardWidgets(dashboardRecord, dashboardConfig)

    return {
      ...dashboardRecord,
      layoutConfig: dashboardConfig?.layoutConfig || DEFAULT_LAYOUT_CONFIG,
      dashboardPermission: currentUser
        ? await this.resourcePermissionService.getCurrentUserResourcePermission(
            'dashboard',
            dashboardRecord.id,
            currentUser.userName,
            currentUser.roleCodes || []
          )
        : 'manage',
      widgets: resolvedWidgets
    }
  }

  /**
   * 获取看板配置历史
   * @param {DashboardDto.GetDashboardConfigHistoryRequest} queryRequest 查询参数，包含看板 ID
   * @returns {Promise<DashboardVo.DashboardConfigHistoryItem[]>} 看板配置版本历史列表
   * @throws {Error} 权限校验不通过时抛出异常
   */
  public async getDashboardConfigHistory(
    queryRequest: DashboardDto.GetDashboardConfigHistoryRequest
  ): Promise<DashboardVo.DashboardConfigHistoryItem[]> {
    await this.resourcePermissionService.assertResourcePermission({
      resourceType: 'dashboard',
      resourceId: queryRequest.dashboardId,
      requiredPermission: 'view'
    })
    return await this.dashboardMapper.getDashboardConfigHistory(queryRequest.dashboardId)
  }

  /**
   * 创建看板，并初始化看板的配置版本
   * @param {DashboardDto.CreateDashboardRequest} createRequest 创建看板请求参数
   * @returns {Promise<DashboardVo.DashboardDetailResponse>} 创建后的看板详情数据
   */
  public async createDashboard(
    createRequest: DashboardDto.CreateDashboardRequest
  ): Promise<DashboardVo.DashboardDetailResponse> {
    const { createdBy, updatedBy, createTime, updateTime } = await this.getDefaultInfo()
    const dashboardId = await this.dashboardMapper.createDashboard({
      dashboardName: createRequest.dashboardName,
      dashboardDesc: createRequest.dashboardDesc || '',
      currentConfigId: null,
      createdBy,
      updatedBy,
      createTime,
      updateTime
    })

    const configId = await this.dashboardMapper.createDashboardConfig({
      dashboardId,
      versionNo: 1,
      layoutConfig: createRequest.layoutConfig || DEFAULT_LAYOUT_CONFIG,
      widgetsConfig: this.normalizeWidgets(createRequest.widgets || []),
      changeNote: null,
      createdBy,
      createTime,
      updateTime
    })
    await this.dashboardMapper.updateDashboard({
      id: dashboardId,
      currentConfigId: configId,
      updatedBy,
      updateTime
    })

    return await this.getDashboard({ id: dashboardId })
  }

  /**
   * 更新看板（包含看板属性以及新的布局/组件配置，会自动产生新的配置版本）
   * @param {DashboardDto.UpdateDashboardRequest} updateRequest 更新请求参数
   * @returns {Promise<DashboardVo.DashboardDetailResponse>} 更新后的看板详情数据
   * @throws {Error} 权限不足或保存失败时抛出异常
   */
  public async updateDashboard(
    updateRequest: DashboardDto.UpdateDashboardRequest
  ): Promise<DashboardVo.DashboardDetailResponse> {
    await this.resourcePermissionService.assertResourcePermission({
      resourceType: 'dashboard',
      resourceId: updateRequest.id,
      requiredPermission: 'edit'
    })
    const currentDashboard = await this.getDashboard({ id: updateRequest.id })
    const { createdBy, updatedBy, createTime, updateTime } = await this.getDefaultInfo()
    const updateResult = await this.dashboardMapper.updateDashboard({
      id: updateRequest.id,
      dashboardName: updateRequest.dashboardName,
      dashboardDesc: updateRequest.dashboardDesc,
      updatedBy,
      updateTime
    })
    if (!updateResult) {
      throw new Error('保存看板失败')
    }

    const nextVersionNo = await this.dashboardMapper.getNextVersionNo(currentDashboard.id)
    const configId = await this.dashboardMapper.createDashboardConfig({
      dashboardId: currentDashboard.id,
      versionNo: nextVersionNo,
      layoutConfig: updateRequest.layoutConfig || currentDashboard.layoutConfig || DEFAULT_LAYOUT_CONFIG,
      widgetsConfig: this.normalizeWidgets(updateRequest.widgets || currentDashboard.widgets || []),
      changeNote: null,
      createdBy,
      createTime,
      updateTime
    })
    await this.dashboardMapper.updateDashboard({
      id: currentDashboard.id,
      currentConfigId: configId,
      updatedBy,
      updateTime
    })

    return await this.getDashboard({ id: updateRequest.id })
  }

  /**
   * 删除看板（逻辑删除）
   * @param {DashboardDto.DeleteDashboardRequest} deleteRequest 删除请求参数，包含看板 ID
   * @returns {Promise<boolean>} 是否删除成功
   * @throws {Error} 权限不足或看板不存在时抛出异常
   */
  public async deleteDashboard(deleteRequest: DashboardDto.DeleteDashboardRequest): Promise<boolean> {
    await this.resourcePermissionService.assertResourcePermission({
      resourceType: 'dashboard',
      resourceId: deleteRequest.id,
      requiredPermission: 'manage'
    })
    await this.getDashboard({ id: deleteRequest.id })
    const { updatedBy, updateTime } = await this.getDefaultInfo()
    return await this.dashboardMapper.deleteDashboard({
      id: deleteRequest.id,
      updatedBy,
      updateTime
    })
  }

  /**
   * 规范化并校验组件布局及属性参数，确保在栅格系统中的安全性
   * @private
   * @param {DashboardDto.DashboardWidgetPayload[]} widgets 前端上传的组件 payload 列表
   * @returns {DashboardDao.DashboardWidgetConfigItem[]} 规范化后的组件配置项列表
   */
  private normalizeWidgets(widgets: DashboardDto.DashboardWidgetPayload[]): DashboardDao.DashboardWidgetConfigItem[] {
    const columnCount = DEFAULT_LAYOUT_CONFIG.columnCount
    return widgets.map((widget) => {
      const w = Math.min(columnCount, Math.max(MIN_WIDGET_WIDTH, Math.floor(Number(widget.w || 4))))
      return {
        analyzeId: Number(widget.analyzeId),
        widgetTitle: widget.widgetTitle || '',
        x: Math.min(columnCount - w, Math.max(0, Math.floor(Number(widget.x || 0)))),
        y: Math.max(0, Math.floor(Number(widget.y || 0))),
        w,
        h: Math.max(MIN_WIDGET_HEIGHT, Math.floor(Number(widget.h || 3))),
        chartType: widget.chartType || 'table',
        refreshInterval: Math.max(0, Math.floor(Number(widget.refreshInterval || 0))),
        widgetConfig: widget.widgetConfig || {}
      }
    })
  }
}
