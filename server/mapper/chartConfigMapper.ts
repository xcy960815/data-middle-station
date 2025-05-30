import {
  Column,
  BindDataSource,
  Mapping,
  BaseMapper
} from './baseMapper'
import { convertToSqlProperties } from '../utils/string-case-converter'

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
  public async getChartConfigById(
    id: number
  ): Promise<ChartConfigDao.ChartConfigOptionDao> {
    const sql = `select 
            id,
            data_source,
            column,
            dimension,
            filter,
            group,
            order
            from ${CHART_CONFIG_TABLE_NAME} where id = ?`
    return await this.exe<ChartConfigDao.ChartConfigOptionDao>(
      sql,
      [id]
    )
  }
  /**
   * @desc 创建图表配置
   * @param chartConfig {ChartConfigDao.ChartConfigOptionDao} 图表配置
   * @returns {Promise<number>} 图表配置ID
   */
  public async createChartConfig(
    chartConfig: ChartConfigDao.ChartConfigOptionDao
  ): Promise<boolean> {
    const { keys, values } =
      convertToSqlProperties(chartConfig)
    const sql = `insert into ${CHART_CONFIG_TABLE_NAME} (${keys.join(',')}) values (${keys.map(() => '?').join(',')})`
    return (await this.exe<number>(sql, values)) > 0
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
    const sql = `update ${CHART_CONFIG_TABLE_NAME} set ${keys.map((field) => `${field} = ?`).join(',')} where id = ?`
    return (
      (await this.exe<number>(sql, [
        ...values,
        chartConfig.id
      ])) > 0
    )
  }
}
