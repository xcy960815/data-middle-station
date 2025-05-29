import {
  Column,
  BindDataSource,
  Mapping,
  BaseMapper
} from './baseMapper'
import {
  toHump,
  toLine
} from '../utils/string-case-converter'
import dayjs from 'dayjs'
/** 将数据库所有的类型罗列出来在前端统一展示成 number */
const NUMBER_TYPE_ENUM = [
  'tinyint',
  'smallint',
  'mediumint',
  'int',
  'bigint',
  'decimal',
  'float',
  'double'
]
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
  'longblob'
]
/** 将数据库所有的类型罗列出来在前端统一展示成 date */
const DATE_TYPE_ENUM = [
  'date',
  'datetime',
  'timestamp',
  'time',
  'year'
]

// 表列表映射
export class QueryTableMapping
  implements DatabaseDao.TableOptionDao
{
  @Column('TABLE_NAME')
  tableName(value: string) {
    if (!value) return ''
    return toHump(value.toLowerCase())
  }

  @Column('TABLE_TYPE')
  tableType(value: string) {
    if (!value) return ''
    return value.toLowerCase()
  }

  @Column('TABLE_COMMENT')
  tableComment: string = ''

  @Column('CREATE_TIME')
  createTime(value: string) {
    if (!value) return ''
    return dayjs(value).format('YYYY-MM-DD HH:mm:ss')
  }

  @Column('UPDATE_TIME')
  updateTime(value: string) {
    if (!value) return ''
    return dayjs(value).format('YYYY-MM-DD HH:mm:ss')
  }

  @Column('TABLE_ROWS')
  tableRows: number = 0

  @Column('AVG_ROW_LENGTH')
  avgRowLength: number = 0

  @Column('DATA_LENGTH')
  dataLength: number = 0

  @Column('INDEX_LENGTH')
  indexLength: number = 0

  @Column('AUTO_INCREMENT')
  autoIncrement: number = 0

  @Column('ENGINE')
  engine(value: string) {
    if (!value) return ''
    return value.toLowerCase()
  }

  @Column('TABLE_COLLATION')
  tableCollation(value: string) {
    if (!value) return ''
    return value.toLowerCase()
  }

  // 计算属性：表大小（MB）
  get tableSize(): number {
    return Number(
      (
        (this.dataLength + this.indexLength) /
        1024 /
        1024
      ).toFixed(2)
    )
  }
}

// 表列映射
export class TableColumnMapping
  implements DatabaseDao.TableColumnOptionDao
{
  @Column('COLUMN_NAME')
  columnName(value: string) {
    if (!value) return ''
    return toHump(value)
  }

  @Column('column_type')
  columnType = (value: string) => {
    if (!value) return ''
    const type = value.toLowerCase()
    if (NUMBER_TYPE_ENUM.includes(type)) {
      return 'number'
    } else if (STRING_TYPE_ENUM.includes(type)) {
      return 'string'
    } else if (DATE_TYPE_ENUM.includes(type)) {
      return 'date'
    } else {
      return type
    }
  }

  @Column('COLUMN_COMMENT')
  columnComment: string = ''

  @Column('alias')
  alias = (value: string) => {
    return value ? toHump(value) : ''
  }

  @Column('display_name')
  displayName = (value: string) => {
    return value ? toHump(value) : ''
  }
}

const tableSchema = 'kanban_data'

@BindDataSource(tableSchema)
export class DatabaseMapper extends BaseMapper {
  /**
   * @desc 查询所有的表名
   * @datasource ${tableSchema}
   * @returns {Promise<Array<T>>}
   */
  @Mapping(QueryTableMapping)
  public async queryTable<
    T extends DatabaseDao.TableOptionDao
  >(tableName: string): Promise<Array<T>> {
    const sql = `SELECT 
        table_name,
        table_type,
        table_comment,
        create_time,
        update_time,
        table_rows,
        avg_row_length,
        data_length,
        index_length,
        auto_increment,
        engine,
        table_collation
      FROM information_schema.tables 
      WHERE 
        table_type = 'BASE TABLE' 
        AND table_schema='${tableSchema}'
        ${!!tableName ? `AND table_name like '%${tableName}%'` : ''}`
    const result = await this.exe<Array<T>>(sql)
    return result
  }

  /**
   * @desc 查询表的所有列
   * @param tableName {string} 表名
   * @returns {Promise<Array<TableInfoDao.TableColumnOptionDao>>}
   */
  @Mapping(TableColumnMapping)
  public async queryTableColumns<
    T extends DatabaseDao.TableColumnOptionDao
  >(tableName: string): Promise<Array<T>> {
    const sql = `SELECT 
        column_name, 
        REPLACE(SUBSTRING_INDEX(column_type, '(', 1), ' ', '') AS column_type,
        column_comment 
      FROM 
        information_schema.columns  
      WHERE 
        table_name = ? 
        AND table_schema = '${tableSchema}';`
    const result = await this.exe<Array<T>>(sql, [
      tableName
    ])
    return result
  }
}
