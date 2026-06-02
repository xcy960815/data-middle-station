import type { IColumnTarget, Row } from '@/server/mapper/baseMapper'
import { BaseMapper, Column, Mapping, entityColumnsMap, mapToTarget } from '@/server/mapper/baseMapper'
import { convertToSqlProperties } from '@/server/utils/databaseHelper'
import type { ResultSetHeader } from 'mysql2'

// 基础字段字典
export const ANALYZE_BASE_FIELDS = [
  'id',
  'analyze_name',
  'analyze_desc',
  'create_time',
  'update_time',
  'view_count',
  'created_by',
  'updated_by',
  'chart_config_id',
  'is_deleted'
]

export const ANALYZE_LIST_FIELDS = [
  'a.id',
  'a.analyze_name',
  'a.analyze_desc',
  'a.view_count',
  'a.create_time',
  'a.update_time',
  'a.created_by',
  'a.updated_by'
]

/**
 * @desc 分析页面的行数据映射，将数据库字段转换为领域对象属性
 */
export class AnalyzeMapping implements AnalyzeDao.AnalyzeRecord, IColumnTarget {
  columnsMapper(data: Array<Row> | Row): Array<Row> | Row {
    return mapToTarget(this, data, entityColumnsMap.get(this.constructor))
  }

  // 表名
  @Column('id')
  id!: number

  // 图表名称
  @Column('analyze_name')
  analyzeName!: string

  // 图表描述
  @Column('analyze_desc')
  analyzeDesc!: string

  // 访问次数
  @Column('view_count')
  viewCount!: number

  // 创建时间
  @Column('create_time')
  createTime!: string

  // 更新时间
  @Column('update_time')
  updateTime!: string

  // 创建人
  @Column('created_by')
  createdBy!: string

  // 更新人
  @Column('updated_by')
  updatedBy!: string

  // 图表配置ID
  @Column('chart_config_id')
  chartConfigId!: number | null

  // 是否删除
  @Column('is_deleted')
  isDeleted!: number
}

export class AnalyzeListMapping implements AnalyzeVo.AnalyzeListItem, IColumnTarget {
  columnsMapper(data: Array<Row> | Row): Array<Row> | Row {
    return mapToTarget(this, data, entityColumnsMap.get(this.constructor))
  }

  @Column('id')
  id!: number

  @Column('analyze_name')
  analyzeName!: string

  @Column('analyze_desc')
  analyzeDesc!: string

  @Column('view_count')
  viewCount!: number

  @Column('create_time')
  createTime!: string

  @Column('update_time')
  updateTime!: string

  @Column('created_by')
  createdBy!: string

  @Column('updated_by')
  updatedBy!: string

  @Column('analyze_permission')
  analyzePermission!: PermissionVo.AnalyzePermissionType
}

/**
 * @desc 本文件使用到的表
 */
const ANALYZE_TABLE_NAME = '`analyze`'

/**
 * 本文件使用到的数据源
 */
const DATA_SOURCE_NAME = 'data_middle_station'

const ANALYZE_LIST_SORT_FIELD_MAP: Record<AnalyzeDao.AnalyzeListSortField, string> = {
  analyzeName: 'a.analyze_name',
  createTime: 'a.create_time',
  updateTime: 'a.update_time',
  viewCount: 'a.view_count'
}

/**
 * @desc 分析 mapper，负责对分析配置的增删改查
 */
export class AnalyzeMapper extends BaseMapper {
  /**
   * @desc 当前 mapper 使用的数据源名称
   */
  public dataSourceName = DATA_SOURCE_NAME

  /**
   * @desc 执行 SQL 的便捷封装（保留泛型能力）
   * @param sql 需要执行的 SQL 语句
   * @param params 预编译参数数组
   * @returns 查询或写入操作的执行结果
   */
  public override async exe<T>(sql: string, params?: Array<any>): Promise<T> {
    return await super.exe<T>(sql, params)
  }

