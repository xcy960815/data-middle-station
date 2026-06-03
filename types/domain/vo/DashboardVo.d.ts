/**
 * @desc 看板响应
 */
declare namespace DashboardVo {
  type DashboardWidgetItem = DashboardDao.DashboardWidgetConfigItem & {
    id: number
    dashboardId: number
    createTime: string
    updateTime: string
    createdBy: string
    updatedBy: string
    isDeleted: number | null
    analyze: AnalyzeVo.AnalyzeDetailResponse | null
  }

  type DashboardDetailResponse = DashboardDao.DashboardRecord & {
    layoutConfig: DashboardDao.LayoutConfig
    widgets: DashboardWidgetItem[]
    dashboardPermission?: PermissionVo.ResourcePermissionType
  }

  type DashboardConfigHistoryItem = DashboardDao.DashboardConfigRecord & {
    widgetCount: number
  }

  type DashboardListItem = Pick<
    DashboardDao.DashboardRecord,
    'id' | 'dashboardName' | 'dashboardDesc' | 'createTime' | 'updateTime' | 'createdBy' | 'updatedBy'
  > & {
    widgetCount: number
    dashboardPermission?: PermissionVo.ResourcePermissionType
  }

  type DashboardListResponse = {
    list: DashboardListItem[]
    total: number
    page: number
    pageSize: number
    keyword: string
    sortField: DashboardDao.DashboardListSortField
    sortOrder: DashboardDao.DashboardListSortOrder
  }
}
