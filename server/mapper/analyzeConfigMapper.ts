import type { IColumnTarget, Row } from '@/server/mapper/baseMapper'
import { BaseMapper, Column, Mapping, entityColumnsMap, mapToTarget } from '@/server/mapper/baseMapper'
import { convertToSqlProperties } from '@/server/utils/databaseHelper'
import type { ResultSetHeader } from 'mysql2'

/**
 * 分析配置实体映射类，用于将数据库行映射为分析配置记录对象。
 * @implements {AnalyzeConfigDao.AnalyzeConfigRecord}
 * @implements {IColumnTarget}
 */
class AnalyzeConfigMapping implements AnalyzeConfigDao.AnalyzeConfigRecord, IColumnTarget {
  /**
   * 列映射方法，将数据库原始行数据映射为当前类的属性
   * @param {Array<Row> | Row} data 原始数据库行数据
   * @returns {Array<Row> | Row} 映射后的数据
   */
  columnsMapper(data: Array<Row> | Row): Array<Row> | Row {
    return mapToTarget(this, data, entityColumnsMap.get(this.constructor))
  }

  /**
   * 分析配置 ID
   * @type {number}
   */
  @Column('id')
  id!: number

  /**
   * 分析/看板 ID
   * @type {number}
   */
  @Column('analyze_id')
  analyzeId!: number

  /**
   * 版本号
   * @type {number}
   */
  @Column('version_no')
  versionNo!: number

  /**
   * 数据集 ID
   * @type {number | null}
   */
  @Column('dataset_id')
  datasetId!: number | null

  /**
   * 图表类型
   * @type {string}
   */
  @Column('chart_type')
  chartType!: string

  /**
   * 指标配置列表
   * @type {AnalyzeConfigDao.MeasureOption[]}
   */
  @Column('measures')
  measures: AnalyzeConfigDao.MeasureOption[] = []

  /**
   * 过滤条件列表
   * @type {AnalyzeConfigDao.FilterOption[]}
   */
  @Column('filters')
  filters: AnalyzeConfigDao.FilterOption[] = []

  /**
   * 维度配置列表
   * @type {AnalyzeConfigDao.DimensionOption[]}
   */
  @Column('dimensions')
  dimensions: AnalyzeConfigDao.DimensionOption[] = []

  /**
   * 排序配置列表
   * @type {AnalyzeConfigDao.OrderOption[]}
   */
  @Column('orders')
  orders: AnalyzeConfigDao.OrderOption[] = []

  /**
   * 通用图表配置（如标题、边距等）
   * @type {AnalyzeConfigDao.CommonChartConfig}
   */
  @Column('common_chart_config')
  commonChartConfig!: AnalyzeConfigDao.CommonChartConfig

  /**
   * 私有/特定图表配置
   * @type {AnalyzeConfigDao.PrivateChartConfig}
   */
  @Column('private_chart_config')
  privateChartConfig!: AnalyzeConfigDao.PrivateChartConfig

  /**
   * 变更说明
   * @type {string}
   */
  @Column('change_note')
  changeNote!: string

  /**
   * 创建时间
   * @type {string}
   */
  @Column('create_time')
  createTime!: string

  /**
   * 更新时间
   * @type {string}
   */
  @Column('update_time')
  updateTime!: string

  /**
   * 创建人
   * @type {string}
   */
  @Column('created_by')
  createdBy!: string

  /**
   * 是否删除标记（0未删除，1已删除）
   * @type {number}
   */
  @Column('is_deleted')
  isDeleted!: number
}

/**
 * 分析配置历史表的表名
 * @type {string}
 */
const ANALYZE_CONFIG_TABLE_NAME = 'analyze_config'

/**
 * 默认使用的数据库连接池名称
 * @type {string}
 */
const DATA_SOURCE_NAME = 'data_middle_station'

/**
 * 分析配置表的所有字段列表
 * @type {string[]}
 */
const ANALYZE_CONFIG_FIELDS = [
  'id',
  'analyze_id',
  'version_no',
  'dataset_id',
  'chart_type',
  'measures',
  'filters',
  'dimensions',
  'orders',
  'common_chart_config',
  'private_chart_config',
  'change_note',
  'create_time',
  'update_time',
  'created_by',
  'is_deleted'
]

/**
 * 分析配置 Mapper 类，负责分析配置的版本控制、读取及创建。
 * @extends {BaseMapper}
 */
export class AnalyzeConfigMapper extends BaseMapper {
  /**
   * 当前 mapper 使用的数据源名称
   * @type {string}
   */
  public dataSourceName = DATA_SOURCE_NAME

