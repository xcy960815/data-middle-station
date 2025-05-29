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
    return this.databaseMapper.queryTable(tableName)
  }

  /**
   * @desc 查询表的列
   * @param tableName {string} 表名
   * @returns {Promise<Array<DatabaseVo.TableColumnOptionVo>>}
   */
  public async queryTableColumns(
    tableName: string
  ): Promise<Array<DatabaseVo.TableColumnOptionVo>> {
    return this.databaseMapper.queryTableColumns(
      toLine(tableName)
    )
  }
}
