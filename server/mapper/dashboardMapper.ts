import type { IColumnTarget, Row } from '@/server/mapper/baseMapper'
import { BaseMapper, Column, Mapping, entityColumnsMap, mapToTarget } from '@/server/mapper/baseMapper'
import { convertToSqlProperties } from '@/server/utils/databaseHelper'
import type { ResultSetHeader } from 'mysql2'

const DASHBOARD_TABLE_NAME = '`dashboard`'
const DASHBOARD_WIDGET_TABLE_NAME = '`dashboard_widget`'
const DATA_SOURCE_NAME = 'data_middle_station'

const DASHBOARD_FIELDS = [
  'id',
  'dashboard_name',
  'dashboard_desc',
  'layout_config',
  'create_time',
  'update_time',
  'created_by',
  'updated_by',
  'is_deleted'
]

const DASHBOARD_LIST_SORT_FIELD_MAP: Record<DashboardDao.DashboardListSortField, string> = {
  dashboardName: 'd.dashboard_name',
  createTime: 'd.create_time',
  updateTime: 'd.update_time'
}

export class DashboardMapping implements DashboardDao.DashboardRecord, IColumnTarget {
  columnsMapper(data: Array<Row> | Row): Array<Row> | Row {
    return mapToTarget(this, data, entityColumnsMap.get(this.constructor))
  }

  @Column('id')
  id!: number

  @Column('dashboard_name')
  dashboardName!: string

  @Column('dashboard_desc')
  dashboardDesc!: string

  @Column('layout_config')
  layoutConfig(value: string | DashboardDao.LayoutConfig | null): DashboardDao.LayoutConfig {
    if (!value) return { columnCount: 12, rowHeight: 120 }
    if (typeof value === 'string') return JSON.parse(value)
    return value
  }

  @Column('create_time')
  createTime!: string

  @Column('update_time')
  updateTime!: string

  @Column('created_by')
  createdBy!: string

  @Column('updated_by')
  updatedBy!: string

  @Column('is_deleted')
  isDeleted!: number | null
}

export class DashboardWidgetMapping implements DashboardDao.DashboardWidgetRecord, IColumnTarget {
  columnsMapper(data: Array<Row> | Row): Array<Row> | Row {
    return mapToTarget(this, data, entityColumnsMap.get(this.constructor))
  }

  @Column('id')
  id!: number

  @Column('dashboard_id')
  dashboardId!: number

  @Column('analyze_id')
  analyzeId!: number

  @Column('widget_title')
  widgetTitle!: string

  @Column('x')
  x!: number

  @Column('y')
  y!: number

  @Column('w')
  w!: number

  @Column('h')
  h!: number

  @Column('chart_type')
  chartType!: AnalyzeStore.ChartType

  @Column('refresh_interval')
  refreshInterval!: number

  @Column('widget_config')
  widgetConfig(value: string | DashboardDao.WidgetConfig | null): DashboardDao.WidgetConfig {
    if (!value) return {}
    if (typeof value === 'string') return JSON.parse(value)
    return value
  }

  @Column('create_time')
  createTime!: string

  @Column('update_time')
  updateTime!: string

  @Column('created_by')
  createdBy!: string

  @Column('updated_by')
  updatedBy!: string

  @Column('is_deleted')
  isDeleted!: number | null
}

export class DashboardListMapping implements DashboardVo.DashboardListItem, IColumnTarget {
  columnsMapper(data: Array<Row> | Row): Array<Row> | Row {
    return mapToTarget(this, data, entityColumnsMap.get(this.constructor))
  }

  @Column('id')
  id!: number

  @Column('dashboard_name')
  dashboardName!: string

  @Column('dashboard_desc')
  dashboardDesc!: string

  @Column('create_time')
  createTime!: string

  @Column('update_time')
  updateTime!: string

  @Column('created_by')
  createdBy!: string

  @Column('updated_by')
  updatedBy!: string

  @Column('widget_count')
  widgetCount!: number

  @Column('dashboard_permission')
  dashboardPermission!: PermissionVo.ResourcePermissionType
}

export class DashboardMapper extends BaseMapper {
  public dataSourceName = DATA_SOURCE_NAME

  public override async exe<T>(sql: string, params?: Array<any>): Promise<T> {
    return await super.exe<T>(sql, params)
  }

  public async createDashboard(createParams: DashboardDao.CreateDashboardParams): Promise<number> {
    const { keys, values } = convertToSqlProperties(createParams)
    const sql = `insert into ${DASHBOARD_TABLE_NAME} (${keys.join(',')}) values (${keys.map(() => '?').join(',')})`
    const result = await this.exe<ResultSetHeader>(sql, values)
    return result.insertId
  }

