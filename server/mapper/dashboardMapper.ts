import type { IColumnTarget, Row } from '@/server/mapper/baseMapper'
import { BaseMapper, Column, Mapping, entityColumnsMap, mapToTarget } from '@/server/mapper/baseMapper'
import { convertToSqlProperties } from '@/server/utils/databaseHelper'
import type { ResultSetHeader } from 'mysql2'

/**
 * 看板基础信息表名
 */
const DASHBOARD_TABLE_NAME = '`dashboard`'

/**
 * 看板配置版本表名
 */
const DASHBOARD_CONFIG_TABLE_NAME = '`dashboard_config`'

/**
 * 看板数据源名称
 */
const DATA_SOURCE_NAME = 'data_middle_station'

/**
 * 看板基础信息表字段列表
 */
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

/**
 * 看板配置版本表字段列表
 */
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

/**
 * 看板列表排序字段与数据库列的映射字典
 */
const DASHBOARD_LIST_SORT_FIELD_MAP: Record<DashboardDao.DashboardListSortField, string> = {
  dashboardName: 'd.dashboard_name',
  createTime: 'd.create_time',
  updateTime: 'd.update_time'
}

/**
 * 默认看板布局配置
 */
const DEFAULT_LAYOUT_CONFIG: DashboardDao.LayoutConfig = {
  columnCount: 24,
  rowHeight: 60
}

/**
 * 看板实体属性与数据库列的映射类
 *
 * @implements {DashboardDao.DashboardRecord}
 * @implements {IColumnTarget}
 */
export class DashboardMapping implements DashboardDao.DashboardRecord, IColumnTarget {
  /**
   * 将数据库行数据映射为看板实体属性
   *
   * @param {Array<Row> | Row} data 数据库原始行数据
   * @returns {Array<Row> | Row} 映射后的数据
   */
  columnsMapper(data: Array<Row> | Row): Array<Row> | Row {
    return mapToTarget(this, data, entityColumnsMap.get(this.constructor))
  }

  /** 看板 ID */
  @Column('id')
  id!: number

  /** 看板名称 */
  @Column('dashboard_name')
  dashboardName!: string

  /** 看板描述 */
  @Column('dashboard_desc')
  dashboardDesc!: string

  /** 当前生效的配置版本 ID */
  @Column('current_config_id')
  currentConfigId!: number | null

  /** 创建时间 */
  @Column('create_time')
  createTime!: string

  /** 更新时间 */
  @Column('update_time')
  updateTime!: string

  /** 创建人 */
  @Column('created_by')
  createdBy!: string

  /** 更新人 */
  @Column('updated_by')
  updatedBy!: string

  /** 是否已删除 (1: 是, 0: 否) */
  @Column('is_deleted')
  isDeleted!: number | null
}

/**
 * 看板配置实体属性与数据库列的映射类
 *
 * @implements {DashboardDao.DashboardConfigRecord}
 * @implements {IColumnTarget}
 */
class DashboardConfigMapping implements DashboardDao.DashboardConfigRecord, IColumnTarget {
  /** 已映射的布局配置缓存 */
  private mappedLayoutConfig: DashboardDao.LayoutConfig = DEFAULT_LAYOUT_CONFIG
  /** 已映射的组件配置缓存 */
  private mappedWidgetsConfig: DashboardDao.DashboardWidgetConfigItem[] = []

  /**
   * 将数据库行数据映射为看板配置实体属性
   *
   * @param {Array<Row> | Row} data 数据库原始行数据
   * @returns {Array<Row> | Row} 映射后的数据
   */
  columnsMapper(data: Array<Row> | Row): Array<Row> | Row {
    return mapToTarget(this, data, entityColumnsMap.get(this.constructor))
  }

  /** 看板配置 ID */
  @Column('id')
  id!: number

  /** 看板 ID */
  @Column('dashboard_id')
  dashboardId!: number

  /** 版本号 */
  @Column('version_no')
  versionNo!: number

  /**
   * 获取布局配置
   *
   * @returns {DashboardDao.LayoutConfig} 布局配置对象
   */
  @Column('layout_config')
  get layoutConfig(): DashboardDao.LayoutConfig {
    return this.mappedLayoutConfig
  }

