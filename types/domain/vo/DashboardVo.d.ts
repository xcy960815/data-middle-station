/**
 * @desc 看板响应
 */
declare namespace DashboardVo {
  type DashboardWidgetItem = DashboardDao.DashboardWidgetRecord & {
    analyze: AnalyzeVo.AnalyzeDetailResponse | null
  }

  type DashboardDetailResponse = DashboardDao.DashboardRecord & {
    widgets: DashboardWidgetItem[]
    dashboardPermission?: PermissionVo.ResourcePermissionType
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
