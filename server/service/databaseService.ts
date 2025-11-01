import { DatabaseMapper } from '../mapper/databaseMapper'

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
   * @param getTableRequest {DatabaseDto.GetDatabaseTablesRequest} 查询表请求参数
   * @returns {Promise<Array<DatabaseVo.GetDatabaseTablesResponse>>}
   */
  public async getTable(
    getTableRequest: DatabaseDto.GetDatabaseTablesRequest
  ): Promise<Array<DatabaseVo.GetDatabaseTablesResponse>> {
    const getTableResult = await this.databaseMapper.getTable(getTableRequest)
    return getTableResult.map((item) => ({
      ...item,
      createTime: item.createTime,
      updateTime: item.updateTime,
      tableName: item.tableName,
      tableType: item.tableType,
      tableComment: item.tableComment,
      engine: item.engine,
      tableCollation: item.tableCollation
    }))
  }

  /**
   * @desc 查询当前数据库中表的列
   * @param {DatabaseDto.GetTableColumnsRequest} getTableColumnsRequest 查询表请求参数
   * @returns {Promise<Array<DatabaseVo.GetTableColumnsResponse>>}
   */
  public async getTableColumns(
    getTableColumnsRequest: DatabaseDto.GetTableColumnsRequest
  ): Promise<Array<DatabaseVo.GetTableColumnsResponse>> {
    const getTableColumnsResult = await this.databaseMapper.getTableColumns(getTableColumnsRequest)
    return getTableColumnsResult.map((item) => {
      const columnTypeValue = item.columnType
      let columnType = ''
      if (NUMBER_TYPE_ENUM.some((type) => columnTypeValue.includes(type))) {
        columnType = 'number'
      } else if (STRING_TYPE_ENUM.some((type) => columnTypeValue.includes(type))) {
        columnType = 'string'
      } else if (DATE_TYPE_ENUM.some((type) => columnTypeValue.includes(type))) {
        columnType = 'date'
      } else {
        columnType = columnTypeValue
      }
      return {
        columnName: item.columnName,
        columnType: columnType,
        columnComment: item.columnComment,
        displayName: item.columnComment
      }
    })
  }
}
