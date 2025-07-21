import { BaseMapper } from './baseMapper'

const DATA_SOURCE_NAME = 'kanban_data'

/**
 * @desc 图表数据mapper
 */
export class ChartDataMapper extends BaseMapper {
  public dataSourceName = DATA_SOURCE_NAME

  /**
   * @desc 执行sql
   * @param sql {string} sql语句
   * @returns {Promise<GetAnswerDao.ChartDataDao>}
   */
  public async getChartData<T extends AnalyseDao.ChartData>(sql: string): Promise<T> {
    const data = await this.exe<T>(sql)
    return data
  }
}