  /**
   * 设置并解析布局配置
   *
   * @param {string | DashboardDao.LayoutConfig | null} value 布局配置 JSON 字符串或对象
   */
  set layoutConfig(value: string | DashboardDao.LayoutConfig | null) {
    this.mappedLayoutConfig = !value ? DEFAULT_LAYOUT_CONFIG : typeof value === 'string' ? JSON.parse(value) : value
  }

  /**
   * 获取组件配置列表
   *
   * @returns {DashboardDao.DashboardWidgetConfigItem[]} 组件配置数组
   */
  @Column('widgets_config')
  get widgetsConfig(): DashboardDao.DashboardWidgetConfigItem[] {
    return this.mappedWidgetsConfig
  }

  /**
   * 设置并解析组件配置列表
   *
   * @param {string | DashboardDao.DashboardWidgetConfigItem[] | null} value 组件配置 JSON 字符串或数组
   */
  set widgetsConfig(value: string | DashboardDao.DashboardWidgetConfigItem[] | null) {
    this.mappedWidgetsConfig = !value ? [] : typeof value === 'string' ? JSON.parse(value) : value
  }

  /** 变更说明 */
  @Column('change_note')
  changeNote!: string | null

  /** 创建时间 */
  @Column('create_time')
  createTime!: string

  /** 创建人 */
  @Column('created_by')
  createdBy!: string

  /** 更新时间 */
  @Column('update_time')
  updateTime!: string

  /** 是否已删除 (1: 是, 0: 否) */
  @Column('is_deleted')
  isDeleted!: number | null
}

/**
 * 看板列表数据传输映射类
 *
 * @implements {DashboardVo.DashboardListItem}
 * @implements {IColumnTarget}
 */
export class DashboardListMapping implements DashboardVo.DashboardListItem, IColumnTarget {
  /**
   * 将数据库行数据映射为看板列表项属性
   *
   * @param {Array<Row> | Row} data 数据库原始行数据
   * @returns {Array<Row> | Row} 映射后的数据
   */
  columnsMapper(data: Array<Row> | Row): Array<Row> | Row {
    return mapToTarget(this, data, entityColumnsMap.get(this.constructor))
  }

  /** 看板 ID */
  @Column('id')
  id!: number

  /** 看板名称 */
  @Column('dashboard_name')
  dashboardName!: string

  /** 看板描述 */
  @Column('dashboard_desc')
  dashboardDesc!: string

  /** 创建时间 */
  @Column('create_time')
  createTime!: string

  /** 更新时间 */
  @Column('update_time')
  updateTime!: string

  /** 创建人 */
  @Column('created_by')
  createdBy!: string

  /** 更新人 */
  @Column('updated_by')
  updatedBy!: string

  /** 看板下组件的数量 */
  @Column('widget_count')
  widgetCount!: number

  /** 当前用户对该看板的最高权限类型 */
  @Column('dashboard_permission')
  dashboardPermission!: PermissionVo.ResourcePermissionType
}

/**
 * 看板历史版本配置项映射类
 *
 * @implements {DashboardVo.DashboardConfigHistoryItem}
 * @implements {IColumnTarget}
 */
class DashboardConfigHistoryMapping implements DashboardVo.DashboardConfigHistoryItem, IColumnTarget {
  /** 已映射的布局配置缓存 */
  private mappedLayoutConfig: DashboardDao.LayoutConfig = DEFAULT_LAYOUT_CONFIG
  /** 已映射 of 组件配置缓存 */
  private mappedWidgetsConfig: DashboardDao.DashboardWidgetConfigItem[] = []

  /**
   * 将数据库行数据映射为看板历史版本配置项属性
   *
   * @param {Array<Row> | Row} data 数据库原始行数据
   * @returns {Array<Row> | Row} 映射后的数据
   */
  columnsMapper(data: Array<Row> | Row): Array<Row> | Row {
    return mapToTarget(this, data, entityColumnsMap.get(this.constructor))
  }

  /** 看板配置 ID */
  @Column('id')
  id!: number

  /** 看板 ID */
  @Column('dashboard_id')
  dashboardId!: number

  /** 版本号 */
  @Column('version_no')
  versionNo!: number

