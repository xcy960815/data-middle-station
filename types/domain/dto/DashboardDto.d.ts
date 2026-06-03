/**
 * @desc 看板请求
 */
declare namespace DashboardDto {
  type DashboardListSortField = DashboardDao.DashboardListSortField

  type DashboardListSortOrder = DashboardDao.DashboardListSortOrder

  type DashboardWidgetPayload = Pick<
    DashboardDao.DashboardWidgetConfigItem,
    'analyzeId' | 'widgetTitle' | 'x' | 'y' | 'w' | 'h' | 'chartType' | 'refreshInterval' | 'widgetConfig'
  >

  type GetDashboardRequest = Pick<DashboardDao.DashboardRecord, 'id'>

  type GetDashboardListRequest = {
    page?: number
    pageSize?: number
    keyword?: string
    sortField?: DashboardListSortField
    sortOrder?: DashboardListSortOrder
  }

  type CreateDashboardRequest = Pick<DashboardDao.DashboardRecord, 'dashboardName' | 'dashboardDesc'> & {
    layoutConfig?: DashboardDao.LayoutConfig
    widgets?: DashboardWidgetPayload[]
  }

  type UpdateDashboardRequest = Pick<DashboardDao.DashboardRecord, 'id'> &
    Partial<Pick<DashboardDao.DashboardRecord, 'dashboardName' | 'dashboardDesc'>> & {
      currentConfigId?: number | null
      layoutConfig?: DashboardDao.LayoutConfig
      widgets?: DashboardWidgetPayload[]
    }

  type DeleteDashboardRequest = Pick<DashboardDao.DashboardRecord, 'id'>
}
