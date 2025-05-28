import { BindDataSource, DOBase } from './dobase'

/**
 * @desc 查询图表数据 为什么不写在AnalyseDao 是因为这面走的查询是动态的
 */
@BindDataSource('kanban_data')
export class GetAnswerDao extends DOBase {
  public async exe<T>(sql: string): Promise<T> {
    return await super.exe<T>(sql)
  }
}
