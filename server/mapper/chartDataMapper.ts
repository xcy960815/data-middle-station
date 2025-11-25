import { BaseMapper } from '@/server/mapper/baseMapper'

const DATA_SOURCE_NAME = 'kanban_data'

/**
 * @desc 图表数据mapper
 */
export class ChartDataMapper extends BaseMapper {
  /**
   * @desc 数据源名称
   */
  public dataSourceName = DATA_SOURCE_NAME

  /**
   * @desc 执行sql
   * @param sql {string} sql语句
   * @returns {Promise<Array<ChartDataDao.ChartData>>}
   */
  public async getChartData<T extends Array<ChartDataDao.ChartData>>(sql: string): Promise<T> {
    const data = await this.exe<T>(sql)
    return data
  }
}
