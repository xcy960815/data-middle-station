/**
 * @desc 分析页面的dao层
 */
import { Column, BindDataSource, Mapping, DOBase } from './dobase';

export class AnalyseOptions implements TableInfoModule.TableListOption, TableInfoModule.TableColumnOption {
  // 表名
  @Column('table_name')
  tableName: string = '';
  // 列名
  @Column('column_name')
  columnName: string = '';
  // 列类型
  @Column('column_type')
  columnType: string = '';
  // 列注释
  @Column('column_comment')
  columnComment: string = '';
}

@BindDataSource('blog')
export class AnalyseDao extends DOBase {
  @Mapping(AnalyseOptions)
  protected async exe<T>(sql: string, params?: Array<any>): Promise<T> {
    return await super.exe<T>(sql, params);
  }
  /**
   * @datasource blog
   * @table table_info
   * @desc 查询当前数据库所有的表
   * @returns {Promise<Array<string>>}
   */
  public async queryTableList(): Promise<Array<TableInfoModule.TableColumnOption>> {
    const sql = `SELECT table_name FROM information_schema.tables WHERE table_type = 'BASE TABLE' AND table_schema='blog'`;
    return await this.exe<Array<TableInfoModule.TableColumnOption>>(sql);
  }
  /**
   * @datasource blog
   * @table table_info
   * @desc 根据表名查询数据
   * @param {number} id
   * @returns {Promise<Array<TableInfoModule.TableColumnOption>>}
   */
  public async queryTableColumns(
    tableName: string,
  ): Promise<Array<TableInfoModule.TableColumnOption>> {
    const sql =
      `SELECT column_name, column_type, column_comment FROM information_schema.columns  WHERE table_name = ? AND table_schema = 'blog';`
    return await this.exe<Array<TableInfoModule.TableColumnOption>>(sql, [tableName]);
  }
}

/**
 * @desc 查询图表数据 为什么不写在AnalyseDao 是因为这面走的查询是动态的
 */
@BindDataSource('blog')
export class GetAnswerDao extends DOBase {
    public async exe<T>(sql: string, params?: Array<any>): Promise<T> {
        return await super.exe<T>(sql, params);
    }
}
