/**
 * @desc 表格的dao层
 */
import { Column, BindDataSource, Mapping, DOBase } from './dobase';
import { toHump } from "./utils"

const NUMBER_TYPE_ENUM = ['tinyint', 'smallint', 'mediumint', 'int', 'bigint', 'decimal', 'float', 'double']
const STRING_TYPE_ENUM = ['char', 'varchar', 'tinytext', 'text', 'mediumtext', 'longtext', 'tinyblob', 'blob', 'mediumblob', 'longblob']
const DATE_TYPE_ENUM = ['date', 'datetime', 'timestamp', 'time', 'year']

export class TableDaoMapping implements TableInfoModule.TableListOption, TableInfoModule.TableColumnOption {
  // 表名
  @Column('table_name')
  tableName: string = '';

  // 列名
  @Column('column_name')
  columnName(value: string) {
    return toHump(value)
  }
  // 列类型
  @Column('column_type')
  columnType = (value: string) => {
    if (NUMBER_TYPE_ENUM.includes(value)) {
      return 'number'
    } else if (STRING_TYPE_ENUM.includes(value)) {
      return 'string'
    } else if (DATE_TYPE_ENUM.includes(value)) {
      return 'date'
    } else {
      return value
    }
  }

  // 列注释
  @Column('column_comment')
  columnComment: string = '';

  // 别名
  @Column('alias')
  alias = () => {
    return this.columnName as unknown as string
  }

  // 显示名称
  @Column('display_name')
  displayName = () => {
    return this.columnName as unknown as string
  }
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
      // `SELECT column_name, column_type, column_comment FROM information_schema.columns  WHERE table_name = ? AND table_schema = 'blog';`
      `SELECT 
          column_name, 
          REPLACE(SUBSTRING_INDEX(column_type, '(', 1), ' ', '') AS column_type,  -- 去掉类型后面的长度
          column_comment 
      FROM 
          information_schema.columns  
      WHERE 
          table_name = ? 
          AND table_schema = 'blog';`
    return await this.exe<Array<TableInfoModule.TableColumnOption>>(sql, [tableName]);
  }
}