  /**
   * 获取布局配置
   *
   * @returns {DashboardDao.LayoutConfig} 布局配置对象
   */
  @Column('layout_config')
  get layoutConfig(): DashboardDao.LayoutConfig {
    return this.mappedLayoutConfig
  }

  /**
   * 设置并解析布局配置
   *
   * @param {string | DashboardDao.LayoutConfig | null} value 布局配置 JSON 字符串或对象
   */
  set layoutConfig(value: string | DashboardDao.LayoutConfig | null) {
    this.mappedLayoutConfig = !value ? DEFAULT_LAYOUT_CONFIG : typeof value === 'string' ? JSON.parse(value) : value
  }

  /**
   * 获取组件配置列表
   *
   * @returns {DashboardDao.DashboardWidgetConfigItem[]} 组件配置数组
   */
  @Column('widgets_config')
  get widgetsConfig(): DashboardDao.DashboardWidgetConfigItem[] {
    return this.mappedWidgetsConfig
  }

  /**
   * 设置并解析组件配置列表
   *
   * @param {string | DashboardDao.DashboardWidgetConfigItem[] | null} value 组件配置 JSON 字符串或数组
   */
  set widgetsConfig(value: string | DashboardDao.DashboardWidgetConfigItem[] | null) {
    this.mappedWidgetsConfig = !value ? [] : typeof value === 'string' ? JSON.parse(value) : value
  }

  /** 变更说明 */
  @Column('change_note')
  changeNote!: string | null

  /** 创建时间 */
  @Column('create_time')
  createTime!: string

  /** 创建人 */
  @Column('created_by')
  createdBy!: string

  /** 更新时间 */
  @Column('update_time')
  updateTime!: string

  /** 是否已删除 (1: 是, 0: 否) */
  @Column('is_deleted')
  isDeleted!: number | null

  /** 该配置版本下的组件数量 */
  @Column('widget_count')
  widgetCount!: number
}

/**
 * 看板数据访问层，负责对看板及看板配置的增删改查
 */
export class DashboardMapper extends BaseMapper {
  /** 当前 mapper 使用的数据源名称 */
  public dataSourceName = DATA_SOURCE_NAME

  /**
   * 执行 SQL 的便捷封装（保留泛型能力）
   *
   * @template T 返回值类型
   * @param {string} sql 需要执行的 SQL 语句
   * @param {Array<any>} [params] 预编译参数数组
   * @returns {Promise<T>} 查询或写入操作的执行结果
   */
  public override async exe<T>(sql: string, params?: Array<any>): Promise<T> {
    return await super.exe<T>(sql, params)
  }

  /**
   * 创建看板记录
   *
   * @param {DashboardDao.CreateDashboardParams} createParams 创建参数
   * @returns {Promise<number>} 新创建的看板 ID
   */
  public async createDashboard(createParams: DashboardDao.CreateDashboardParams): Promise<number> {
    const { keys, values } = convertToSqlProperties(createParams)
    const sql = `insert into ${DASHBOARD_TABLE_NAME} (${keys.join(',')}) values (${keys.map(() => '?').join(',')})`
    const result = await this.exe<ResultSetHeader>(sql, values)
    return result.insertId
  }

  /**
   * 更新看板基本信息
   *
   * @param {DashboardDao.UpdateDashboardParams} updateParams 更新参数
   * @returns {Promise<boolean>} 是否更新成功
   */
  public async updateDashboard(updateParams: DashboardDao.UpdateDashboardParams): Promise<boolean> {
    const { keys, values } = convertToSqlProperties(updateParams)
    const setClause = keys.map((key) => `${key} = ?`).join(', ')
    const sql = `update ${DASHBOARD_TABLE_NAME} set ${setClause} where id = ? and is_deleted = 0`
    const result = await this.exe<ResultSetHeader>(sql, [...values, updateParams.id])
    return result.affectedRows > 0
  }

  /**
   * 逻辑删除看板
   *
   * @param {DashboardDao.DeleteDashboardParams} deleteParams 删除参数
   * @returns {Promise<boolean>} 是否删除成功
   */
  public async deleteDashboard(deleteParams: DashboardDao.DeleteDashboardParams): Promise<boolean> {
    const sql = `update ${DASHBOARD_TABLE_NAME} set is_deleted = 1, updated_by = ?, update_time = ? where id = ? and is_deleted = 0`
    const result = await this.exe<ResultSetHeader>(sql, [
      deleteParams.updatedBy,
      deleteParams.updateTime,
      deleteParams.id
    ])
    return result.affectedRows > 0
  }

