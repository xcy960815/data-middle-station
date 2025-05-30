import {
  Column,
  BindDataSource,
  Mapping,
  BaseMapper
} from './baseMapper'
import { convertToSqlProperties } from '../utils/string-case-converter'
import { ResultSetHeader } from 'mysql2'

export class ChartConfigMapping
  implements ChartConfigDao.ChartConfigOptionDao
{
  @Column('id')
  id: number = 0

  @Column('data_source')
  dataSource: string = ''

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
}

const CHART_CONFIG_BASE_FIELDS = [
  'id',
  'data_source',
  'column',
  'dimension',
  'filter',
  'group',
  'order'
]
const CHART_CONFIG_TABLE_NAME = 'chart_config'
const DATA_SOURCE_NAME = 'data_middle_station'

@BindDataSource(DATA_SOURCE_NAME)
export class ChartConfigMapper extends BaseMapper {
  /**
   * @desc 获取图表配置
   * @param id {number} 图表配置ID
   * @returns {Promise<ChartConfigDao.ChartConfigOptionDao>} 图表配置
   */
  @Mapping(ChartConfigMapping)
  public async getChartConfigById<
    T extends ChartConfigDao.ChartConfigOptionDao
  >(id: number): Promise<T> {
    const sql = `select 
            id,
            data_source,
            \`column\`,
            dimension,
            filter,
            \`group\`,
            \`order\`
            from ${CHART_CONFIG_TABLE_NAME} where id = ?`
    const result = await this.exe<Array<T>>(sql, [id])
    return result?.[0]
  }
  /**
   * @desc 创建图表配置
   * @param chartConfig {ChartConfigDao.ChartConfigOptionDao} 图表配置
   * @returns {Promise<number>} 图表配置ID
   */
  public async createChartConfig(
    chartConfig: ChartConfigDao.ChartConfigOptionDao
  ): Promise<number> {
    const { keys, values } =
      convertToSqlProperties(chartConfig)
    // 只使用数据库表中存在的字段
    const validKeys = keys.filter((key) =>
      CHART_CONFIG_BASE_FIELDS.includes(key)
    )
    const validValues = validKeys.map(
      (key) => values[keys.indexOf(key)]
    )
    const sql = `insert into ${CHART_CONFIG_TABLE_NAME} (${validKeys
      .map((key) => {
        if (
          key === 'group' ||
          key === 'order' ||
          key === 'column'
        ) {
          return `\`${key}\``
        }
        return key
      })
      .join(
        ','
      )}) values (${validKeys.map(() => '?').join(',')})`
    const result = await this.exe<ResultSetHeader>(
      sql,
      validValues
    )
    return result.insertId || 0
  }

  /**
   * @desc 更新图表配置
   * @param chartConfig {ChartConfigDao.ChartConfigOptionDao} 图表配置
   * @returns {Promise<number>} 图表配置ID
   */
  public async updateChartConfig(
    chartConfig: ChartConfigDao.ChartConfigOptionDao
  ): Promise<boolean> {
    const { keys, values } =
      convertToSqlProperties(chartConfig)
    const sql = `update ${CHART_CONFIG_TABLE_NAME} set ${keys
      .map((field) => {
        if (
          field === 'group' ||
          field === 'order' ||
          field === 'column'
        ) {
          return `\`${field}\` = ?`
        }
        return `${field} = ?`
      })
      .join(',')} where id = ?`
    return (
      (await this.exe<number>(sql, [
        ...values,
        chartConfig.id
      ])) > 0
    )
  }
}
