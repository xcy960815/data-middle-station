import { DatabaseMapper } from '@/server/mapper/databaseMapper'

/** 将数据库所有的类型罗列出来在前端统一展示成 number */
const NUMBER_TYPE_ENUM = [
  'tinyint',
  'smallint',
  'mediumint',
  'int',
  'bigint',
  'decimal',
  'float',
  'double',
  'real',
  'bit',
  'boolean',
  'serial'
] as const
/** 将数据库所有的类型罗列出来在前端统一展示成 string */
const STRING_TYPE_ENUM = [
  'char',
  'varchar',
  'tinytext',
  'text',
  'mediumtext',
  'longtext',
  'tinyblob',
  'blob',
  'mediumblob',
  'longblob',
  'binary',
  'varbinary',
  'enum',
  'set',
  'json',
  'geometry',
  'point',
  'linestring',
  'polygon',
  'multipoint',
  'multilinestring',
  'multipolygon',
  'geometrycollection'
] as const
/** 将数据库所有的类型罗列出来在前端统一展示成 date */
const DATE_TYPE_ENUM = [
  'date',
  'datetime',
  'timestamp',
  'time',
  'year',
  'datetime2',
  'datetimeoffset',
  'smalldatetime'
] as const

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
   * @param {DatabaseDto.GetDatabaseTablesRequest} getDatabaseTablesRequest 查询表请求参数
   * @returns {Promise<Array<DatabaseVo.TableItem>>}
   */
  public async getDatabaseTables(
    getDatabaseTablesRequest: DatabaseDto.GetDatabaseTablesRequest
  ): Promise<Array<DatabaseVo.TableItem>> {
    const tableParams: DatabaseDao.GetTablesParams = {
      tableName: getDatabaseTablesRequest.tableName
    }
    const tableRecords = await this.databaseMapper.getDatabaseTables(tableParams)
    return tableRecords.map((tableRecord) => this.convertTableRecordToItem(tableRecord))
  }

  /**
   * @desc 查询当前数据库中表的列
   * @param {DatabaseDto.GetTableColumnsRequest} getTableColumnsRequest 查询表请求参数
   * @returns {Promise<Array<DatabaseVo.TableColumnItem>>}
   */
  public async getTableColumns(
    getTableColumnsRequest: DatabaseDto.GetTableColumnsRequest
  ): Promise<Array<DatabaseVo.TableColumnItem>> {
    const tableColumnParams: DatabaseDao.GetTableColumnsParams = {
      tableName: getTableColumnsRequest.tableName
    }
    const columnRecords = await this.databaseMapper.getTableColumns(tableColumnParams)
    return columnRecords.map((columnRecord) => {
      const columnTypeValue = columnRecord.columnType
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
        columnName: columnRecord.columnName,
        columnType: columnTypeValue,
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
