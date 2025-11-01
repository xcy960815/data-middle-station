import type { ResultSetHeader } from 'mysql2'
import type { IColumnTarget, Row } from './baseMapper'
import { BaseMapper, Column, Mapping, entityColumnsMap, mapToTarget } from './baseMapper'

// 基础字段字典
export const ANALYSE_BASE_FIELDS = [
  'id',
  'analyse_name',
  'analyse_desc',
  'create_time',
  'update_time',
  'view_count',
  'created_by',
  'updated_by',
  'chart_config_id',
  'is_deleted'
]

export class AnalyseMapping implements AnalyseDao.AnalyseOption, IColumnTarget {
  columnsMapper(data: Array<Row> | Row): Array<Row> | Row {
    return mapToTarget(this, data, entityColumnsMap.get(this.constructor))
  }

  // 表名
  @Column('id')
  id!: number

  // 图表名称
  @Column('analyse_name')
  analyseName!: string

  // 图表描述
  @Column('analyse_desc')
  analyseDesc!: string

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
const ANALYSE_TABLE_NAME = 'analyse'

/**
 * 本文件使用到的数据源
 */
const DATA_SOURCE_NAME = 'data_middle_station'

/**
 * 分析mapper
 */
export class AnalyseMapper extends BaseMapper {
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
   * @param analyseOption {AnalyseDto.CreateAnalyseRequest} 图表
   * @returns {Promise<number>}
   */
  public async createAnalyse(analyseOption: AnalyseDto.CreateAnalyseRequest): Promise<boolean> {
    const { keys, values } = convertToSqlProperties(analyseOption)
    const sql = `INSERT INTO ${ANALYSE_TABLE_NAME} (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`
    const result = await this.exe<ResultSetHeader>(sql, values)
    return result.affectedRows > 0
  }

  /**
   * @desc 更新分析
   * @param AnalyseOptionDto {AnalyseDto.UpdateAnalyseRequest} 图表
   * @returns {Promise<void>}
   */
  public async updateAnalyse(analyseOptionDao: AnalyseDto.UpdateAnalyseRequest): Promise<boolean> {
    const { viewCount, createTime, createdBy, ...analyseOption } = analyseOptionDao
    const { keys: analyseOptionKeys, values: analyseOptionValues } = convertToSqlProperties(analyseOption)
    const analyseOptionSetClause = analyseOptionKeys.map((key) => `${key} = ?`).join(', ')
    const updateAnalyseSql = `UPDATE ${ANALYSE_TABLE_NAME} SET ${analyseOptionSetClause} WHERE id = ? and is_deleted = 0`
    const analyseResult = await this.exe<ResultSetHeader>(updateAnalyseSql, [...analyseOptionValues, analyseOption.id])

    return analyseResult.affectedRows > 0
  }

  /**
   * @desc 更新图表的访问次数
   * @param id {number} 图表id
   */
  public async updateViewCount(id: number): Promise<number> {
    const sql = `UPDATE ${ANALYSE_TABLE_NAME} SET view_count = view_count + 1 WHERE id = ?`
    return await this.exe<number>(sql, [id])
  }

  /**
   * @desc 获取分析
   * @param id {number} 图表id
   * @returns {Promise<AnalyseDao.AnalyseOption>}
   */
  @Mapping(AnalyseMapping)
  public async getAnalyse<T extends AnalyseDao.AnalyseOption>(analyseParams: AnalyseDto.GetAnalyseRequest): Promise<T> {
    const { id, updatedBy, updateTime, createdBy, createTime, analyseName, analyseDesc } = analyseParams
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
    const sql = `select ${ANALYSE_BASE_FIELDS.join(',\n    ')} from ${ANALYSE_TABLE_NAME} ${whereClause}`
    const result = await this.exe<Array<T>>(sql, [
      id,
      updatedBy,
      updateTime,
      createdBy,
      createTime,
      analyseName,
      analyseDesc
    ])
    return result?.[0]
  }

  /**
   * @desc 删除图表(逻辑删除)
   * @param {AnalyseDto.DeleteAnalyseRequest} analyseOption
   * @returns {Promise<number>}
   */
  public async deleteAnalyse(analyseOption: AnalyseDto.DeleteAnalyseRequest): Promise<boolean> {
    const { id, updatedBy, updateTime } = analyseOption
    const sql = `update ${ANALYSE_TABLE_NAME} set is_deleted = 1, updated_by = ?, update_time = ? where id = ?`
    const result = await this.exe<ResultSetHeader>(sql, [updatedBy, updateTime, id])
    return result.affectedRows > 0
  }

  /**
   * @desc 获取所有的图表
   * @returns {Promise<Array<AnalyseDao.AnalyseOption>>}
   */
  @Mapping(AnalyseMapping)
  public async getAnalyses<T extends AnalyseDao.AnalyseOption = AnalyseDao.AnalyseOption>(): Promise<Array<T>> {
    const sql = `
    select
      ${ANALYSE_BASE_FIELDS.join(',\n    ')}
    from ${ANALYSE_TABLE_NAME}
    where is_deleted = 0`
    return await this.exe<Array<T>>(sql)
  }
}
