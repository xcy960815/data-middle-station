import { AnalyzeService } from '@/server/service/analyzeService'
import { BaseService } from '@/server/service/baseService'
import { DashboardMapper } from '@/server/mapper/dashboardMapper'
import { ResourcePermissionService } from '@/server/service/resourcePermissionService'

const DEFAULT_LAYOUT_CONFIG: DashboardDao.LayoutConfig = {
  columnCount: 24,
  rowHeight: 60
}
const MIN_WIDGET_WIDTH = 1
const MIN_WIDGET_HEIGHT = 1

export class DashboardService extends BaseService {
  private dashboardMapper: DashboardMapper
  private analyzeService: AnalyzeService
  private resourcePermissionService: ResourcePermissionService

  constructor() {
    super()
    this.dashboardMapper = new DashboardMapper()
    this.analyzeService = new AnalyzeService()
    this.resourcePermissionService = new ResourcePermissionService()
  }

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
