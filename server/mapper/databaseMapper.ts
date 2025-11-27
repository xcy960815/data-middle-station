import type { IColumnTarget, Row } from '@/server/mapper/baseMapper'
import { BaseMapper, Column, entityColumnsMap, Mapping, mapToTarget } from '@/server/mapper/baseMapper'
import { toLine } from '@/server/utils/databaseHelpper'

/**
 * @desc 表列表映射
 */
export class TableOptionMapping implements DataBaseDao.TableOptions, IColumnTarget {
  @Column('TABLE_NAME')
  tableName!: string

  @Column('TABLE_TYPE')
  tableType!: string

  @Column('TABLE_COMMENT')
  tableComment!: string

  @Column('CREATE_TIME')
  createTime!: string

  @Column('UPDATE_TIME')
  updateTime!: string

  @Column('TABLE_ROWS')
  tableRows!: number

  @Column('AVG_ROW_LENGTH')
  avgRowLength!: number

  @Column('DATA_LENGTH')
  dataLength!: number

  @Column('INDEX_LENGTH')
  indexLength!: number

  @Column('AUTO_INCREMENT')
  autoIncrement!: number

  @Column('ENGINE')
  engine!: string

  @Column('TABLE_COLLATION')
  tableCollation!: string

  // 计算属性：表大小（MB）
  get tableSize(): number {
    return Number(((this.dataLength + this.indexLength) / 1024 / 1024).toFixed(2))
  }

  /**
   * @desc 列映射
   * @param data {Array<Row> | Row} 数据
   * @returns {Array<Row> | Row}
   */
  columnsMapper(data: Array<Row> | Row): Array<Row> | Row {
    return mapToTarget(this, data, entityColumnsMap.get(this.constructor))
  }
}

/**
 * @desc 表列映射
 */
export class TableColumnMapping implements DataBaseDao.TableColumnOptions, IColumnTarget {
  /**
   * @desc 列名
   */
  @Column('COLUMN_NAME')
  columnName!: string

  /**
   * @desc 列类型
   */
  @Column('COLUMN_TYPE')
  columnType!: string

  /**
   * @desc 列注释
   */
  @Column('COLUMN_COMMENT')
  columnComment!: string

  /**
   * @desc 列映射
   */
  columnsMapper(data: Array<Row> | Row): Array<Row> | Row {
    return mapToTarget(this, data, entityColumnsMap.get(this.constructor))
  }
}

/**
 * @desc 数据库表名
 */
const tableSchema = 'kanban_data'

/**
 * @desc 数据库 mapper，用于查询当前 schema 下的表和列信息
 */
export class DatabaseMapper extends BaseMapper {
  /**
   * @desc 当前 mapper 使用的数据源名称（与 schema 同名）
   */
  public dataSourceName = tableSchema
  /**
   * @desc 查询当前 schema 下的所有基础表
   * @param getTableRequest 表列表查询条件（支持按表名模糊搜索）
   * @returns 表元数据列表
   */
  @Mapping(TableOptionMapping)
  public async getTable<T extends DataBaseDao.TableOptions = DataBaseDao.TableOptions>(
    getTableRequest: DataBaseDao.GetTableOptions
  ): Promise<Array<T>> {
    const whereConditions: string[] = ["table_type = 'BASE TABLE'", 'table_schema = ?']
    const whereValues: Array<string> = [tableSchema]

    if (getTableRequest.tableName) {
      whereConditions.push('table_name LIKE ?')
      whereValues.push(`%${getTableRequest.tableName}%`)
    }

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
      WHERE ${whereConditions.join(' AND ')}`

    const result = await this.exe<Array<T>>(sql, whereValues)
    return result
  }

  /**
   * @desc 查询指定表的所有列信息
   * @param getTableColumnsRequest 表列查询参数，包含目标表名
   * @returns 指定表的列元数据列表
   */
  @Mapping(TableColumnMapping)
  public async getTableColumns<T extends DataBaseDao.TableColumnOptions>(
    getTableColumnsOptions: DataBaseDao.GetTableColumnOptions
  ): Promise<Array<T>> {
    const sql = `SELECT
        column_name,
        column_type,
        column_comment
      FROM
        information_schema.columns
      WHERE
        table_name = ?
        AND table_schema = ?;`
    const result = await this.exe<Array<T>>(sql, [toLine(getTableColumnsOptions.tableName), tableSchema])
    return result
  }
}
