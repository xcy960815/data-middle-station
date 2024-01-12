

/**
 * @desc 页面的dao层
 */
import { Column, BindDataSource, Mapping, DOBase } from './dobase';
import dayjs from 'dayjs';
export class ChartsMapping implements ChartsModule.ChartsMappingOption {
  // 表名
  @Column('id')
  id: number = 0;
  // 图表名称
  @Column('name')
  name: string = '';

  // 过滤条件
  @Column('filter')
  filter = (value: string): Array<FilterStore.FilterOption> => {
    return JSON.parse(value)
  };
  // 分组条件
  @Column('group')
  group = (value: string): Array<GroupStore.GroupOption> => {
    return JSON.parse(value)
  };
  // 维度条件
  @Column('dimension')
  dimension = (value: string): Array<DimensionStore.DimensionOption> => {
    return JSON.parse(value)
  };
  // 排序条件
  @Column('order')
  order = (value: string): Array<OrderStore.OrderOption> => {
    return JSON.parse(value)
  };
  // 创建时间
  @Column('create_time')
  createTime: string = '';

  // 更新时间
  @Column('update_time')
  updateTime: string = '';

  @Column('visits')
  visits: number = 0;

}

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
    const sql = "INSERT INTO charts (name, filter, `group`, dimension, `order`, create_time, update_time) VALUES (?, ?, ?, ?, ?, ?, ?);"
    return await this.exe<number>(sql, [chart.name, JSON.stringify(chart.filter), JSON.stringify(chart.group), JSON.stringify(chart.dimension), JSON.stringify(chart.order), createTime, updateTime])
  }

  /**
   * @desc 更新图表
   * @param chart {ChartsOption} 图表
   * @returns {Promise<number>}
   */
  public async updateChart(chart: ChartsModule.ChartsParamsOption): Promise<number> {
    const updateTime = dayjs().format('YYYY-MM-DD HH:mm:ss')
    const sql = `UPDATE charts SET name = ?, filter = ?, \`group\` = ?, dimension = ?, \`order\` = ?, update_time = ? WHERE id = ?`
    return await this.exe<number>(sql, [chart.name, JSON.stringify(chart.filter), JSON.stringify(chart.group), JSON.stringify(chart.dimension), JSON.stringify(chart.order), updateTime, chart.id])
  }
  
  /**
   * @desc 删除图表
   * @param id {number} 图表id
   * @returns {Promise<number>}
   */
  public async deleteChart(id: number): Promise<number> {
    const sql = `delete from charts where id = ?`
    return await this.exe<number>(sql, [id])
  }

  /**
   * @desc 获取所有的图表
   * @returns {Promise<Array<ChartsOption>>}
   */
  public async getCharts(): Promise<Array<ChartsModule.ChartsParamsOption>> {
    const sql = `select * from charts`
    return await this.exe<Array<ChartsModule.ChartsParamsOption>>(sql)
  }

}


