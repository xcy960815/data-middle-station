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
  'id',
  'analyze_name',
  'analyze_desc',
  'view_count',
  'create_time',
  'update_time',
  'created_by',
  'updated_by'
]

/**
 * @desc 分析页面的行数据映射，将数据库字段转换为领域对象属性
 */
export class AnalyzeMapping implements AnalyzeDao.AnalyzeOptions, IColumnTarget {
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
  analyzeName: 'analyze_name',
  createTime: 'create_time',
  updateTime: 'update_time',
  viewCount: 'view_count'
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
   * @param {AnalyzeDao.CreateAnalyzeOptions} createAnalyzeDao 新建分析所需的字段（名称、描述、图表配置等）
   * @returns {Promise<number>} 创建成功后的 ID
   */
  public async createAnalyze(createAnalyzeDao: AnalyzeDao.CreateAnalyzeOptions): Promise<number> {
    const { keys, values } = convertToSqlProperties(createAnalyzeDao)
    const sql = `INSERT INTO ${ANALYZE_TABLE_NAME} (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`
    const result = await this.exe<ResultSetHeader>(sql, values)
    return result.insertId
  }

  /**
   * @desc 更新分析配置（不包含访问统计相关字段）
   * @param {AnalyzeDao.UpdateAnalyzeOptions} updateAnalyzeDao 更新分析的请求参数
   * @returns {Promise<boolean>} 是否更新成功
   */
  public async updateAnalyze(updateAnalyzeOptions: AnalyzeDao.UpdateAnalyzeOptions): Promise<boolean> {
    const { keys: analyzeOptionKeys, values: analyzeOptionValues } = convertToSqlProperties(updateAnalyzeOptions)
    const analyzeOptionSetClause = analyzeOptionKeys.map((key) => `${key} = ?`).join(', ')
    const updateAnalyzeSql = `UPDATE ${ANALYZE_TABLE_NAME} SET ${analyzeOptionSetClause} WHERE id = ? and is_deleted = 0`
    const analyzeResult = await this.exe<ResultSetHeader>(updateAnalyzeSql, [
      ...analyzeOptionValues,
      updateAnalyzeOptions.id
    ])

    return analyzeResult.affectedRows > 0
  }

  /**
   * @desc 更新分析名称
   * @param {AnalyzeDao.UpdateAnalyzeNameOptions} updateAnalyzeNameOptions 更新分析名称的请求参数
   * @returns {Promise<boolean>} 是否更新成功
   */
  public async updateAnalyzeName(updateAnalyzeNameOptions: AnalyzeDao.UpdateAnalyzeNameOptions): Promise<boolean> {
    const sql = `UPDATE ${ANALYZE_TABLE_NAME} SET analyze_name = ? WHERE id = ? and is_deleted = 0`
    const result = await this.exe<ResultSetHeader>(sql, [
      updateAnalyzeNameOptions.analyzeName,
      updateAnalyzeNameOptions.id
    ])
    return result.affectedRows > 0
  }

