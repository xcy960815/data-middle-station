/**
 * @desc 表格的dao层
 */
import { Column, BindDataSource, Mapping, DOBase } from './dobase';

export class TableDaoMapping implements TableInfoModule.TableListOption, TableInfoModule.TableColumnOption {
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
export class TableDao extends DOBase {
  @Mapping(TableDaoMapping)
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
   * @desc 查询所有的表名
   * @datasource blog
   * @returns {Promise<Array<TableInfoModule.TableListOption>>}
   */
  public async queryTableList(): Promise<Array<TableInfoModule.TableListOption>> {
    const sql = `SELECT table_name FROM information_schema.tables WHERE table_type = 'BASE TABLE' AND table_schema='blog'`;
    return await this.exe<Array<TableInfoModule.TableListOption>>(sql);
  }
  /**
   * @desc 查询表的所有列
   * @param tableName {string} 表名
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


