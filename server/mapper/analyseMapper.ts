import type { ResultSetHeader } from 'mysql2'
import { Column, Mapping, BaseMapper, Row, entityColumnsMap, mapToTarget, type IColumnTarget } from './baseMapper'

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

export class AnalyzeMapping implements AnalyseDao.AnalyseOption, IColumnTarget {
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
  public async exe<T>(sql: string, params?: Array<any>): Promise<T> {
    return await super.exe<T>(sql, params)
  }

  /**
   * @desc 新建分析
   * @param analyseOption {AnalyseDao.AnalyseOption} 图表
   * @returns {Promise<number>}
   */
  public async createAnalyse(analyseOption: AnalyseDao.AnalyseOption): Promise<boolean> {
    const { keys, values } = convertToSqlProperties(analyseOption)
    const sql = `INSERT INTO ${ANALYSE_TABLE_NAME} (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`
    const result = await this.exe<ResultSetHeader>(sql, values)
    return result.affectedRows > 0
  }

  /**
   * @desc 更新分析
   * @param AnalyseOptionDto {AnalyseDao.AnalyseOption} 图表
   * @returns {Promise<void>}
   */
  public async updateAnalyse(AnalyseOptionDto: AnalyseDao.AnalyseOption): Promise<boolean> {
    const { viewCount, createTime, createdBy, updatedBy, ...AnalyseOption } = AnalyseOptionDto
    const { keys: AnalyseOptionKeys, values: AnalyseOptionValues } = convertToSqlProperties(AnalyseOption)
    const AnalyseOptionSetClause = AnalyseOptionKeys.map((key) => `${key} = ?`).join(', ')
    const updateAnalyseSql = `UPDATE ${ANALYSE_TABLE_NAME} SET ${AnalyseOptionSetClause} WHERE id = ? and is_deleted = 0`
    const analyseResult = await this.exe<ResultSetHeader>(updateAnalyseSql, [...AnalyseOptionValues, AnalyseOption.id])

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
  @Mapping(AnalyzeMapping)
  public async getAnalyse<T extends AnalyseDao.AnalyseOption>(id: number): Promise<T> {
    await this.updateViewCount(id)
    const sql = `select 
      ${ANALYSE_BASE_FIELDS.join(',\n    ')}
    from ${ANALYSE_TABLE_NAME} where id = ? and is_deleted = 0`
    const result = await this.exe<Array<T>>(sql, [id])
    return result?.[0]
  }

  /**
   * @desc 删除图表(逻辑删除)
   * @param analyseOption {
   *  id: number;
   *  updatedBy: string;
   *  updateTime: string;
   * } 删除参数
   * @returns {Promise<number>}
   */
  public async deleteAnalyse(analyseOption: { id: number; updatedBy: string; updateTime: string }): Promise<boolean> {
    const { id, updatedBy, updateTime } = analyseOption
    const sql = `update ${ANALYSE_TABLE_NAME} set is_deleted = 1, updated_by = ?, update_time = ? where id = ?`
    const result = await this.exe<ResultSetHeader>(sql, [updatedBy, updateTime, id])
    return result.affectedRows > 0
  }

  /**
   * @desc 获取所有的图表
   * @returns {Promise<Array<AnalyseDao.AnalyseOption>>}
   */
  @Mapping(AnalyzeMapping)
  public async getAnalyses<T extends AnalyseDao.AnalyseOption = AnalyseDao.AnalyseOption>(): Promise<Array<T>> {
    const sql = `
    select 
      ${ANALYSE_BASE_FIELDS.join(',\n    ')}
    from ${ANALYSE_TABLE_NAME} 
    where is_deleted = 0`
    return await this.exe<Array<T>>(sql)
  }
}
