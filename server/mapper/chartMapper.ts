import type { ResultSetHeader } from 'mysql2'
import {
  Column,
  Mapping,
  BaseMapper,
  Row,
  entityColumnsMap,
  mapToTarget,
  IColumnTarget,
} from './baseMapper'

// 基础字段字典
export const CHART_BASE_FIELDS = [
  'id',
  'chart_name',
  'chart_desc',
  'create_time',
  'update_time',
  'view_count',
  'created_by',
  'updated_by',
  'chart_config_id',
]

export class ChartMapping implements ChartDao.ChartOption, IColumnTarget {
  columnsMapper(data: Array<Row> | Row): Array<Row> | Row {
    return mapToTarget(this, data, entityColumnsMap.get(this.constructor))
  }

  // 表名
  @Column('id')
  id!: number

  // 图表名称
  @Column('chart_name')
  chartName!: string

  // 图表描述
  @Column('chart_desc')
  chartDesc!: string

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
}

/**
 * @desc 本页面使用到的表
 */
const CHART_TABLE_NAME = 'chart'
// const CHART_CONFIG_TABLE_NAME = 'chart_config'
const DATA_SOURCE_NAME = 'data_middle_station'

export class ChartMapper extends BaseMapper {
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
   * @desc 新建图表
   * @param chart {ChartsOption} 图表
   * @returns {Promise<number>}
   */
  public async createChart(chartOption: ChartDto.ChartOption): Promise<boolean> {
    const { keys, values } = convertToSqlProperties(chartOption)
    const sql = `INSERT INTO ${CHART_TABLE_NAME} (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`
    const result = await this.exe<ResultSetHeader>(sql, values)
    return result.affectedRows > 0
  }

  /**
   * @desc 更新图表
   * @param chartOptionDto {ChartDto.ChartOption} 图表
   * @returns {Promise<void>}
   */
  public async updateChart(chartOptionDto: ChartDto.ChartOption): Promise<boolean> {
    const { viewCount, createTime, createdBy, ...chartOption } = chartOptionDto
    const { keys: chartOptionKeys, values: chartOptionValues } = convertToSqlProperties(chartOption)
    const chartOptionSetClause = chartOptionKeys.map(key => `${key} = ?`).join(', ')

    // 更新 chart 表
    const updateChartConfigSql = `UPDATE ${CHART_TABLE_NAME} SET ${chartOptionSetClause} WHERE id = ?`
    const chartResult = await this.exe<ResultSetHeader>(updateChartConfigSql, [
      ...chartOptionValues,
      chartOption.id,
    ])

    return chartResult.affectedRows > 0
  }

  /**
   * @desc 更新图表的访问次数
   * @param id {number} 图表id
   */
  public async updateViewCount(id: number): Promise<number> {
    const sql = `UPDATE ${CHART_TABLE_NAME} SET view_count = view_count + 1 WHERE id = ?`
    return await this.exe<number>(sql, [id])
  }

  /**
   * @desc 获取图表
   * @param id {number} 图表id
   * @returns {Promise<ChartDao.ChartOption>}
   */
  @Mapping(ChartMapping)
  public async getChart<T extends ChartDao.ChartOption>(id: number): Promise<T> {
    // 更新访问次数 不知道为什么报错
    await this.updateViewCount(id)
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
   * @returns {Promise<Array<ChartDao.ChartOption>>}
   */
  @Mapping(ChartMapping)
  public async getCharts<T extends ChartDao.ChartOption>(): Promise<Array<T>> {
    const sql = `
    select 
      ${CHART_BASE_FIELDS.join(',\n    ')}
    from ${CHART_TABLE_NAME}`
    return await this.exe<Array<T>>(sql)
  }
}