  public async updateDashboard(updateParams: DashboardDao.UpdateDashboardParams): Promise<boolean> {
    const { keys, values } = convertToSqlProperties(updateParams)
    const setClause = keys.map((key) => `${key} = ?`).join(', ')
    const sql = `update ${DASHBOARD_TABLE_NAME} set ${setClause} where id = ? and is_deleted = 0`
    const result = await this.exe<ResultSetHeader>(sql, [...values, updateParams.id])
    return result.affectedRows > 0
  }

  public async deleteDashboard(deleteParams: DashboardDao.DeleteDashboardParams): Promise<boolean> {
    const sql = `update ${DASHBOARD_TABLE_NAME} set is_deleted = 1, updated_by = ?, update_time = ? where id = ? and is_deleted = 0`
    const result = await this.exe<ResultSetHeader>(sql, [
      deleteParams.updatedBy,
      deleteParams.updateTime,
      deleteParams.id
    ])
    return result.affectedRows > 0
  }

  @Mapping(DashboardMapping)
  public async getDashboard<T extends DashboardDao.DashboardRecord = DashboardDao.DashboardRecord>(
    query: DashboardDao.GetDashboardParams
  ): Promise<T> {
    const { whereClause, params } = this.buildDashboardAccessQuery(query)
    const sql = `
      select ${DASHBOARD_FIELDS.join(',\n        ')}
      from ${DASHBOARD_TABLE_NAME} d
      ${whereClause}`
    const result = await this.exe<Array<T>>(sql, params)
    return result?.[0]
  }

  @Mapping(DashboardMapping)
  public async getDashboardWithoutAccess<T extends DashboardDao.DashboardRecord = DashboardDao.DashboardRecord>(
    id: number
  ): Promise<T> {
    const sql = `
      select ${DASHBOARD_FIELDS.join(',\n        ')}
      from ${DASHBOARD_TABLE_NAME} d
      where d.id = ? and d.is_deleted = 0`
    const result = await this.exe<Array<T>>(sql, [id])
    return result?.[0]
  }

  public async countDashboards(query: DashboardDao.GetDashboardListParams): Promise<number> {
    const { whereClause, params } = this.buildDashboardListQuery(query)
    const sql = `
      select count(distinct d.id) as total
      from ${DASHBOARD_TABLE_NAME} d
      left join resource_role_permission rrp on rrp.resource_type = 'dashboard' and rrp.resource_id = d.id
      left join role r on r.id = rrp.role_id and r.is_deleted = 0 and r.status = 1
      ${whereClause}`
    const result = await this.exe<Array<{ total: number }>>(sql, params)
    return Number(result?.[0]?.total || 0)
  }

  @Mapping(DashboardListMapping)
  public async getDashboardList<T extends DashboardVo.DashboardListItem = DashboardVo.DashboardListItem>(
    query: DashboardDao.GetDashboardListParams
  ): Promise<Array<T>> {
    const { whereClause, params, permissionSelectSql } = this.buildDashboardListQuery(query)
    const sortField = DASHBOARD_LIST_SORT_FIELD_MAP[query.sortField] || DASHBOARD_LIST_SORT_FIELD_MAP.updateTime
    const sortOrder = query.sortOrder === 'asc' ? 'ASC' : 'DESC'
    const page = Math.max(1, Math.floor(query.page))
    const pageSize = Math.max(1, Math.floor(query.pageSize))
    const offset = (page - 1) * pageSize
    const sql = `
      select
        d.id,
        d.dashboard_name,
        d.dashboard_desc,
        d.create_time,
        d.update_time,
        d.created_by,
        d.updated_by,
        count(distinct dw.id) as widget_count,
        ${permissionSelectSql} as dashboard_permission
      from ${DASHBOARD_TABLE_NAME} d
      left join ${DASHBOARD_WIDGET_TABLE_NAME} dw on dw.dashboard_id = d.id and dw.is_deleted = 0
      left join resource_role_permission rrp on rrp.resource_type = 'dashboard' and rrp.resource_id = d.id
      left join role r on r.id = rrp.role_id and r.is_deleted = 0 and r.status = 1
      ${whereClause}
      group by d.id, d.dashboard_name, d.dashboard_desc, d.create_time, d.update_time, d.created_by, d.updated_by
      order by ${sortField} ${sortOrder}
      limit ? offset ?`
    return await this.exe<Array<T>>(sql, [...params, pageSize, offset])
  }

