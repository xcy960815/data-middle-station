import { BindDataSource, DOBase } from './dobase'

/**
 * @desc 查询图表数据 为什么不写在AnalyseDao 是因为这面走的查询是动态的
 */
@BindDataSource('blog')
export class GetAnswerDao extends DOBase {
  public async exe<T>(
    sql: string,
    params?: Array<any>
  ): Promise<T> {
    return await super.exe<T>(sql, params)
  }
}
