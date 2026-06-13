import { BaseMapper } from '@/server/mapper/baseMapper'

/**
 * 图表数据所在的数据源名称
 */
const DATA_SOURCE_NAME = 'kanban_data'

/**
 * 图表数据 mapper，负责从看板数据源中查询图表数据
 */
export class ChartDataMapper extends BaseMapper {
  /** 当前 mapper 使用的数据源名称 */
  public dataSourceName = DATA_SOURCE_NAME

  /**
   * 执行指定的 SQL 语句，查询并返回图表数据列表
   *
   * @template T 返回的数据数组类型
   * @param {string} sql 用于查询图表数据的完整 SQL 语句
   * @param {any[]} [params] 预编译 SQL 参数数组
   * @returns {Promise<T>} 图表数据列表 Promise
   */
  public async getAnalyzeData<T extends Array<AnalyzeDataDao.AnalyzeData>>(sql: string, params?: any[]): Promise<T> {
    const data = await this.exe<T>(sql, params)
    return data
  }
}