  /**
   * 获取单个看板详情（含资源权限校验）
   *
   * @template T 返回的记录类型，默认继承自 DashboardDao.DashboardRecord
   * @param {DashboardDao.GetDashboardParams} query 查询及权限判断参数
   * @returns {Promise<T>} 看板记录 Promise
   */
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

  /**
   * 获取看板详情（内部使用，跳过权限校验）
   *
   * @template T 返回的记录类型，默认继承自 DashboardDao.DashboardRecord
   * @param {number} id 看板 ID
   * @returns {Promise<T>} 看板记录 Promise
   */
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

  /**
   * 获取指定的看板配置详情
   *
   * @template T 返回的配置记录类型，默认继承自 DashboardDao.DashboardConfigRecord
   * @param {DashboardDao.GetDashboardConfigParams} query 查询参数
   * @returns {Promise<T>} 看板配置记录 Promise
   */
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

  /**
   * 计算看板的下一个配置版本号
   *
   * @param {number} dashboardId 看板 ID
   * @returns {Promise<number>} 下一个版本号
   */
  public async getNextVersionNo(dashboardId: number): Promise<number> {
    const sql = `
      select coalesce(max(version_no), 0) + 1 as nextVersionNo
      from ${DASHBOARD_CONFIG_TABLE_NAME}
      where dashboard_id = ?`
    const result = await this.exe<Array<{ nextVersionNo: number }>>(sql, [dashboardId])
    return Number(result?.[0]?.nextVersionNo || 1)
  }

  /**
   * 创建看板配置版本记录
   *
   * @param {DashboardDao.CreateDashboardConfigParams} createParams 配置创建参数
   * @returns {Promise<number>} 新创建 of 配置版本 ID
   */
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

  /**
   * 获取看板历史配置版本列表
   *
   * @template T 历史版本项的类型
   * @param {number} dashboardId 看板 ID
   * @returns {Promise<Array<T>>} 看板历史配置项数组 Promise
   */
  @Mapping(DashboardConfigHistoryMapping)
  public async getDashboardConfigHistory<
    T extends DashboardVo.DashboardConfigHistoryItem = DashboardVo.DashboardConfigHistoryItem
  >(dashboardId: number): Promise<Array<T>> {
    const sql = `
      select
        ${DASHBOARD_CONFIG_FIELDS.join(',\n        ')},
        json_length(coalesce(widgets_config, json_array())) as widget_count
      from ${DASHBOARD_CONFIG_TABLE_NAME}
      where dashboard_id = ? and is_deleted = 0
      order by version_no desc, id desc`
    return await this.exe<Array<T>>(sql, [dashboardId])
  }

  /**
   * 统计符合查询条件的看板总数
   *
   * @param {DashboardDao.GetDashboardListParams} query 列表查询与权限过滤参数
   * @returns {Promise<number>} 看板总数
   */
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

  /**
   * 获取看板列表（分页）
   *
   * @template T 看板列表项的类型
   * @param {DashboardDao.GetDashboardListParams} query 列表查询与分页过滤参数
   * @returns {Promise<Array<T>>} 看板列表 Promise
   */
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

  /**
   * 构建查询看板详情时的访问控制 SQL 语句及参数
   *
   * @param {DashboardDao.GetDashboardParams} query 查询参数
   * @returns {{ whereClause: string, params: Array<string | number> }} 返回 where 子句和参数数组
   */
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

  /**
   * 构建看板列表查询的 SQL 过滤条件及相关权限 SQL 片段
   *
   * @param {DashboardDao.GetDashboardListParams} query 查询参数
   * @returns {{ whereClause: string, params: string[], permissionSelectSql: string }}
   */
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

  /**
   * 转义单引号以保证 SQL 拼接安全性
   *
   * @param {string} value 待转义的字符串
   * @returns {string} 转义并包裹单引号后的 SQL 值片段
   */
  private escapeValue(value: string) {
    return `'${value.replace(/'/g, "''")}'`
  }
}