  /**
   * @desc 新建分析配置
   * @param {AnalyzeDao.CreateAnalyzeParams} createAnalyzeDao 新建分析所需的字段（名称、描述、图表配置等）
   * @returns {Promise<number>} 创建成功后的 ID
   */
  public async createAnalyze(createAnalyzeDao: AnalyzeDao.CreateAnalyzeParams): Promise<number> {
    const { keys, values } = convertToSqlProperties(createAnalyzeDao)
    const sql = `INSERT INTO ${ANALYZE_TABLE_NAME} (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`
    const result = await this.exe<ResultSetHeader>(sql, values)
    return result.insertId
  }

  /**
   * @desc 更新分析配置（不包含访问统计相关字段）
   * @param {AnalyzeDao.UpdateAnalyzeParams} updateAnalyzeDao 更新分析的请求参数
   * @returns {Promise<boolean>} 是否更新成功
   */
  public async updateAnalyze(updateAnalyzeParams: AnalyzeDao.UpdateAnalyzeParams): Promise<boolean> {
    const { keys, values } = convertToSqlProperties(updateAnalyzeParams)
    const setClause = keys.map((key) => `${key} = ?`).join(', ')
    const updateAnalyzeSql = `UPDATE ${ANALYZE_TABLE_NAME} SET ${setClause} WHERE id = ? and is_deleted = 0`
    const analyzeResult = await this.exe<ResultSetHeader>(updateAnalyzeSql, [...values, updateAnalyzeParams.id])

    return analyzeResult.affectedRows > 0
  }

  /**
   * @desc 更新分析名称
   * @param {AnalyzeDao.UpdateAnalyzeNameParams} updateAnalyzeNameParams 更新分析名称的请求参数
   * @returns {Promise<boolean>} 是否更新成功
   */
  public async updateAnalyzeName(updateAnalyzeNameParams: AnalyzeDao.UpdateAnalyzeNameParams): Promise<boolean> {
    const sql = `UPDATE ${ANALYZE_TABLE_NAME} SET analyze_name = ? WHERE id = ? and is_deleted = 0`
    const result = await this.exe<ResultSetHeader>(sql, [
      updateAnalyzeNameParams.analyzeName,
      updateAnalyzeNameParams.id
    ])
    return result.affectedRows > 0
  }

  /**
   * @desc 更新分析描述
   * @param {AnalyzeDao.UpdateAnalyzeDescParams} updateAnalyzeDescParams 更新分析描述的请求参数
   * @returns {Promise<boolean>} 是否更新成功
   */
  public async updateAnalyzeDesc(updateAnalyzeDescParams: AnalyzeDao.UpdateAnalyzeDescParams): Promise<boolean> {
    const sql = `UPDATE ${ANALYZE_TABLE_NAME} SET analyze_desc = ? WHERE id = ? and is_deleted = 0`
    const result = await this.exe<ResultSetHeader>(sql, [
      updateAnalyzeDescParams.analyzeDesc,
      updateAnalyzeDescParams.id
    ])
    return result.affectedRows > 0
  }

  /**
   * @desc 更新图表的访问次数（自增 1）
   * @param {number} analyzeId 图表主键 ID
   * @returns {Promise<number>} 更新后的访问次数
   */
  public async updateViewCount(analyzeId: number): Promise<boolean> {
    const sql = `UPDATE ${ANALYZE_TABLE_NAME} SET view_count = view_count + 1 WHERE id = ?`
    const result = await this.exe<ResultSetHeader>(sql, [analyzeId])
    return result.affectedRows > 0
  }

