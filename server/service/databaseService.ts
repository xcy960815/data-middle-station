import { DatabaseMapper } from '../mapper/databaseMapper'
import { toLine } from '../utils/databaseHelpper'

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
   * @param tableName {string} 表名
   * @returns {Promise<Array<DatabaseVo.TableOptionVo>>}
   */
  public async queryTable(tableName: string): Promise<Array<DatabaseVo.TableOptions>> {
    const result = await this.databaseMapper.queryTable(tableName)
    return result.map((item) => ({
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
   * @param tableName {string} 表名
   * @returns {Promise<Array<DatabaseVo.TableColumnOption>>}
   */
  public async queryTableColumn(tableName: string): Promise<Array<DatabaseVo.TableColumnOption>> {
    const result = await this.databaseMapper.queryTableColumn(toLine(tableName))
    return result.map((item) => {
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
