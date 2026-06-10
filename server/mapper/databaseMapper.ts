import type { IColumnTarget, Row } from '@/server/mapper/baseMapper'
import { BaseMapper, Column, Mapping, entityColumnsMap, mapToTarget } from '@/server/mapper/baseMapper'
import { toLine } from '@/server/utils/databaseHelper'
import { buildDatasetPreviewSql } from '@/server/utils/datasetSql'
import type { FieldPacket } from 'mysql2'

/**
 * @desc 表列表映射
 */
export class TableMapping implements DatabaseDao.TableRecord, IColumnTarget {
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
export class TableColumnMapping implements DatabaseDao.TableColumnRecord, IColumnTarget {
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

  @Column('IS_NULLABLE')
  nullable!: string

  @Column('ORDINAL_POSITION')
  ordinalPosition!: number

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

  public override async exe<T>(sql: string, params?: Array<any>): Promise<T> {
    return await super.exe<T>(sql, params)
  }
  /**
   * @desc 查询当前 schema 下的所有基础表
   * @param getTableRequest 表列表查询条件（支持按表名模糊搜索）
   * @returns 表元数据列表
   */
  @Mapping(TableMapping)
  public async getDatabaseTables<T extends DatabaseDao.TableRecord = DatabaseDao.TableRecord>(
    getTablesParams: DatabaseDao.GetTablesParams
  ): Promise<Array<T>> {
    const whereConditions: string[] = ["table_type = 'BASE TABLE'", 'table_schema = ?']
    const whereValues: Array<string> = [tableSchema]

    if (getTablesParams.tableName) {
      whereConditions.push('table_name LIKE ?')
      whereValues.push(`%${getTablesParams.tableName}%`)
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
  public async getTableColumns<T extends DatabaseDao.TableColumnRecord>(
    getTableColumnsParams: DatabaseDao.GetTableColumnsParams
  ): Promise<Array<T>> {
    const sql = `SELECT
        column_name,
        column_type,
        column_comment,
        is_nullable,
        ordinal_position
      FROM
        information_schema.columns
      WHERE
        table_name = ?
        AND table_schema = ?
      ORDER BY ordinal_position ASC;`
    const result = await this.exe<Array<T>>(sql, [toLine(getTableColumnsParams.tableName), tableSchema])
    return result
  }

  /**
   * @desc 预览指定表的数据，按字段配置查询并限制返回行数
   * @param tableName 表名（已校验的 SQL 标识符）
   * @param columns 字段映射列表，每项包含 sourceColumnName 和 fieldName
   * @param limit 最大返回行数
   * @returns 数据行列表
   */
  public async previewTableData(
    tableName: string,
    columns: Array<{ sourceColumnName: string; fieldName: string }>,
    limit: number
  ): Promise<AnalyzeDataVo.AnalyzeData[]> {
    const selectClause = columns.map((col) => `\`${col.sourceColumnName}\` as \`${col.fieldName}\``).join(', ')
    const sql = `select ${selectClause} from \`${tableName}\` limit ${limit}`
    return await this.exe<AnalyzeDataVo.AnalyzeData[]>(sql)
  }

  /**
   * @desc 预览用户 SQL 数据集查询结果
   */
  public async previewDatasetQuery(
    querySql: string,
    limit: number
  ): Promise<{
    rows: AnalyzeDataVo.AnalyzeData[]
    columns: Array<{ columnName: string; columnType: string }>
    elapsedMs: number
  }> {
    const pool = useNitroApp().mysqlPools.get(this.dataSourceName)
    if (!pool) {
      throw new Error(`数据源 ${this.dataSourceName} 未配置`)
    }

    const sql = buildDatasetPreviewSql(querySql, limit)
    const startedAt = Date.now()
    const [rows, fields] = await pool.query(sql)
    const elapsedMs = Date.now() - startedAt
    const columns = ((fields || []) as FieldPacket[]).map((field) => ({
      columnName: String(field.name || ''),
      columnType: this.normalizeMysqlFieldType(field)
    }))

    return {
      rows: rows as AnalyzeDataVo.AnalyzeData[],
      columns,
      elapsedMs
    }
  }

  private normalizeMysqlFieldType(field: FieldPacket) {
    if (field.columnType) {
      return String(field.columnType)
    }
    if (typeof field.type === 'number') {
      const numericTypes = new Set([1, 2, 3, 4, 5, 8, 9, 246, 247])
      return numericTypes.has(field.type) ? 'number' : 'string'
    }
    return 'string'
  }
}
