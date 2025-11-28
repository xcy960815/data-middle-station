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
   * @param queryOptions {DataBaseDto.GetDatabaseTablesRequest} 查询表请求参数
   * @returns {Promise<Array<DatabaseVo.GetDataBaseTablesOptions>>}
   */
  public async getTable(
    queryOptions: DataBaseDto.GetTableOptions
  ): Promise<Array<DatabaseVo.GetDataBaseTablesOptions>> {
    const tableRecords = await this.databaseMapper.getTable(queryOptions)
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
        columnName: normalizedColumnRecord.columnName,
        columnType: columnType,
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
