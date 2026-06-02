import { AnalyzeService } from '@/server/service/analyzeService'
import { BaseService } from '@/server/service/baseService'
import { DashboardMapper } from '@/server/mapper/dashboardMapper'
import { ResourcePermissionService } from '@/server/service/resourcePermissionService'

const DEFAULT_LAYOUT_CONFIG: DashboardDao.LayoutConfig = {
  columnCount: 12,
  rowHeight: 120
}

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

    const widgets = await this.dashboardMapper.getDashboardWidgets(dashboardRecord.id)
    const resolvedWidgets = await Promise.all(
      widgets.map(async (widget) => {
        try {
          const analyze = await this.analyzeService.getAnalyze({ id: widget.analyzeId })
          return {
            ...widget,
            analyze
          }
        } catch (_error) {
          return {
            ...widget,
            analyze: null
          }
        }
      })
    )

    return {
      ...dashboardRecord,
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

  public async createDashboard(
    createRequest: DashboardDto.CreateDashboardRequest
  ): Promise<DashboardVo.DashboardDetailResponse> {
    const { createdBy, updatedBy, createTime, updateTime } = await this.getDefaultInfo()
    const dashboardId = await this.dashboardMapper.createDashboard({
      dashboardName: createRequest.dashboardName,
      dashboardDesc: createRequest.dashboardDesc || '',
      layoutConfig: createRequest.layoutConfig || DEFAULT_LAYOUT_CONFIG,
      createdBy,
      updatedBy,
      createTime,
      updateTime
    })

    if (createRequest.widgets?.length) {
      await this.dashboardMapper.replaceDashboardWidgets({
        dashboardId,
        widgets: this.normalizeWidgets(createRequest.widgets),
        createdBy,
        updatedBy,
        createTime,
        updateTime
      })
    }

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
      layoutConfig: updateRequest.layoutConfig,
      updatedBy,
      updateTime
    })
    if (!updateResult) {
      throw new Error('保存看板失败')
    }

    if (updateRequest.widgets) {
      await this.dashboardMapper.replaceDashboardWidgets({
        dashboardId: currentDashboard.id,
        widgets: this.normalizeWidgets(updateRequest.widgets),
        createdBy,
        updatedBy,
        createTime,
        updateTime
      })
    }

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

  private normalizeWidgets(
    widgets: DashboardDto.DashboardWidgetPayload[]
  ): DashboardDao.ReplaceDashboardWidgetParams['widgets'] {
    return widgets.map((widget) => ({
      analyzeId: Number(widget.analyzeId),
      widgetTitle: widget.widgetTitle || '',
      x: Math.max(0, Math.floor(Number(widget.x || 0))),
      y: Math.max(0, Math.floor(Number(widget.y || 0))),
      w: Math.min(12, Math.max(1, Math.floor(Number(widget.w || 4)))),
      h: Math.max(1, Math.floor(Number(widget.h || 3))),
      chartType: widget.chartType || 'table',
      refreshInterval: Math.max(0, Math.floor(Number(widget.refreshInterval || 0))),
      widgetConfig: widget.widgetConfig || {}
    }))
  }
}
