import type { IColumnTarget, Row } from '@/server/mapper/baseMapper'
import { BaseMapper, Column, Mapping, entityColumnsMap, mapToTarget } from '@/server/mapper/baseMapper'
import { convertToSqlProperties } from '@/server/utils/databaseHelper'
import type { ResultSetHeader } from 'mysql2'

const DASHBOARD_TABLE_NAME = '`dashboard`'
const DASHBOARD_CONFIG_TABLE_NAME = '`dashboard_config`'
const DATA_SOURCE_NAME = 'data_middle_station'

const DASHBOARD_FIELDS = [
  'id',
  'dashboard_name',
  'dashboard_desc',
  'current_config_id',
  'create_time',
  'update_time',
  'created_by',
  'updated_by',
  'is_deleted'
]

const DASHBOARD_CONFIG_FIELDS = [
  'id',
  'dashboard_id',
  'version_no',
  'layout_config',
  'widgets_config',
  'change_note',
  'create_time',
  'created_by',
  'update_time',
  'is_deleted'
]

const DASHBOARD_LIST_SORT_FIELD_MAP: Record<DashboardDao.DashboardListSortField, string> = {
  dashboardName: 'd.dashboard_name',
  createTime: 'd.create_time',
  updateTime: 'd.update_time'
}

const DEFAULT_LAYOUT_CONFIG: DashboardDao.LayoutConfig = {
  columnCount: 24,
  rowHeight: 60
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

  @Column('current_config_id')
  currentConfigId!: number | null

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

class DashboardConfigMapping implements DashboardDao.DashboardConfigRecord, IColumnTarget {
  columnsMapper(data: Array<Row> | Row): Array<Row> | Row {
    return mapToTarget(this, data, entityColumnsMap.get(this.constructor))
  }

  @Column('id')
  id!: number

  @Column('dashboard_id')
  dashboardId!: number

  @Column('version_no')
  versionNo!: number

  @Column('layout_config')
  layoutConfig(value: string | DashboardDao.LayoutConfig | null): DashboardDao.LayoutConfig {
    if (!value) return DEFAULT_LAYOUT_CONFIG
    if (typeof value === 'string') return JSON.parse(value)
    return value
  }

  @Column('widgets_config')
  widgetsConfig(
    value: string | DashboardDao.DashboardWidgetConfigItem[] | null
  ): DashboardDao.DashboardWidgetConfigItem[] {
    if (!value) return []
    if (typeof value === 'string') return JSON.parse(value)
    return value
  }

  @Column('change_note')
  changeNote!: string | null

  @Column('create_time')
  createTime!: string

  @Column('created_by')
  createdBy!: string

  @Column('update_time')
  updateTime!: string

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

  @Mapping(DashboardConfigMapping)
  public async getDashboardConfig<T extends DashboardDao.DashboardConfigRecord = DashboardDao.DashboardConfigRecord>(
    query: DashboardDao.GetDashboardConfigParams
  ): Promise<T> {
    const { keys, values } = convertToSqlProperties(query)
    const whereClauses: string[] = []
    const queryValues: any[] = []

    keys.forEach((key, index) => {
      if (DASHBOARD_CONFIG_FIELDS.includes(key)) {
        whereClauses.push(`${key} = ?`)
        queryValues.push(values[index])
      }
    })

    if (!keys.includes('is_deleted')) {
      whereClauses.push('is_deleted = 0')
    }

    const sql = `
      select ${DASHBOARD_CONFIG_FIELDS.join(',\n        ')}
      from ${DASHBOARD_CONFIG_TABLE_NAME}
      where ${whereClauses.join(' and ')}`
    const result = await this.exe<Array<T>>(sql, queryValues)
    return result?.[0]
  }

  public async getNextVersionNo(dashboardId: number): Promise<number> {
    const sql = `
      select coalesce(max(version_no), 0) + 1 as nextVersionNo
      from ${DASHBOARD_CONFIG_TABLE_NAME}
      where dashboard_id = ?`
    const result = await this.exe<Array<{ nextVersionNo: number }>>(sql, [dashboardId])
    return Number(result?.[0]?.nextVersionNo || 1)
  }

  public async createDashboardConfig(createParams: DashboardDao.CreateDashboardConfigParams): Promise<number> {
    const { keys, values } = convertToSqlProperties({
      ...createParams,
      layoutConfig: JSON.stringify(createParams.layoutConfig || DEFAULT_LAYOUT_CONFIG),
      widgetsConfig: JSON.stringify(createParams.widgetsConfig || [])
    })
    const sql = `insert into ${DASHBOARD_CONFIG_TABLE_NAME} (${keys.join(',')}) values (${keys.map(() => '?').join(',')})`
    const result = await this.exe<ResultSetHeader>(sql, values)
    return result.insertId
  }

  public async countDashboards(query: DashboardDao.GetDashboardListParams): Promise<number> {
    const { whereClause, params } = this.buildDashboardListQuery(query)
    const sql = `
      select count(distinct d.id) as total
      from ${DASHBOARD_TABLE_NAME} d
      left join ${DASHBOARD_CONFIG_TABLE_NAME} dc on dc.id = d.current_config_id and dc.is_deleted = 0
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
        json_length(coalesce(dc.widgets_config, json_array())) as widget_count,
        ${permissionSelectSql} as dashboard_permission
      from ${DASHBOARD_TABLE_NAME} d
      left join ${DASHBOARD_CONFIG_TABLE_NAME} dc on dc.id = d.current_config_id and dc.is_deleted = 0
      left join resource_role_permission rrp on rrp.resource_type = 'dashboard' and rrp.resource_id = d.id
      left join role r on r.id = rrp.role_id and r.is_deleted = 0 and r.status = 1
      ${whereClause}
      group by d.id, d.dashboard_name, d.dashboard_desc, d.create_time, d.update_time, d.created_by, d.updated_by, dc.widgets_config
      order by ${sortField} ${sortOrder}
      limit ? offset ?`
    return await this.exe<Array<T>>(sql, [...params, pageSize, offset])
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
