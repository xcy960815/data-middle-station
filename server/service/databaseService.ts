import { DatabaseMapper } from '../mapper/databaseMapper'
import { toLine } from '../utils/string-case-converter'

export class DatabaseService {
  private databaseMapper: DatabaseMapper

  constructor() {
    this.databaseMapper = new DatabaseMapper()
  }

  /**
   * @desc 查询表
   * @param tableName {string} 表名
   * @returns {Promise<Array<DatabaseVo.TableOptionVo>>}
   */
  public async queryTable(
    tableName: string
  ): Promise<Array<DatabaseVo.TableOptionVo>> {
    const result =
      await this.databaseMapper.queryTable(tableName)
    return result.map((item) => ({
      ...item,
      createTime:
        typeof item.createTime === 'function'
          ? item.createTime('')
          : item.createTime,
      updateTime:
        typeof item.updateTime === 'function'
          ? item.updateTime('')
          : item.updateTime,
      tableName:
        typeof item.tableName === 'function'
          ? item.tableName('')
          : item.tableName,
      tableType:
        typeof item.tableType === 'function'
          ? item.tableType('')
          : item.tableType,
      tableComment: item.tableComment,
      engine:
        typeof item.engine === 'function'
          ? item.engine('')
          : item.engine,
      tableCollation:
        typeof item.tableCollation === 'function'
          ? item.tableCollation('')
          : item.tableCollation
    }))
  }

  /**
   * @desc 查询表的列
   * @param tableName {string} 表名
   * @returns {Promise<Array<DatabaseVo.TableColumnOptionVo>>}
   */
  public async queryTableColumns(
    tableName: string
  ): Promise<Array<DatabaseVo.TableColumnOptionVo>> {
    const result =
      await this.databaseMapper.queryTableColumns(
        toLine(tableName)
      )
    return result.map((item) => {
      return {
        columnName:
          typeof item.columnName === 'function'
            ? item.columnName('')
            : item.columnName,
        columnType:
          typeof item.columnType === 'function'
            ? item.columnType('')
            : item.columnType,
        columnComment: item.columnComment,
        alias:
          typeof item.columnName === 'function'
            ? item.columnName('')
            : item.columnName,
        displayName:
          typeof item.columnName === 'function'
            ? item.columnName('')
            : item.columnName
      }
    })
  }
}
