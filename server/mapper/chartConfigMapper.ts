import {
  Column,
  BindDataSource,
  Mapping,
  BaseMapper,
  IColumnTarget,
  ColumnMapper,
} from './baseMapper'
import { convertToSqlProperties } from '../utils/databaseHelpper'
import { ResultSetHeader } from 'mysql2'

export class ChartConfigMapping implements ChartConfigDao.ChartConfig, IColumnTarget {
  public columnsMap?: Map<string, string>
  public columnsMapper?: ColumnMapper

  @Column('id')
  id: number = 0

  @Column('data_source')
  dataSource: string = ''

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
  limit: number = 0

  // @Column('suggest')
  // suggest: boolean = false

  // @Column('share_strategy')
  // shareStrategy: string = ''
}

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
const CHART_CONFIG_TABLE_NAME = 'chart_config'
const DATA_SOURCE_NAME = 'data_middle_station'
const kewwordColumns = ['group', 'order', 'column', 'limit']
// 工具函数：格式化 SQL 字段名
function formatSqlKey(key: string) {
  if (kewwordColumns.includes(key)) {
    return `\`${key}\``
  }
  return key
}
/**
 * @desc 批量格式化 SQL 字段名
 * @param keys {string[]} 字段名数组
 * @returns {string} 格式化后的字段名
 */
function batchFormatSqlKey(keys: string[]) {
  return keys.map(formatSqlKey).join(',')
}
/**
 * @desc 批量格式化 SQL set 语句
 * @param keys {string[]} 字段名数组
 * @returns {string} 形如 key1 = ?, key2 = ?
 */
function batchFormatSqlSet(keys: string[]) {
  return keys
    .map(formatSqlKey)
    .map(key => `${key} = ?`)
    .join(', ')
}

@BindDataSource(DATA_SOURCE_NAME)
export class ChartConfigMapper extends BaseMapper {
  public dataSourceName = DATA_SOURCE_NAME
  // private
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
