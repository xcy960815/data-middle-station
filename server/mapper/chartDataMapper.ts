import { BaseMapper } from '@/server/mapper/baseMapper'

/**
 * @desc 图表数据所在的数据源名称
 */
const DATA_SOURCE_NAME = 'kanban_data'

/**
 * @desc 图表数据 mapper，负责从看板数据源中查询图表数据
 */
export class ChartDataMapper extends BaseMapper {
  /**
   * @desc 当前 mapper 使用的数据源名称
   */
  public dataSourceName = DATA_SOURCE_NAME

  /**
   * @desc 执行 SQL 并返回图表分析数据
   * @param sql 用于查询图表数据的完整 SQL 语句
   * @returns 图表数据列表
   */
  public async getAnalyzeData<T extends Array<AnalyzeDataDao.ChartData>>(sql: string): Promise<T> {
    const data = await this.exe<T>(sql)
    return data
  }
}
