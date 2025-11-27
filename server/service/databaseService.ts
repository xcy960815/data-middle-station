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
   * @param getTableRequest {DataBaseDto.GetDatabaseTablesRequest} 查询表请求参数
   * @returns {Promise<Array<DatabaseVo.GetDataBaseTablesOptions>>}
   */
  public async getTable(
    getTablesRequest: DataBaseDto.GetTableOptions
  ): Promise<Array<DatabaseVo.GetDataBaseTablesOptions>> {
    const tableDaoList = await this.databaseMapper.getTable(getTablesRequest)
    return tableDaoList.map((tableDao) => {
      const dtoPayload = this.convertDaoToDtoTable(tableDao)
      const normalizedTableDao = this.convertDtoToDaoTable(dtoPayload)
      return {
        ...normalizedTableDao,
        createTime: normalizedTableDao.createTime,
        updateTime: normalizedTableDao.updateTime,
        tableName: normalizedTableDao.tableName,
        tableType: normalizedTableDao.tableType,
        tableComment: normalizedTableDao.tableComment,
        engine: normalizedTableDao.engine,
        tableCollation: normalizedTableDao.tableCollation
      }
    })
  }

  /**
   * @desc 查询当前数据库中表的列
   * @param {DataBaseDto.GetTableColumnsOptions} tableColumnsRequest 查询表请求参数
   * @returns {Promise<Array<DatabaseVo.GetTableColumnsOptions>>}
   */
  public async getTableColumns(
    tableColumnsRequest: DataBaseDto.GetTableColumnsOptions
  ): Promise<Array<DatabaseVo.GetTableColumnsOptions>> {
    const columnDaoList = await this.databaseMapper.getTableColumns(tableColumnsRequest)
    return columnDaoList.map((columnDao) => {
      const dtoPayload = this.convertDaoToDtoColumn(columnDao)
      const normalizedColumnDao = this.convertDtoToDaoColumn(dtoPayload)
      const columnTypeValue = normalizedColumnDao.columnType
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
        columnName: normalizedColumnDao.columnName,
        columnType: columnType,
        columnComment: normalizedColumnDao.columnComment,
        displayName: normalizedColumnDao.columnComment
      }
    })
  }

  private convertDaoToDtoTable(tableDao: DataBaseDao.TableOptions): DataBaseDto.TableOptionDto {
    return { ...tableDao }
  }

  private convertDtoToDaoTable(tableDto: DataBaseDto.TableOptionDto): DataBaseDao.TableOptions {
    return { ...tableDto }
  }

  private convertDaoToDtoColumn(columnDao: DataBaseDao.TableColumnOptions): DataBaseDto.TableColumnDto {
    return { ...columnDao }
  }

  private convertDtoToDaoColumn(columnDto: DataBaseDto.TableColumnDto): DataBaseDao.TableColumnOptions {
    return { ...columnDto }
  }
}
