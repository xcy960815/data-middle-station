import { DatabaseMapper } from '@/server/mapper/databaseMapper'

/**
 * @desc 数据库服务
 */
export class DatabaseService {
  /**
   * @desc 数据库映射器
   */
  private databaseMapper: DatabaseMapper

  /**
   * @desc 构造函数
   */
  constructor() {
    this.databaseMapper = new DatabaseMapper()
  }

  /**
   * @desc 查询当前数据库中所有表
   * @param {DataBaseDto.GetDataBaseTablesOptions} queryOptions  查询表请求参数
   * @returns {Promise<Array<DatabaseVo.GetDataBaseTablesOptions>>}
   */
  public async getDataBaseTables(
    queryOptions: DataBaseDto.GetDataBaseTablesOptions
  ): Promise<Array<DatabaseVo.GetDataBaseTablesOptions>> {
    const tableRecords = await this.databaseMapper.getDataBaseTables(queryOptions)
    return tableRecords.map((tableRecord) => {
      const dtoPayload = this.convertDaoToDtoTable(tableRecord)
      const normalizedTableRecord = this.convertDtoToDaoTable(dtoPayload)
      return {
        ...normalizedTableRecord,
        createTime: normalizedTableRecord.createTime,
        updateTime: normalizedTableRecord.updateTime,
        tableName: normalizedTableRecord.tableName,
        tableType: normalizedTableRecord.tableType,
        tableComment: normalizedTableRecord.tableComment,
        engine: normalizedTableRecord.engine,
        tableCollation: normalizedTableRecord.tableCollation
      }
    })
  }

  /**
   * @desc 查询当前数据库中表的列
   * @param {DataBaseDto.GetTableColumnsOptions} queryOptions 查询表请求参数
   * @returns {Promise<Array<DatabaseVo.GetTableColumnsOptions>>}
   */
  public async getTableColumns(
    queryOptions: DataBaseDto.GetTableColumnsOptions
  ): Promise<Array<DatabaseVo.GetTableColumnsOptions>> {
    const columnRecords = await this.databaseMapper.getTableColumns(queryOptions)
    return columnRecords.map((columnRecord) => {
      const dtoPayload = this.convertDaoToDtoColumn(columnRecord)
      const normalizedColumnRecord = this.convertDtoToDaoColumn(dtoPayload)
      const columnTypeValue = normalizedColumnRecord.columnType
      // let columnType = ''
      // if (NUMBER_TYPE_ENUM.some((type) => columnTypeValue.includes(type))) {
      //   columnType = 'number'
      // } else if (STRING_TYPE_ENUM.some((type) => columnTypeValue.includes(type))) {
      //   columnType = 'string'
      // } else if (DATE_TYPE_ENUM.some((type) => columnTypeValue.includes(type))) {
      //   columnType = 'date'
      // } else {
      //   columnType = columnTypeValue
      // }
      return {
        columnName: normalizedColumnRecord.columnName,
        columnType: columnTypeValue,
        columnComment: normalizedColumnRecord.columnComment,
        displayName: normalizedColumnRecord.columnComment
      }
    })
  }

  private convertDaoToDtoTable(tableRecord: DataBaseDao.TableOptions): DataBaseDto.TableDto {
    return { ...tableRecord }
  }

  private convertDtoToDaoTable(tableData: DataBaseDto.TableDto): DataBaseDao.TableOptions {
    return { ...tableData }
  }

  private convertDaoToDtoColumn(columnRecord: DataBaseDao.TableColumnOptions): DataBaseDto.TableColumnDto {
    return { ...columnRecord }
  }

  private convertDtoToDaoColumn(columnData: DataBaseDto.TableColumnDto): DataBaseDao.TableColumnOptions {
    return { ...columnData }
  }
}
