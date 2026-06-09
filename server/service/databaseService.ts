import { DatabaseMapper } from '@/server/mapper/databaseMapper'
import { BaseService } from '@/server/service/baseService'

/**
 * @desc 数据库服务
 */
export class DatabaseService extends BaseService {
  /**
   * @desc 数据库映射器
   */
  private databaseMapper: DatabaseMapper

  /**
   * @desc 构造函数
   */
  constructor() {
    super()
    this.databaseMapper = new DatabaseMapper()
  }

  /**
   * @desc 查询当前数据库中所有表
   * @param {DatabaseDto.GetDatabaseTablesRequest} getDatabaseTablesRequest 查询表请求参数
   * @returns {Promise<Array<DatabaseVo.TableItem>>}
   */
  public async getDatabaseTables(
    getDatabaseTablesRequest: DatabaseDto.GetDatabaseTablesRequest
  ): Promise<Array<DatabaseVo.TableItem>> {
    this.assertCurrentUserAdmin('仅管理员可查看数据库表信息')
    return await this.listDatabaseTables(getDatabaseTablesRequest)
  }

  /**
   * @desc 查询当前数据库中表的列（需管理员权限）。面向数据库元数据管理 API。
   * @param {DatabaseDto.GetTableColumnsRequest} getTableColumnsRequest 查询表请求参数
   * @returns {Promise<Array<DatabaseVo.TableColumnItem>>}
   * @see getTableColumnsForAnalyzeQuery 分析查询内部使用，无管理员权限要求
   */
  public async getTableColumns(
    getTableColumnsRequest: DatabaseDto.GetTableColumnsRequest
  ): Promise<Array<DatabaseVo.TableColumnItem>> {
    this.assertCurrentUserAdmin('仅管理员可查看数据库列信息')
    return await this.listTableColumns(getTableColumnsRequest)
  }

  /**
   * @desc 分析查询内部读取表字段，不直接暴露给数据库元数据 API。无管理员权限要求，由 ChartDataService 在权限校验通过后调用。
   * @param {DatabaseDto.GetTableColumnsRequest} getTableColumnsRequest 查询表列请求参数
   * @returns {Promise<Array<DatabaseVo.TableColumnItem>>}
   * @see getTableColumns 面向管理员的数据库元数据 API，带权限守卫
   */
  public async getTableColumnsForAnalyzeQuery(
    getTableColumnsRequest: DatabaseDto.GetTableColumnsRequest
  ): Promise<Array<DatabaseVo.TableColumnItem>> {
    return await this.listTableColumns(getTableColumnsRequest)
  }

  private async listDatabaseTables(
    getDatabaseTablesRequest: DatabaseDto.GetDatabaseTablesRequest
  ): Promise<Array<DatabaseVo.TableItem>> {
    const tableParams: DatabaseDao.GetTablesParams = {
      tableName: getDatabaseTablesRequest.tableName?.trim()
    }
    const tableRecords = await this.databaseMapper.getDatabaseTables(tableParams)
    return tableRecords.map((tableRecord) => this.convertTableRecordToItem(tableRecord))
  }

  private async listTableColumns(
    getTableColumnsRequest: DatabaseDto.GetTableColumnsRequest
  ): Promise<Array<DatabaseVo.TableColumnItem>> {
    const tableName = getTableColumnsRequest.tableName?.trim()
    if (!tableName) {
      throw new Error('表名不能为空')
    }

    const tableColumnParams: DatabaseDao.GetTableColumnsParams = {
      tableName
    }
    const columnRecords = await this.databaseMapper.getTableColumns(tableColumnParams)
    return columnRecords.map((columnRecord) => {
      return {
        columnName: columnRecord.columnName,
        columnType: columnRecord.columnType,
        columnComment: columnRecord.columnComment,
        displayName: columnRecord.columnComment
      }
    })
  }

  /**
   * @desc 将数据库表记录转换为接口返回对象。
   */
  private convertTableRecordToItem(tableRecord: DatabaseDao.TableRecord): DatabaseVo.TableItem {
    return {
      ...tableRecord,
      createTime: tableRecord.createTime,
      updateTime: tableRecord.updateTime,
      tableName: tableRecord.tableName,
      tableType: tableRecord.tableType,
      tableComment: tableRecord.tableComment,
      engine: tableRecord.engine,
      tableCollation: tableRecord.tableCollation
    }
  }
}
