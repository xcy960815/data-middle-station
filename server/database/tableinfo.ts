import { Column, BindDataSource, Mapping, DOBase } from './dobase';

export class TableInfoOptions implements TableInfoModule.TableInfoOptions {
  @Column('table_name')
  tableName: string = '';
  @Column('field_name')
  fieldName: string = '';
  @Column('field_type')
  fieldType: string = '';
  @Column('field_comment')
  fieldComment: string = '';
}

@BindDataSource('blog')
export class TableInfoDao extends DOBase {
  @Mapping(TableInfoOptions)
  protected async exe<T>(sql: string, params?: Array<any>): Promise<T> {
    return await super.exe<T>(sql, params);
  }
  /**
   * @datasource blog
   * @table table_info
   * @desc 查询当前数据库所有的表
   * @returns {Promise<Array<string>>}
   */
  public async queryTableList(): Promise<Array<TableInfoModule.TableInfoOptions>> {
    const sql = `SELECT table_name FROM information_schema.tables WHERE table_type = 'BASE TABLE' AND table_schema='blog'`;
    return await this.exe<Array<TableInfoModule.TableInfoOptions>>(sql);
  }
  /**
   * @datasource blog
   * @table table_info
   * @desc 根据表名查询数据
   * @param {number} id
   * @returns {Promise<Array<TableInfoModule.TableInfoOptions>>}
   */
  public async queryTableColumByTableName(
    tableName: string,
  ): Promise<Array<TableInfoModule.TableInfoOptions>> {
    const sql =
      'SELECT table_name, field_name, field_type, field_comment FROM blog.table_info WHERE table_name = ?';
    return await this.exe<Array<TableInfoModule.TableInfoOptions>>(sql, [tableName]);
  }
}