  /**
   * 获取单个分析配置详情
   * @template T 返回的分析配置记录类型，默认继承自 AnalyzeConfigDao.AnalyzeConfigRecord
   * @param {AnalyzeConfigDao.GetAnalyzeConfigParams} getConfigParams 获取配置查询参数
   * @returns {Promise<T>} 分析配置记录
   */
  @Mapping(AnalyzeConfigMapping)
  public async getAnalyzeConfig<T extends AnalyzeConfigDao.AnalyzeConfigRecord = AnalyzeConfigDao.AnalyzeConfigRecord>(
    getConfigParams: AnalyzeConfigDao.GetAnalyzeConfigParams
  ): Promise<T> {
    const { keys, values } = convertToSqlProperties(getConfigParams)
    const whereClauses: string[] = []
    const queryValues: any[] = []

    keys.forEach((key, index) => {
      if (ANALYZE_CONFIG_FIELDS.includes(key)) {
        const formattedKey = ['dimensions', 'orders', 'measures', 'filters'].includes(key) ? `\`${key}\`` : key
        whereClauses.push(`${formattedKey} = ?`)
        queryValues.push(values[index])
      }
    })

    if (!keys.includes('is_deleted')) {
      whereClauses.push('is_deleted = 0')
    }

    const sql = `
      select ${batchFormatSqlKey(ANALYZE_CONFIG_FIELDS)}
      from ${ANALYZE_CONFIG_TABLE_NAME}
      where ${whereClauses.join(' and ')}`
    const result = await this.exe<Array<T>>(sql, queryValues)
    return result?.[0]
  }

  /**
   * 获取分析配置的版本历史列表
   * @template T 返回的分析配置记录类型，默认继承自 AnalyzeConfigDao.AnalyzeConfigRecord
   * @param {number} analyzeId 分析/看板 ID
   * @returns {Promise<Array<T>>} 配置历史列表
   */
  @Mapping(AnalyzeConfigMapping)
  public async getAnalyzeConfigHistory<
    T extends AnalyzeConfigDao.AnalyzeConfigRecord = AnalyzeConfigDao.AnalyzeConfigRecord
  >(analyzeId: number): Promise<Array<T>> {
    const sql = `
      select ${batchFormatSqlKey(ANALYZE_CONFIG_FIELDS)}
      from ${ANALYZE_CONFIG_TABLE_NAME}
      where analyze_id = ? and is_deleted = 0
      order by version_no desc, id desc`
    return await this.exe<Array<T>>(sql, [analyzeId])
  }

  /**
   * 获取分析配置的下一个版本号
   * @param {number} analyzeId 分析/看板 ID
   * @returns {Promise<number>} 下一个版本号
   */
  public async getNextVersionNo(analyzeId: number): Promise<number> {
    const sql = `
      select coalesce(max(version_no), 0) + 1 as nextVersionNo
      from ${ANALYZE_CONFIG_TABLE_NAME}
      where analyze_id = ?`
    const result = await this.exe<Array<{ nextVersionNo: number }>>(sql, [analyzeId])
    return Number(result?.[0]?.nextVersionNo || 1)
  }

  /**
   * 创建新的分析配置版本
   * @param {AnalyzeConfigDao.CreateAnalyzeConfigParams} createParams 创建配置参数
   * @returns {Promise<number>} 新创建的配置版本 ID
   */
  public async createAnalyzeConfig(createParams: AnalyzeConfigDao.CreateAnalyzeConfigParams): Promise<number> {
    const { keys, values } = convertToSqlProperties(createParams)
    const validKeys = keys.filter((key) => ANALYZE_CONFIG_FIELDS.includes(key))
    const validValues = validKeys.map((key) => values[keys.indexOf(key)])
    const sql = `
      insert into ${ANALYZE_CONFIG_TABLE_NAME}
        (${batchFormatSqlKey(validKeys)})
      values (${validKeys.map(() => '?').join(',')})`
    const result = await this.exe<ResultSetHeader>(sql, validValues)
    return result.insertId || 0
  }

  /**
   * 删除某个分析下所有的配置版本（逻辑删除）
   * @param {AnalyzeConfigDao.DeleteAnalyzeConfigsParams} deleteParams 删除参数
   * @returns {Promise<boolean>} 是否删除成功
   */
  public async deleteAnalyzeConfigs(deleteParams: AnalyzeConfigDao.DeleteAnalyzeConfigsParams): Promise<boolean> {
    const sql = `
      update ${ANALYZE_CONFIG_TABLE_NAME}
      set is_deleted = 1, update_time = ?
      where analyze_id = ? and is_deleted = 0`
    const result = await this.exe<ResultSetHeader>(sql, [deleteParams.updateTime, deleteParams.analyzeId])
    return result.affectedRows > 0
  }
}
