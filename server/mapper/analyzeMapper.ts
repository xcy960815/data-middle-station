import type { IColumnTarget, Row } from '@/server/mapper/baseMapper'
import { BaseMapper, Column, Mapping, entityColumnsMap, mapToTarget } from '@/server/mapper/baseMapper'
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

/**
 * @desc 分析页面的行数据映射，将数据库字段转换为领域对象属性
 */
export class AnalyzeMapping implements AnalyzeDao.AnalyzeOption, IColumnTarget {
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
  chartConfigId!: number

  // 是否删除
  @Column('is_deleted')
  isDeleted!: number
}

/**
 * @desc 本文件使用到的表
 */
const ANALYZE_TABLE_NAME = '`analyze`'

/**
 * 本文件使用到的数据源
 */
const DATA_SOURCE_NAME = 'data_middle_station'

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
   * @param createAnalyzeRequest 新建分析所需的字段（名称、描述、图表配置等）
   * @returns 是否创建成功
   */
  public async createAnalyze(createAnalyzeRequest: AnalyzeDto.CreateAnalyzeRequest): Promise<boolean> {
    const { keys, values } = convertToSqlProperties(createAnalyzeRequest)
    const sql = `INSERT INTO ${ANALYZE_TABLE_NAME} (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`
    const result = await this.exe<ResultSetHeader>(sql, values)
    return result.affectedRows > 0
  }

  /**
   * @desc 更新分析配置（不包含访问统计相关字段）
   * @param updateAnalyzeRequest 更新分析的请求参数
   * @returns 是否更新成功
   */
  public async updateAnalyze(updateAnalyzeRequest: AnalyzeDto.UpdateAnalyzeRequest): Promise<boolean> {
    const { viewCount, createTime, createdBy, ...updatableFields } = updateAnalyzeRequest
    const { keys: analyzeOptionKeys, values: analyzeOptionValues } = convertToSqlProperties(updatableFields)
    const analyzeOptionSetClause = analyzeOptionKeys.map((key) => `${key} = ?`).join(', ')
    const updateAnalyzeSql = `UPDATE ${ANALYZE_TABLE_NAME} SET ${analyzeOptionSetClause} WHERE id = ? and is_deleted = 0`
    const analyzeResult = await this.exe<ResultSetHeader>(updateAnalyzeSql, [
      ...analyzeOptionValues,
      updateAnalyzeRequest.id
    ])

    return analyzeResult.affectedRows > 0
  }

  /**
   * @desc 更新图表的访问次数（自增 1）
   * @param analyzeId 图表主键 ID
   */
  public async updateViewCount(analyzeId: number): Promise<number> {
    const sql = `UPDATE ${ANALYZE_TABLE_NAME} SET view_count = view_count + 1 WHERE id = ?`
    return await this.exe<number>(sql, [analyzeId])
  }

  /**
   * @desc 获取单个分析详情，同时自增访问次数
   * @param analyzeParams 查询参数（至少包含分析 ID，可附带创建/更新人等过滤条件）
   * @returns 匹配的分析配置（若存在）
   */
  @Mapping(AnalyzeMapping)
  public async getAnalyze<T extends AnalyzeDao.AnalyzeOption>(analyzeParams: AnalyzeDto.GetAnalyzeRequest): Promise<T> {
    const { id, updatedBy, updateTime, createdBy } = analyzeParams
    await this.updateViewCount(id)
    let whereClause = `where id = ? and is_deleted = 0`
    const whereValues: Array<string | number> = [id]

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
   * @desc 删除图表（逻辑删除）
   * @param deleteAnalyzeRequest 删除参数（包含 ID、操作者及时间）
   * @returns 是否删除成功
   */
  public async deleteAnalyze(deleteAnalyzeRequest: AnalyzeDto.DeleteAnalyzeRequest): Promise<boolean> {
    const { id, updatedBy, updateTime } = deleteAnalyzeRequest
    const sql = `update ${ANALYZE_TABLE_NAME} set is_deleted = 1, updated_by = ?, update_time = ? where id = ?`
    const result = await this.exe<ResultSetHeader>(sql, [updatedBy, updateTime, id])
    return result.affectedRows > 0
  }

  /**
   * @desc 获取所有的图表
   * @returns {Promise<Array<AnalyzeDao.AnalyzeOption>>}
   */
  @Mapping(AnalyzeMapping)
  public async getAnalyzes<T extends AnalyzeDao.AnalyzeOption = AnalyzeDao.AnalyzeOption>(): Promise<Array<T>> {
    const sql = `
    select
      ${ANALYZE_BASE_FIELDS.join(',\n    ')}
    from ${ANALYZE_TABLE_NAME}
    where is_deleted = 0`
    return await this.exe<Array<T>>(sql)
  }
}
