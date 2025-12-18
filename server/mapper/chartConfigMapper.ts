import type { IColumnTarget, Row } from '@/server/mapper/baseMapper'
import { BaseMapper, Column, Mapping, entityColumnsMap, mapToTarget } from '@/server/mapper/baseMapper'
import type { ResultSetHeader } from 'mysql2'

/**
 * @desc 图表配置行数据映射，将数据库字段转换为图表配置实体
 */
class ChartConfigMapping implements AnalyzeConfigDao.ChartConfigOptions, IColumnTarget {
  columnsMapper(data: Array<Row> | Row): Array<Row> | Row {
    return mapToTarget(this, data, entityColumnsMap.get(this.constructor))
  }

  @Column('id')
  id!: number

  @Column('data_source')
  dataSource!: string

  @Column('chart_type')
  chartType!: string

  @Column('columns')
  columns: AnalyzeConfigDao.ColumnOptions[] = []

  @Column('dimensions')
  dimensions: AnalyzeConfigDao.DimensionOptions[] = []

  @Column('filters')
  filters: AnalyzeConfigDao.FilterOptions[] = []

  @Column('groups')
  groups: AnalyzeConfigDao.GroupOptions[] = []

  @Column('orders')
  orders: AnalyzeConfigDao.OrderOptions[] = []

  @Column('common_chart_config')
  commonChartConfig!: AnalyzeConfigDao.CommonChartConfig

  @Column('private_chart_config')
  privateChartConfig!: AnalyzeConfigDao.PrivateChartConfig

  @Column('create_time')
  createTime!: string

  @Column('update_time')
  updateTime!: string

  @Column('created_by')
  createdBy!: string

  @Column('updated_by')
  updatedBy!: string

  @Column('is_deleted')
  isDeleted!: number
}

/**
 * @desc 图表配置基础字段
 */
const CHART_CONFIG_BASE_FIELDS = [
  'id',
  'chart_type',
  'data_source',
  'columns',
  'dimensions',
  'filters',
  'groups',
  'orders',
  'common_chart_config',
  'private_chart_config',
  'create_time',
  'update_time',
  'created_by',
  'updated_by',
  'is_deleted'
]
/**
 * @desc 图表配置表名
 */
const CHART_CONFIG_TABLE_NAME = 'chart_config'
/**
 * @desc 数据源名称
 */
const DATA_SOURCE_NAME = 'data_middle_station'

export class ChartConfigMapper extends BaseMapper {
  /**
   * @desc 当前 mapper 使用的数据源名称
   */
  public dataSourceName = DATA_SOURCE_NAME
  /**
   * @desc 根据主键 ID 获取单个图表配置
   * @param chartConfigId 图表配置主键 ID
   * @returns 图表配置详情（若存在）
   */
  @Mapping(ChartConfigMapping)
  public async getChartConfig<T extends AnalyzeConfigDao.ChartConfigOptions = AnalyzeConfigDao.ChartConfigOptions>(
    chartConfigOptions: AnalyzeConfigDao.GetChartConfigOptions
  ): Promise<T> {
    const { keys, values } = convertToSqlProperties(chartConfigOptions)
    const whereClauses: string[] = []
    const queryValues: any[] = []

    keys.forEach((key, index) => {
      if (CHART_CONFIG_BASE_FIELDS.includes(key)) {
        const formattedKey = ['groups', 'orders', 'columns', 'dimensions', 'filters'].includes(key) ? `\`${key}\`` : key
        whereClauses.push(`${formattedKey} = ?`)
        queryValues.push(values[index])
      }
    })

    if (!keys.includes('is_deleted')) {
      whereClauses.push('is_deleted = 0')
    }

    const sql = `select
          ${batchFormatSqlKey(CHART_CONFIG_BASE_FIELDS)}
            from ${CHART_CONFIG_TABLE_NAME}
          where ${whereClauses.join(' and ')}`
    const result = await this.exe<Array<T>>(sql, queryValues)
    return result?.[0]
  }
  /**
   * @desc 创建图表配置
   * @param {AnalyzeConfigDao.CreateChartConfigOptions} createChartConfigOptions 新建图表配置请求参数
   * @returns 新建图表配置的主键 ID
   */
  public async createChartConfig(createChartConfigOptions: AnalyzeConfigDao.CreateChartConfigOptions): Promise<number> {
    const { keys, values } = convertToSqlProperties(createChartConfigOptions)
    // 只使用数据库表中存在的字段
    const validKeys = keys.filter((key) => CHART_CONFIG_BASE_FIELDS.includes(key))
    const validValues = validKeys.map((key) => values[keys.indexOf(key)])
    const sql = `insert into ${CHART_CONFIG_TABLE_NAME} (${batchFormatSqlKey(validKeys)}) values (${validKeys.map(() => '?').join(',')})`
    const result = await this.exe<ResultSetHeader>(sql, validValues)
    return result.insertId || 0
  }

  /**
   * @desc 更新图表配置
   * @param updateChartConfigRequest 更新图表配置请求参数
   * @returns 是否更新成功
   */
  public async updateChartConfig(
    updateChartConfigRequest: AnalyzeConfigDao.UpdateChartConfigOptions
  ): Promise<boolean> {
    const { keys, values } = convertToSqlProperties(updateChartConfigRequest)
    const sql = `UPDATE ${CHART_CONFIG_TABLE_NAME} set ${batchFormatSqlSet(keys)} where id = ? and is_deleted = 0`
    return (await this.exe<number>(sql, [...values, updateChartConfigRequest.id])) > 0
  }

  /**
   * @desc 删除图表配置（逻辑删除）
   * @param {AnalyzeConfigDao.DeleteChartConfigOptions} deleteChartConfigOptions
   * @returns {Promise<boolean>} 是否删除成功
   */
  public async deleteChartConfig(
    deleteChartConfigOptions: AnalyzeConfigDao.DeleteChartConfigOptions
  ): Promise<boolean> {
    const sql = `update ${CHART_CONFIG_TABLE_NAME} set is_deleted = 1, updated_by = ?, update_time = ? where id = ?`
    const result = await this.exe<ResultSetHeader>(sql, [
      deleteChartConfigOptions.updatedBy,
      deleteChartConfigOptions.updateTime,
      deleteChartConfigOptions.id
    ])
    return result.affectedRows > 0
  }
}