  /**
   * @desc 获取单个分析详情
   * @param {AnalyzeDao.GetAnalyzeParams} analyzeDao 查询参数（至少包含分析 ID，可附带创建/更新人等过滤条件）
   * @returns {Promise<T>} 匹配的分析配置（若存在）
   */
  @Mapping(AnalyzeMapping)
  public async getAnalyze<T extends AnalyzeDao.AnalyzeRecord = AnalyzeDao.AnalyzeRecord>(
    getAnalyzeParams: AnalyzeDao.GetAnalyzeParams
  ): Promise<T> {
    const { id, analyzeName, analyzeDesc, updatedBy, updateTime, createdBy } = getAnalyzeParams
    let whereClause = `where id = ? and is_deleted = 0`
    const whereValues: Array<string | number> = [id]

    if (analyzeName) {
      whereClause += ` and analyze_name = ?`
      whereValues.push(analyzeName)
    }
    if (analyzeDesc) {
      whereClause += ` and analyze_desc = ?`
      whereValues.push(analyzeDesc)
    }
    if (updatedBy) {
      whereClause += ` and updated_by = ?`
      whereValues.push(updatedBy)
    }
    if (updateTime) {
      whereClause += ` and update_time = ?`
      whereValues.push(updateTime)
    }
    if (createdBy) {
      whereClause += ` and created_by = ?`
      whereValues.push(createdBy)
    }
    const sql = `select ${ANALYZE_BASE_FIELDS.join(',\n    ')} from ${ANALYZE_TABLE_NAME} ${whereClause}`
    const result = await this.exe<Array<T>>(sql, whereValues)
    return result?.[0]
  }

  /**
   * @desc 获取分析数量
   * @param query 列表查询参数
   * @returns 数量
   */
  public async countAnalyzes(query: AnalyzeDao.GetAnalyzeListParams): Promise<number> {
    const { fromClause, whereClause, params } = this.buildAnalyzeListQuery(query)
    const sql = `select count(distinct a.id) as total ${fromClause} ${whereClause}`
    const result = await this.exe<Array<{ total: number }>>(sql, params)
    return Number(result?.[0]?.total || 0)
  }

  /**
   * @desc 获取分析列表
   * @param query 列表查询参数
   * @returns 分析列表
   */
  @Mapping(AnalyzeListMapping)
  public async getAnalyzeList<T extends AnalyzeVo.AnalyzeListItem = AnalyzeVo.AnalyzeListItem>(
    query: AnalyzeDao.GetAnalyzeListParams
  ): Promise<Array<T>> {
    const { fromClause, whereClause, params, permissionSelectSql } = this.buildAnalyzeListQuery(query)
    const sortField = ANALYZE_LIST_SORT_FIELD_MAP[query.sortField] || ANALYZE_LIST_SORT_FIELD_MAP.updateTime
    const sortOrder = query.sortOrder === 'asc' ? 'ASC' : 'DESC'
    const page = Math.max(1, Math.floor(query.page))
    const pageSize = Math.max(1, Math.floor(query.pageSize))
    const offset = (page - 1) * pageSize
    const sql = `
      select
        ${ANALYZE_LIST_FIELDS.join(',\n        ')},
        ${permissionSelectSql} as analyze_permission
      ${fromClause}
      ${whereClause}
      group by
        a.id,
        a.analyze_name,
        a.analyze_desc,
        a.view_count,
        a.create_time,
        a.update_time,
        a.created_by,
        a.updated_by
      order by ${sortField} ${sortOrder}
      limit ? offset ?`

    return await this.exe<Array<T>>(sql, [...params, pageSize, offset])
  }

