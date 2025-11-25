import type { ResultSetHeader } from 'mysql2'
import type { IColumnTarget, Row } from '@/server/mapper/baseMapper'
import { BaseMapper, Column, Mapping, entityColumnsMap, mapToTarget } from '@/server/mapper/baseMapper'

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
 * 分析mapper
 */
export class AnalyzeMapper extends BaseMapper {
  /**
   * @desc 数据源名称
   */
  public dataSourceName = DATA_SOURCE_NAME

  /**
   * @desc 执行sql
   * @param sql {string} sql语句
   * @param params {Array<any>} 参数
   * @returns {Promise<T>}
   */
  public override async exe<T>(sql: string, params?: Array<any>): Promise<T> {
    return await super.exe<T>(sql, params)
  }

  /**
   * @desc 新建分析
   * @param analyzeOption {AnalyzeDto.CreateAnalyzeRequest} 图表
   * @returns {Promise<number>}
   */
  public async createAnalyze(analyzeOption: AnalyzeDto.CreateAnalyzeRequest): Promise<boolean> {
    const { keys, values } = convertToSqlProperties(analyzeOption)
    const sql = `INSERT INTO ${ANALYZE_TABLE_NAME} (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`
    const result = await this.exe<ResultSetHeader>(sql, values)
    return result.affectedRows > 0
  }

  /**
   * @desc 更新分析
   * @param AnalyzeOptionDto {AnalyzeDto.UpdateAnalyzeRequest} 图表
   * @returns {Promise<void>}
   */
  public async updateAnalyze(analyzeOptionDao: AnalyzeDto.UpdateAnalyzeRequest): Promise<boolean> {
    const { viewCount, createTime, createdBy, ...analyzeOption } = analyzeOptionDao
    const { keys: analyzeOptionKeys, values: analyzeOptionValues } = convertToSqlProperties(analyzeOption)
    const analyzeOptionSetClause = analyzeOptionKeys.map((key) => `${key} = ?`).join(', ')
    const updateAnalyzeSql = `UPDATE ${ANALYZE_TABLE_NAME} SET ${analyzeOptionSetClause} WHERE id = ? and is_deleted = 0`
    const analyzeResult = await this.exe<ResultSetHeader>(updateAnalyzeSql, [...analyzeOptionValues, analyzeOption.id])

    return analyzeResult.affectedRows > 0
  }

  /**
   * @desc 更新图表的访问次数
   * @param id {number} 图表id
   */
  public async updateViewCount(id: number): Promise<number> {
    const sql = `UPDATE ${ANALYZE_TABLE_NAME} SET view_count = view_count + 1 WHERE id = ?`
    return await this.exe<number>(sql, [id])
  }

  /**
   * @desc 获取分析
   * @param id {number} 图表id
   * @returns {Promise<AnalyzeDao.AnalyzeOption>}
   */
  @Mapping(AnalyzeMapping)
  public async getAnalyze<T extends AnalyzeDao.AnalyzeOption>(analyzeParams: AnalyzeDto.GetAnalyzeRequest): Promise<T> {
    const { id, updatedBy, updateTime, createdBy, createTime, analyzeName, analyzeDesc } = analyzeParams
    await this.updateViewCount(id)
    let whereClause = `where id = ? and is_deleted = 0`
    if (updatedBy) {
      whereClause += ` and updated_by = ?`
    }
    if (updateTime) {
      whereClause += ` and update_time = ?`
    }
    if (createdBy) {
      whereClause += ` and created_by = ?`
    }
    const sql = `select ${ANALYZE_BASE_FIELDS.join(',\n    ')} from ${ANALYZE_TABLE_NAME} ${whereClause}`
    const result = await this.exe<Array<T>>(sql, [
      id,
      updatedBy,
      updateTime,
      createdBy,
      createTime,
      analyzeName,
      analyzeDesc
    ])
    return result?.[0]
  }

  /**
   * @desc 删除图表(逻辑删除)
   * @param {AnalyzeDto.DeleteAnalyzeRequest} analyzeOption
   * @returns {Promise<number>}
   */
  public async deleteAnalyze(analyzeOption: AnalyzeDto.DeleteAnalyzeRequest): Promise<boolean> {
    const { id, updatedBy, updateTime } = analyzeOption
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
