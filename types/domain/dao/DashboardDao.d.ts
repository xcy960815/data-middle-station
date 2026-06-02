/**
 * @desc 看板表结构
 */
declare namespace DashboardDao {
  type DashboardListSortField = 'dashboardName' | 'createTime' | 'updateTime'

  type DashboardListSortOrder = 'asc' | 'desc'

  type LayoutConfig = {
    columnCount: number
    rowHeight: number
  }

  type WidgetConfig = {
    refreshInterval?: number
    showHeader?: boolean
  }

  type DashboardRecord = {
    id: number
    dashboardName: string
    dashboardDesc: string
    layoutConfig: LayoutConfig
    createTime: string
    updateTime: string
    createdBy: string
    updatedBy: string
    isDeleted: number | null
  }

  type DashboardWidgetRecord = {
    id: number
    dashboardId: number
    analyzeId: number
    widgetTitle: string
    x: number
    y: number
    w: number
    h: number
    chartType: AnalyzeStore.ChartType
    refreshInterval: number
    widgetConfig: WidgetConfig
    createTime: string
    updateTime: string
    createdBy: string
    updatedBy: string
    isDeleted: number | null
  }

  type GetDashboardParams = Pick<DashboardRecord, 'id'> & {
    currentUserName?: string
    roleCodes?: string[]
  }

  type GetDashboardListParams = {
    page: number
    pageSize: number
    keyword?: string
    sortField: DashboardListSortField
    sortOrder: DashboardListSortOrder
    currentUserName?: string
    roleCodes?: string[]
  }

  type CreateDashboardParams = Pick<
    DashboardRecord,
    'dashboardName' | 'dashboardDesc' | 'layoutConfig' | 'createdBy' | 'updatedBy' | 'createTime' | 'updateTime'
  >

  type UpdateDashboardParams = Pick<DashboardRecord, 'id' | 'updatedBy' | 'updateTime'> &
    Partial<Pick<DashboardRecord, 'dashboardName' | 'dashboardDesc' | 'layoutConfig'>>

  type DeleteDashboardParams = Pick<DashboardRecord, 'id' | 'updatedBy' | 'updateTime'>

  type ReplaceDashboardWidgetParams = Pick<DashboardWidgetRecord, 'dashboardId' | 'updatedBy' | 'updateTime'> & {
    widgets: Array<
      Pick<
        DashboardWidgetRecord,
        'analyzeId' | 'widgetTitle' | 'x' | 'y' | 'w' | 'h' | 'chartType' | 'refreshInterval' | 'widgetConfig'
      >
    >
    createdBy: string
    createTime: string
  }
}