  /**
   * @desc 更新分析描述
   * @param {AnalyzeDao.UpdateAnalyzeDescOptions} updateAnalyzeDescOptions 更新分析描述的请求参数
   * @returns {Promise<boolean>} 是否更新成功
   */
  public async updateAnalyzeDesc(updateAnalyzeDescOptions: AnalyzeDao.UpdateAnalyzeDescOptions): Promise<boolean> {
    const sql = `UPDATE ${ANALYZE_TABLE_NAME} SET analyze_desc = ? WHERE id = ? and is_deleted = 0`
    const result = await this.exe<ResultSetHeader>(sql, [
      updateAnalyzeDescOptions.analyzeDesc,
      updateAnalyzeDescOptions.id
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
   * @param {AnalyzeDao.GetAnalyzeOptions} analyzeDao 查询参数（至少包含分析 ID，可附带创建/更新人等过滤条件）
   * @returns {Promise<T>} 匹配的分析配置（若存在）
   */
  @Mapping(AnalyzeMapping)
  public async getAnalyze<T extends AnalyzeDao.AnalyzeOptions = AnalyzeDao.AnalyzeOptions>(
    analyzeOptions: AnalyzeDao.GetAnalyzeOptions
  ): Promise<T> {
    const { id, analyzeName, analyzeDesc, updatedBy, updateTime, createdBy } = analyzeOptions
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
   * @param queryOptions 列表查询参数
   * @returns 数量
   */
  public async countAnalyzes(queryOptions: AnalyzeDao.GetAnalyzeListOptions): Promise<number> {
    const { whereClause, params } = this.buildAnalyzeListWhereClause(queryOptions.keyword)
    const sql = `select count(1) as total from ${ANALYZE_TABLE_NAME} ${whereClause}`
    const result = await this.exe<Array<{ total: number }>>(sql, params)
    return Number(result?.[0]?.total || 0)
  }

  /**
   * @desc 获取分析列表
   * @param queryOptions 列表查询参数
   * @returns 分析列表
   */
  @Mapping(AnalyzeListMapping)
  public async getAnalyzeList<T extends AnalyzeVo.AnalyzeListItem = AnalyzeVo.AnalyzeListItem>(
    queryOptions: AnalyzeDao.GetAnalyzeListOptions
  ): Promise<Array<T>> {
    const { whereClause, params } = this.buildAnalyzeListWhereClause(queryOptions.keyword)
    const sortField = ANALYZE_LIST_SORT_FIELD_MAP[queryOptions.sortField] || ANALYZE_LIST_SORT_FIELD_MAP.updateTime
    const sortOrder = queryOptions.sortOrder === 'asc' ? 'ASC' : 'DESC'
    const page = Math.max(1, Math.floor(queryOptions.page))
    const pageSize = Math.max(1, Math.floor(queryOptions.pageSize))
    const offset = (page - 1) * pageSize
    const sql = `
      select
        ${ANALYZE_LIST_FIELDS.join(',\n        ')}
      from ${ANALYZE_TABLE_NAME}
      ${whereClause}
      order by ${sortField} ${sortOrder}
      limit ? offset ?`

    return await this.exe<Array<T>>(sql, [...params, pageSize, offset])
  }

  /**
   * @desc 删除图表（逻辑删除）
   * @param {AnalyzeDao.DeleteAnalyzeOptions} deleteAnalyzeDao 删除参数（包含 ID、操作者及时间）
   * @returns 是否删除成功
   */
  public async deleteAnalyze(deleteAnalyzeDao: AnalyzeDao.DeleteAnalyzeOptions): Promise<boolean> {
    const { id, updatedBy, updateTime } = deleteAnalyzeDao
    const sql = `update ${ANALYZE_TABLE_NAME} set is_deleted = 1, updated_by = ?, update_time = ? where id = ?`
    const result = await this.exe<ResultSetHeader>(sql, [updatedBy, updateTime, id])
    return result.affectedRows > 0
  }

  /**
   * @desc 获取所有的图表
   * @returns {Promise<Array<AnalyzeDao.AnalyzeOptions>>}
   */
  @Mapping(AnalyzeMapping)
  public async getAnalyzes<T extends AnalyzeDao.AnalyzeOptions = AnalyzeDao.AnalyzeOptions>(): Promise<Array<T>> {
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
  private buildAnalyzeListWhereClause(keyword?: string): { whereClause: string; params: string[] } {
    const whereConditions = ['is_deleted = 0']
    const params: string[] = []

    if (keyword?.trim()) {
      whereConditions.push('(analyze_name like ? or analyze_desc like ?)')
      const normalizedKeyword = `%${keyword.trim()}%`
      params.push(normalizedKeyword, normalizedKeyword)
    }

    return {
      whereClause: `where ${whereConditions.join(' and ')}`,
      params
    }
  }
}