  public async getAnalyzePermission(
    analyzeId: number,
    currentUserName: string,
    roleCodes: string[] = []
  ): Promise<PermissionVo.AnalyzePermissionType> {
    if (roleCodes.includes('admin')) {
      return 'manage'
    }

    const roleInSql = roleCodes.length > 0 ? `r.role_code in (${roleCodes.map(() => '?').join(',')})` : 'false'
    const sql = `
      select
        case
          when a.created_by = ? then 'manage'
          when max(case when ${roleInSql} then case rrp.permission_type when 'manage' then 3 when 'edit' then 2 when 'view' then 1 else 0 end else 0 end) = 3 then 'manage'
          when max(case when ${roleInSql} then case rrp.permission_type when 'manage' then 3 when 'edit' then 2 when 'view' then 1 else 0 end else 0 end) = 2 then 'edit'
          when max(case when ${roleInSql} then case rrp.permission_type when 'manage' then 3 when 'edit' then 2 when 'view' then 1 else 0 end else 0 end) = 1 then 'view'
          else 'none'
        end as permissionType
      from ${ANALYZE_TABLE_NAME} a
      left join resource_role_permission rrp on rrp.resource_type = 'analyze' and rrp.resource_id = a.id
      left join role r on r.id = rrp.role_id and r.is_deleted = 0 and r.status = 1
      where a.id = ? and a.is_deleted = 0
      group by a.id, a.created_by`
    const result = await this.exe<Array<{ permissionType: PermissionVo.AnalyzePermissionType }>>(sql, [
      currentUserName,
      ...roleCodes,
      ...roleCodes,
      ...roleCodes,
      analyzeId
    ])
    return result?.[0]?.permissionType || 'none'
  }

  /**
   * @desc 删除图表（逻辑删除）
   * @param {AnalyzeDao.DeleteAnalyzeParams} deleteAnalyzeDao 删除参数（包含 ID、操作者及时间）
   * @returns 是否删除成功
   */
  public async deleteAnalyze(deleteAnalyzeDao: AnalyzeDao.DeleteAnalyzeParams): Promise<boolean> {
    const { id, updatedBy, updateTime } = deleteAnalyzeDao
    const sql = `update ${ANALYZE_TABLE_NAME} set is_deleted = 1, updated_by = ?, update_time = ? where id = ?`
    const result = await this.exe<ResultSetHeader>(sql, [updatedBy, updateTime, id])
    return result.affectedRows > 0
  }

  /**
   * @desc 获取所有的图表
   * @returns {Promise<Array<AnalyzeDao.AnalyzeRecord>>}
   */
  @Mapping(AnalyzeMapping)
  public async getAnalyzes<T extends AnalyzeDao.AnalyzeRecord = AnalyzeDao.AnalyzeRecord>(): Promise<Array<T>> {
    const sql = `
    select
      ${ANALYZE_BASE_FIELDS.join(',\n    ')}
    from ${ANALYZE_TABLE_NAME}
    where is_deleted = 0`
    return await this.exe<Array<T>>(sql)
  }

  /**
   * @desc 构建列表查询条件
   * @param keyword 搜索关键字
   * @returns where 条件和参数
   */
  private buildAnalyzeListQuery(query: AnalyzeDao.GetAnalyzeListParams): {
    fromClause: string
    whereClause: string
    params: string[]
    permissionSelectSql: string
  } {
    const roleCodes = query.roleCodes || []
    const isAdmin = roleCodes.includes('admin')
    const whereConditions = ['a.is_deleted = 0']
    const params: string[] = []
    const fromClause = `
      from ${ANALYZE_TABLE_NAME} a
      left join resource_role_permission rrp on rrp.resource_type = 'analyze' and rrp.resource_id = a.id
      left join role r on r.id = rrp.role_id and r.is_deleted = 0 and r.status = 1`

    if (query.keyword?.trim()) {
      whereConditions.push('(a.analyze_name like ? or a.analyze_desc like ?)')
      const normalizedKeyword = `%${query.keyword.trim()}%`
      params.push(normalizedKeyword, normalizedKeyword)
    }

    if (!isAdmin) {
      if (roleCodes.length > 0) {
        whereConditions.push(`(a.created_by = ? or r.role_code in (${roleCodes.map(() => '?').join(',')}))`)
        params.push(query.currentUserName || '', ...roleCodes)
      } else {
        whereConditions.push('a.created_by = ?')
        params.push(query.currentUserName || '')
      }
    }

    return {
      whereClause: `where ${whereConditions.join(' and ')}`,
      params,
      fromClause,
      permissionSelectSql: isAdmin
        ? `'manage'`
        : `case
            when a.created_by = ${this.escapeValue(query.currentUserName || '')} then 'manage'
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
