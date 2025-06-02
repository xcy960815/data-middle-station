import { DatabaseMapper } from '../mapper/databaseMapper'
import { toLine } from '../../utils/databaseHelpper.server'

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
      const columnTypeValue =
        typeof item.columnType === 'function'
          ? item.columnType('')
          : item.columnType
      let columnType = ''
      if (
        NUMBER_TYPE_ENUM.some((type) =>
          columnTypeValue.includes(type)
        )
      ) {
        columnType = 'number'
      } else if (
        STRING_TYPE_ENUM.some((type) =>
          columnTypeValue.includes(type)
        )
      ) {
        columnType = 'string'
      } else if (
        DATE_TYPE_ENUM.some((type) =>
          columnTypeValue.includes(type)
        )
      ) {
        columnType = 'date'
      } else {
        columnType = columnTypeValue
      }
      return {
        columnName:
          typeof item.columnName === 'function'
            ? item.columnName('')
            : item.columnName,
        columnType: columnType,
        columnComment: item.columnComment,
        alias: item.columnComment,
        displayName: item.columnComment
      }
    })
  }
}
