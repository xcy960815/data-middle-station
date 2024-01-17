

/**
 * @desc 首页的dao层
 */

import { Column, BindDataSource, Mapping, DOBase } from './dobase';
import dayjs from 'dayjs';
import { getObjectProperties } from './common';

export class ChartsMapping implements ChartsModule.ChartsMappingOption {

  // 表名
  @Column('id')
  id: number = 0;

  // 图表名称
  @Column('chart_name')
  chartName: string = '';

  // 图表类型
  @Column('chart_type')
  chartType: string = '';

  // 表名
  @Column('table_name')
  tableName: string = '';

  // 过滤条件
  @Column('filter')
  filter = (value: string): Array<FilterStore.FilterOption> => JSON.parse(value)

  // 分组条件
  @Column('group')
  group = (value: string): Array<GroupStore.GroupOption> => JSON.parse(value)

  // 维度条件
  @Column('dimension')
  dimension = (value: string): Array<DimensionStore.DimensionOption> => JSON.parse(value)

  // 排序条件
  @Column('order')
  order = (value: string): Array<OrderStore.OrderOption> => JSON.parse(value)

  // 创建时间
  @Column('create_time')
  createTime: string = '';

  // 更新时间
  @Column('update_time')
  updateTime: string = '';

  // 访问次数
  @Column('visits')
  visits: number = 0;

}

/**
 * @desc 本页面使用到的表
 */
const CHARTNAME = 'charts';

@BindDataSource('blog')
export class ChartsDao extends DOBase {

  @Mapping(ChartsMapping)
  /**
   * @desc 执行sql
   * @param sql {string} sql语句
   * @param params {Array<any>} 参数
   * @returns {Promise<T>}
   */
  protected async exe<T>(sql: string, params?: Array<any>): Promise<T> {
    return await super.exe<T>(sql, params);
  }

  /**
   * @desc 新建图表
   * @param chart {ChartsOption} 图表
   * @returns {Promise<number>}
   */
  public async createChart(chart: ChartsModule.ChartsParamsOption): Promise<number> {
    const createTime = dayjs().format('YYYY-MM-DD HH:mm:ss')
    const updateTime = createTime
    const sql = "INSERT INTO " + CHARTNAME + " (chart_name, filter, `group`, dimension, `order`, create_time, update_time) VALUES (?, ?, ?, ?, ?, ?, ?);"
    return await this.exe<number>(sql, [chart.chartName, JSON.stringify(chart.filter), JSON.stringify(chart.group), JSON.stringify(chart.dimension), JSON.stringify(chart.order), createTime, updateTime])
  }

  /**
   * @desc 更新图表
   * @param chart {ChartsOption} 图表
   * @returns {Promise<void>}
   */
  public async updateChart(chartOption: ChartsModule.ChartsParamsOption): Promise<void> {
    const { keys, values } = getObjectProperties(chartOption);
    const setClause = keys.map((key) => `${key} = ?`).join(', ');
    const sql = `UPDATE ${CHARTNAME} SET ${setClause} WHERE id = ?`;
    await this.exe<number>(sql, [...values, chartOption.id]);

  }

  /**
   * @desc 更新图表的访问次数
   * @param id {number} 图表id
   */
  public async updateChartVisits(id: number): Promise<number> {
    const sql = `UPDATE ${CHARTNAME} SET visits = visits + 1 WHERE id = ?`
    return await this.exe<number>(sql, [id])
  }

  /**
   * @desc 获取图表
   * @param id {number} 图表id
   * @returns {Promise<ChartsOption>}
   */
  public async getChartById(id: number): Promise<ChartsModule.ChartsOption> {
    // 更新访问次数 不知道为什么报错
    // await this.updateChartVisits(id)
    const sql = `select * from ${CHARTNAME} where id = ?`
    const result = await this.exe<Array<ChartsModule.ChartsOption>>(sql, [id])
    // log("result",result)
    return result?.[0]
  }

  /**
   * @desc 删除图表
   * @param id {number} 图表id
   * @returns {Promise<number>}
   */
  public async deleteChart(id: number): Promise<number> {
    const sql = `delete from ${CHARTNAME} where id = ?`
    return await this.exe<number>(sql, [id])
  }

  /**
   * @desc 获取所有的图表
   * @returns {Promise<Array<ChartsOption>>}
   */
  public async getCharts(): Promise<Array<ChartsModule.ChartsOption>> {
    const sql = `select * from ${CHARTNAME}`
    return await this.exe<Array<ChartsModule.ChartsOption>>(sql)
  }

}