  @Mapping(DashboardWidgetMapping)
  public async getDashboardWidgets<T extends DashboardDao.DashboardWidgetRecord = DashboardDao.DashboardWidgetRecord>(
    dashboardId: number
  ): Promise<Array<T>> {
    const sql = `
      select
        id,
        dashboard_id,
        analyze_id,
        widget_title,
        x,
        y,
        w,
        h,
        chart_type,
        refresh_interval,
        widget_config,
        create_time,
        update_time,
        created_by,
        updated_by,
        is_deleted
      from ${DASHBOARD_WIDGET_TABLE_NAME}
      where dashboard_id = ? and is_deleted = 0
      order by y asc, x asc, id asc`
    return await this.exe<Array<T>>(sql, [dashboardId])
  }

  public async replaceDashboardWidgets(replaceParams: DashboardDao.ReplaceDashboardWidgetParams): Promise<boolean> {
    const softDeleteSql = `
      update ${DASHBOARD_WIDGET_TABLE_NAME}
      set is_deleted = 1, updated_by = ?, update_time = ?
      where dashboard_id = ? and is_deleted = 0`
    await this.exe<ResultSetHeader>(softDeleteSql, [
      replaceParams.updatedBy,
      replaceParams.updateTime,
      replaceParams.dashboardId
    ])

    if (replaceParams.widgets.length === 0) {
      return true
    }

    const insertSql = `
      insert into ${DASHBOARD_WIDGET_TABLE_NAME}
        (
          dashboard_id,
          analyze_id,
          widget_title,
          x,
          y,
          w,
          h,
          chart_type,
          refresh_interval,
          widget_config,
          created_by,
          updated_by,
          create_time,
          update_time
        )
      values ${replaceParams.widgets.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ')}`
    const values = replaceParams.widgets.flatMap((widget) => [
      replaceParams.dashboardId,
      widget.analyzeId,
      widget.widgetTitle,
      widget.x,
      widget.y,
      widget.w,
      widget.h,
      widget.chartType,
      widget.refreshInterval,
      JSON.stringify(widget.widgetConfig || {}),
      replaceParams.createdBy,
      replaceParams.updatedBy,
      replaceParams.createTime,
      replaceParams.updateTime
    ])
    const result = await this.exe<ResultSetHeader>(insertSql, values)
    return result.affectedRows > 0
  }

  private buildDashboardAccessQuery(query: DashboardDao.GetDashboardParams) {
    const whereConditions = ['d.id = ?', 'd.is_deleted = 0']
    const params: Array<string | number> = [query.id]
    if (!query.roleCodes?.includes('admin')) {
      if (query.roleCodes?.length) {
        whereConditions.push(`(
          d.created_by = ?
          or exists (
            select 1
            from resource_role_permission rrp
            inner join role r on r.id = rrp.role_id and r.is_deleted = 0 and r.status = 1
            where rrp.resource_type = 'dashboard'
              and rrp.resource_id = d.id
              and r.role_code in (${query.roleCodes.map(() => '?').join(',')})
          )
        )`)
        params.push(query.currentUserName || '', ...query.roleCodes)
      } else {
        whereConditions.push('d.created_by = ?')
        params.push(query.currentUserName || '')
      }
    }
    return {
      whereClause: `where ${whereConditions.join(' and ')}`,
      params
    }
  }

  private buildDashboardListQuery(query: DashboardDao.GetDashboardListParams) {
    const roleCodes = query.roleCodes || []
    const isAdmin = roleCodes.includes('admin')
    const whereConditions = ['d.is_deleted = 0']
    const params: string[] = []

    if (query.keyword?.trim()) {
      whereConditions.push('(d.dashboard_name like ? or d.dashboard_desc like ?)')
      const normalizedKeyword = `%${query.keyword.trim()}%`
      params.push(normalizedKeyword, normalizedKeyword)
    }

    if (!isAdmin) {
      if (roleCodes.length > 0) {
        whereConditions.push(`(d.created_by = ? or r.role_code in (${roleCodes.map(() => '?').join(',')}))`)
        params.push(query.currentUserName || '', ...roleCodes)
      } else {
        whereConditions.push('d.created_by = ?')
        params.push(query.currentUserName || '')
      }
    }

    return {
      whereClause: `where ${whereConditions.join(' and ')}`,
      params,
      permissionSelectSql: isAdmin
        ? `'manage'`
        : `case
            when d.created_by = ${this.escapeValue(query.currentUserName || '')} then 'manage'
            when max(case rrp.permission_type when 'manage' then 3 when 'edit' then 2 when 'view' then 1 else 0 end) = 3 then 'manage'
            when max(case rrp.permission_type when 'manage' then 3 when 'edit' then 2 when 'view' then 1 else 0 end) = 2 then 'edit'
            when max(case rrp.permission_type when 'manage' then 3 when 'edit' then 2 when 'view' then 1 else 0 end) = 1 then 'view'
            else 'none'
          end`
    }
  }

  private escapeValue(value: string) {
    return `'${value.replace(/'/g, "''")}'`
  }
}
