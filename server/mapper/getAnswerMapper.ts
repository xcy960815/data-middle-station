import { BindDataSource, BaseMapper } from './baseMapper'

/**
 * @desc 查询图表数据 为什么不写在AnalyseDao 是因为这面走的查询是动态的
 */
const dataSource = 'kanban_data'
@BindDataSource(dataSource)
export class GetAnswerMapper extends BaseMapper {
  public async exe<T>(sql: string): Promise<T> {
    return await super.exe<T>(sql)
  }

  public async getAnswer(
    sql: string
  ): Promise<GetAnswerDao.ChartDataDao> {
    return await this.exe<GetAnswerDao.ChartDataDao>(sql)
  }
}
