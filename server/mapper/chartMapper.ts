import type { ResultSetHeader } from 'mysql2'
import {
  Column,
  BindDataSource,
  Mapping,
  BaseMapper
} from './baseMapper'

import { convertToSqlProperties } from '../utils/string-case-converter'

// 基础字段字典
export const CHART_BASE_FIELDS = [
  'id',
  'chart_name',
  'chart_type',
  'create_time',
  'update_time',
  'view_count',
  'created_by',
  'updated_by',
  'chart_config_id'
]

export class ChartMapping
  implements ChartDao.ChartOptionDao
{
  // 表名
  @Column('id')
  id: number = 0

  // 图表名称
  @Column('chart_name')
  chartName: string = ''

  // 图表类型
  @Column('chart_type')
  chartType: string = ''

  // 访问次数
  @Column('view_count')
  viewCount: number = 0

  // 创建时间
  @Column('create_time')
  createTime: string = ''

  // 更新时间
  @Column('update_time')
  updateTime: string = ''

  // 创建人
  @Column('created_by')
  createdBy: string = ''

  // 更新人
  @Column('updated_by')
  updatedBy: string = ''

  // 图表配置ID
  @Column('chart_config_id')
  chartConfigId: number = 0

  // // 图表配置
  // @Column('chart_config')
  // chartConfig: ChartDao.ChartOptionDao['chartConfig'] = {
  //   dataSource: '',
  //   column: [],
  //   dimension: [],
  //   filter: [],
  //   group: [],
  //   order: []
  // }
}

/**
 * @desc 本页面使用到的表
 */
const CHART_TABLE_NAME = 'chart'
const CHART_CONFIG_TABLE_NAME = 'chart_config'
const DATA_SOURCE_NAME = 'data_middle_station'

@BindDataSource(DATA_SOURCE_NAME)
export class ChartsMapper extends BaseMapper {
  /**
   * @desc 执行sql
   * @param sql {string} sql语句
   * @param params {Array<any>} 参数
   * @returns {Promise<T>}
   */
  protected async exe<T>(
    sql: string,
    params?: Array<any>
  ): Promise<T> {
    return await super.exe<T>(sql, params)
  }

  /**
   * @desc 新建图表
   * @param chart {ChartsOption} 图表
   * @returns {Promise<number>}
   */
  public async createChart(
    chartOption: ChartDao.ChartOptionDao
  ): Promise<boolean> {
    const { keys, values } =
      convertToSqlProperties(chartOption)
    const sql = `INSERT INTO ${CHART_TABLE_NAME} (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`
    const result = await this.exe<ResultSetHeader>(
      sql,
      values
    )
    return result.affectedRows > 0
  }

  /**
   * @desc 更新图表
   * @param chartOptionDao {ChartOptionDao} 图表
   * @returns {Promise<void>}
   */
  public async updateChart(
    chartOptionDao: ChartDao.ChartOptionDao
  ): Promise<boolean> {
    const {
      viewCount,
      createTime,
      createdBy,
      ...chartOption
    } = chartOptionDao
    const {
      keys: chartOptionKeys,
      values: chartOptionValues
    } = convertToSqlProperties(chartOption)
    const chartOptionSetClause = chartOptionKeys
      .map((key) => `${key} = ?`)
      .join(', ')

    // 更新 chart 表
    const updateChartSql = `UPDATE ${CHART_TABLE_NAME} SET ${chartOptionSetClause} WHERE id = ?`

    const chartResult = await this.exe<ResultSetHeader>(
      updateChartSql,
      [...chartOptionValues, chartOption.id]
    )

    return chartResult.affectedRows > 0
  }

  /**
   * @desc 更新图表的访问次数
   * @param id {number} 图表id
   */
  public async updateViewCount(
    id: number
  ): Promise<number> {
    const sql = `UPDATE ${CHART_TABLE_NAME} SET view_count = view_count + 1 WHERE id = ?`
    return await this.exe<number>(sql, [id])
  }

  /**
   * @desc 获取图表
   * @param id {number} 图表id
   * @returns {Promise<ChartDao.ChartOptionDao>}
   */
  @Mapping(ChartMapping)
  public async getChartById<
    T extends ChartDao.ChartOptionDao
  >(id: number): Promise<T> {
    // 更新访问次数 不知道为什么报错
    await this.updateViewCount(id)
    // const sql = `select
    //   c.id,
    //   c.chart_name,
    //   c.chart_type,
    //   c.create_time,
    //   c.update_time,
    //   c.view_count,
    //   c.created_by,
    //   c.updated_by,
    //   c.chart_config_id,
    //   JSON_OBJECT(
    //     'chart_config_id', cc.id,
    //     'data_source', cc.data_source,
    //     'column', cc.column,
    //     'dimension', cc.dimension,
    //     'filter', cc.filter,
    //     'group', cc.group,
    //     'order', cc.order
    //   ) as chart_config
    // from ${CHART_TABLE_NAME} c
    // left join ${CHART_CONFIG_TABLE_NAME} cc on c.chart_config_id = cc.id
    // where c.id = ?`
    const sql = `select 
      ${CHART_BASE_FIELDS.join(',\n    ')}
    from ${CHART_TABLE_NAME} where id = ?`

    const result = await this.exe<Array<T>>(sql, [id])
    return result?.[0]
  }

  /**
   * @desc 删除图表
   * @param id {number} 图表id
   * @returns {Promise<number>}
   */
  public async deleteChart(id: number): Promise<number> {
    const sql = `delete from ${CHART_TABLE_NAME} where id = ?`
    return await this.exe<number>(sql, [id])
  }

  /**
   * @desc 获取所有的图表
   * @returns {Promise<Array<ChartDao.ChartOptionDao>>}
   */
  @Mapping(ChartMapping)
  public async getCharts<
    T extends ChartDao.ChartOptionDao
  >(): Promise<Array<T>> {
    const sql = `
    select 
      ${CHART_BASE_FIELDS.join(',\n    ')}
    from ${CHART_TABLE_NAME}`
    return await this.exe<Array<T>>(sql)
  }
}
