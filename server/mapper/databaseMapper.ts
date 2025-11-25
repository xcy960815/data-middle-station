import type { IColumnTarget, Row } from '@/server/mapper/baseMapper'
import { BaseMapper, Column, entityColumnsMap, Mapping, mapToTarget } from '@/server/mapper/baseMapper'

/**
 * @desc 表列表映射
 */
export class TableOptionMapping implements DataBaseDao.TableOption, IColumnTarget {
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
 * @desc 数据库mapper
 */
export class DatabaseMapper extends BaseMapper {
  public dataSourceName = tableSchema
  /**
   * @desc 查询所有的表名
   * @datasource ${tableSchema}
   * @returns {Promise<Array<T>>}
   */
  @Mapping(TableOptionMapping)
  public async getTable<T extends DataBaseDao.TableOption = DataBaseDao.TableOption>(
    getTableRequest: DatabaseDto.GetDatabaseTablesRequest
  ): Promise<Array<T>> {
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
        ${!!getTableRequest.tableName ? `AND table_name like '%${getTableRequest.tableName}%'` : ''}`
    const result = await this.exe<Array<T>>(sql)
    return result
  }

  /**
   * @desc 查询表的所有列
   * @param  getTableColumnsRequest  {DatabaseDto.GetTableColumnsRequest} 查询表请求参数
   * @returns {Promise<Array<DataBaseDao.TableColumnOptions>>}
   */
  @Mapping(TableColumnMapping)
  public async getTableColumns<T extends DataBaseDao.TableColumnOptions>(
    getTableColumnsRequest: DatabaseDto.GetTableColumnsRequest
  ): Promise<Array<T>> {
    const sql = `SELECT
        column_name,
        column_type,
        column_comment
      FROM
        information_schema.columns
      WHERE
        table_name = '${toLine(getTableColumnsRequest.tableName)}'
        AND table_schema = '${tableSchema}';`
    const result = await this.exe<Array<T>>(sql)
    return result
  }
}
