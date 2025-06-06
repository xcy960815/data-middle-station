import {
  Column,
  Mapping,
  BaseMapper,
  Row,
  IColumnTarget,
  mapToTarget,
  entityColumnsMap,
} from './baseMapper'

import { ResultSetHeader } from 'mysql2'

export class ChartConfigMapping implements ChartConfigDao.ChartConfig, IColumnTarget {
  columnsMapper(data: Array<Row> | Row): Array<Row> | Row {
    return mapToTarget(this, data, entityColumnsMap.get(this.constructor))
  }

  @Column('id')
  id!: number

  @Column('data_source')
  dataSource!: string

  @Column('chart_type')
  chartType: string = ''

  @Column('column')
  column: ChartConfigDao.ColumnOption[] = []

  @Column('dimension')
  dimension: ChartConfigDao.DimensionOption[] = []

  @Column('filter')
  filter: ChartConfigDao.FilterOption[] = []

  @Column('group')
  group: ChartConfigDao.GroupOption[] = []

  @Column('order')
  order: ChartConfigDao.OrderOption[] = []

  @Column('create_time')
  createTime: string = ''

  @Column('update_time')
  updateTime: string = ''

  @Column('limit')
  limit!: number
}
/**
 * @desc 图表配置基础字段
 */
const CHART_CONFIG_BASE_FIELDS = [
  'id',
  'chart_type',
  'data_source',
  'column',
  'dimension',
  'filter',
  'group',
  'order',
  'limit',
  'create_time',
  'update_time',
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
  public dataSourceName = DATA_SOURCE_NAME
  /**
   * @desc 获取图表配置
   * @param id {number} 图表配置ID
   * @returns {Promise<ChartConfigDao.ChartConfig>} 图表配置
   */
  @Mapping(ChartConfigMapping)
  public async getChartConfig<T extends ChartConfigDao.ChartConfig>(id: number): Promise<T> {
    const sql = `select 
          ${batchFormatSqlKey(CHART_CONFIG_BASE_FIELDS)}
            from ${CHART_CONFIG_TABLE_NAME} where id = ?`
    const result = await this.exe<Array<T>>(sql, [id])
    return result?.[0]
  }
  /**
   * @desc 创建图表配置
   * @param chartConfig {ChartConfigDto.ChartConfig} 图表配置
   * @returns {Promise<number>} 图表配置ID
   */
  public async createChartConfig(chartConfig: ChartConfigDto.ChartConfig): Promise<number> {
    const { keys, values } = convertToSqlProperties(chartConfig)
    // 只使用数据库表中存在的字段
    const validKeys = keys.filter(key => CHART_CONFIG_BASE_FIELDS.includes(key))
    const validValues = validKeys.map(key => values[keys.indexOf(key)])
    const sql = `insert into ${CHART_CONFIG_TABLE_NAME} (${batchFormatSqlKey(validKeys)}) values (${validKeys.map(() => '?').join(',')})`
    const result = await this.exe<ResultSetHeader>(sql, validValues)
    return result.insertId || 0
  }

  /**
   * @desc 更新图表配置
   * @param chartConfig {ChartConfigDto.ChartConfig} 图表配置
   * @returns {Promise<number>} 图表配置ID
   */
  public async updateChart(chartConfig: ChartConfigDto.ChartConfig): Promise<boolean> {
    const { keys, values } = convertToSqlProperties(chartConfig)
    const sql = `update ${CHART_CONFIG_TABLE_NAME} set ${batchFormatSqlSet(keys)} where id = ?`
    return (await this.exe<number>(sql, [...values, chartConfig.id])) > 0
  }
}
