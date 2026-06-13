import { DatabaseMapper } from '@/server/mapper/databaseMapper'
import { BaseService } from '@/server/service/baseService'

/**
 * @class DatabaseService
 * @extends BaseService
 * @description 数据库元数据服务类，用于获取数据库表、列等元数据信息，提供面向管理员的管理接口和面向分析查询的内部接口。
 */
export class DatabaseService extends BaseService {
  /**
   * 数据库元数据数据访问映射器
   * @private
   * @type {DatabaseMapper}
   */
  private databaseMapper: DatabaseMapper

  /**
   * 构造函数，初始化数据库映射器
   */
  constructor() {
    super()
    this.databaseMapper = new DatabaseMapper()
  }

  /**
   * 查询当前数据库中的所有表（需管理员权限）
   * @public
   * @param {DatabaseDto.GetDatabaseTablesRequest} getDatabaseTablesRequest 查询表请求参数
   * @throws {Error} 当前登录用户不是管理员时抛出异常
   * @returns {Promise<Array<DatabaseVo.TableItem>>} 数据库表信息列表
   */
  public async getDatabaseTables(
    getDatabaseTablesRequest: DatabaseDto.GetDatabaseTablesRequest
  ): Promise<Array<DatabaseVo.TableItem>> {
    this.assertCurrentUserAdmin('仅管理员可查看数据库表信息')
    return await this.listDatabaseTables(getDatabaseTablesRequest)
  }

  /**
   * 查询当前数据库中表的列（需管理员权限）。面向数据库元数据管理 API。
   * @public
   * @param {DatabaseDto.GetTableColumnsRequest} getTableColumnsRequest 查询表请求参数
   * @throws {Error} 当前登录用户不是管理员时抛出异常
   * @returns {Promise<Array<DatabaseVo.TableColumnItem>>} 表的列信息列表
   * @see getTableColumnsForAnalyzeQuery 分析查询内部使用，无管理员权限要求
   */
  public async getTableColumns(
    getTableColumnsRequest: DatabaseDto.GetTableColumnsRequest
  ): Promise<Array<DatabaseVo.TableColumnItem>> {
    this.assertCurrentUserAdmin('仅管理员可查看数据库列信息')
    return await this.listTableColumns(getTableColumnsRequest)
  }

  /**
   * 分析查询内部读取表字段，不直接暴露给数据库元数据 API。无管理员权限要求，由 ChartDataService 在权限校验通过后调用。
   * @public
   * @param {DatabaseDto.GetTableColumnsRequest} getTableColumnsRequest 查询表列请求参数
   * @returns {Promise<Array<DatabaseVo.TableColumnItem>>} 表的列信息列表
   * @see getTableColumns 面向管理员的数据库元数据 API，带权限守卫
   */
  public async getTableColumnsForAnalyzeQuery(
    getTableColumnsRequest: DatabaseDto.GetTableColumnsRequest
  ): Promise<Array<DatabaseVo.TableColumnItem>> {
    return await this.listTableColumns(getTableColumnsRequest)
  }

  /**
   * 内部方法：获取数据库表列表并转换
   * @private
   * @param {DatabaseDto.GetDatabaseTablesRequest} getDatabaseTablesRequest 查询表请求参数
   * @returns {Promise<Array<DatabaseVo.TableItem>>} 转换后的表项列表
   */
  private async listDatabaseTables(
    getDatabaseTablesRequest: DatabaseDto.GetDatabaseTablesRequest
  ): Promise<Array<DatabaseVo.TableItem>> {
    const tableParams: DatabaseDao.GetTablesParams = {
      tableName: getDatabaseTablesRequest.tableName?.trim()
    }
    const tableRecords = await this.databaseMapper.getDatabaseTables(tableParams)
    return tableRecords.map((tableRecord) => this.convertTableRecordToItem(tableRecord))
  }

  /**
   * 内部方法：获取表的列元数据并转换
   * @private
   * @param {DatabaseDto.GetTableColumnsRequest} getTableColumnsRequest 查询表列请求参数
   * @throws {Error} 当表名为空或未提供时抛出异常
   * @returns {Promise<Array<DatabaseVo.TableColumnItem>>} 转换后的列信息列表
   */
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
   * 将数据库表记录转换为接口返回对象
   * @private
   * @param {DatabaseDao.TableRecord} tableRecord 数据库表记录
   * @returns {DatabaseVo.TableItem} 转换后的接口返回对象
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
