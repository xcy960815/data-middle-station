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

  type DashboardWidgetConfigItem = {
    analyzeId: number
    widgetTitle: string
    x: number
    y: number
    w: number
    h: number
    chartType: AnalyzeStore.ChartType
    refreshInterval: number
    widgetConfig: WidgetConfig
  }

  type DashboardRecord = {
    id: number
    dashboardName: string
    dashboardDesc: string
    currentConfigId: number | null
    createTime: string
    updateTime: string
    createdBy: string
    updatedBy: string
    isDeleted: number | null
  }

  type DashboardConfigRecord = {
    id: number
    dashboardId: number
    versionNo: number
    layoutConfig: LayoutConfig
    widgetsConfig: DashboardWidgetConfigItem[]
    changeNote: string | null
    createTime: string
    createdBy: string
    updateTime: string
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
    'dashboardName' | 'dashboardDesc' | 'currentConfigId' | 'createdBy' | 'updatedBy' | 'createTime' | 'updateTime'
  >

  type UpdateDashboardParams = Pick<DashboardRecord, 'id' | 'updatedBy' | 'updateTime'> &
    Partial<Pick<DashboardRecord, 'dashboardName' | 'dashboardDesc' | 'currentConfigId'>>

  type DeleteDashboardParams = Pick<DashboardRecord, 'id' | 'updatedBy' | 'updateTime'>

  type GetDashboardConfigParams = Partial<Pick<DashboardConfigRecord, 'id' | 'dashboardId' | 'versionNo' | 'isDeleted'>>

  type CreateDashboardConfigParams = Pick<
    DashboardConfigRecord,
    | 'dashboardId'
    | 'versionNo'
    | 'layoutConfig'
    | 'widgetsConfig'
    | 'changeNote'
    | 'createdBy'
    | 'updateTime'
    | 'createTime'
  >

  type DeleteDashboardConfigsParams = Pick<DashboardConfigRecord, 'dashboardId' | 'updateTime'> & {
    updatedBy: string
  }
}
