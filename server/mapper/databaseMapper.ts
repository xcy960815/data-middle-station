import type { IColumnTarget, Row } from '@/server/mapper/baseMapper'
import { BaseMapper, Column, Mapping, entityColumnsMap, mapToTarget } from '@/server/mapper/baseMapper'
import { toLine } from '@/server/utils/databaseHelper'
import { buildDatasetPreviewSql } from '@/server/utils/datasetSql'
import type { FieldPacket } from 'mysql2'

/**
 * 数据库表映射实体，将表元数据记录映射为对象。
 * @implements {DatabaseDao.TableRecord}
 * @implements {IColumnTarget}
 */
export class TableMapping implements DatabaseDao.TableRecord, IColumnTarget {
  /**
   * 表名称
   * @type {string}
   */
  @Column('TABLE_NAME')
  tableName!: string

  /**
   * 表类型（例如 BASE TABLE）
   * @type {string}
   */
  @Column('TABLE_TYPE')
  tableType!: string

  /**
   * 表注释说明
   * @type {string}
   */
  @Column('TABLE_COMMENT')
  tableComment!: string

  /**
   * 表的创建时间
   * @type {string}
   */
  @Column('CREATE_TIME')
  createTime!: string

  /**
   * 表的最近更新时间
   * @type {string}
   */
  @Column('UPDATE_TIME')
  updateTime!: string

  /**
   * 表的估计数据行数
   * @type {number}
   */
  @Column('TABLE_ROWS')
  tableRows!: number

  /**
   * 平均行长度（字节）
   * @type {number}
   */
  @Column('AVG_ROW_LENGTH')
  avgRowLength!: number

  /**
   * 数据文件长度（字节）
   * @type {number}
   */
  @Column('DATA_LENGTH')
  dataLength!: number

  /**
   * 索引文件长度（字节）
   * @type {number}
   */
  @Column('INDEX_LENGTH')
  indexLength!: number

  /**
   * 当前的自增属性值
   * @type {number}
   */
  @Column('AUTO_INCREMENT')
  autoIncrement!: number

  /**
   * 存储引擎类型（例如 InnoDB）
   * @type {string}
   */
  @Column('ENGINE')
  engine!: string

  /**
   * 字符集校验规则
   * @type {string}
   */
  @Column('TABLE_COLLATION')
  tableCollation!: string

  /**
   * 获取表大小（单位：MB）
   * @type {number}
   */
  get tableSize(): number {
    return Number(((this.dataLength + this.indexLength) / 1024 / 1024).toFixed(2))
  }

  /**
   * 列映射方法，将数据库原始行数据映射为当前类的属性
   * @param {Array<Row> | Row} data 数据库行数据
   * @returns {Array<Row> | Row} 映射后的数据
   */
  columnsMapper(data: Array<Row> | Row): Array<Row> | Row {
    return mapToTarget(this, data, entityColumnsMap.get(this.constructor))
  }
}

/**
 * 数据库表列映射实体，将列元数据记录映射为对象。
 * @implements {DatabaseDao.TableColumnRecord}
 * @implements {IColumnTarget}
 */
export class TableColumnMapping implements DatabaseDao.TableColumnRecord, IColumnTarget {
  /**
   * 列名
   * @type {string}
   */
  @Column('COLUMN_NAME')
  columnName!: string

  /**
   * 列类型
   * @type {string}
   */
  @Column('COLUMN_TYPE')
  columnType!: string

  /**
   * 列注释说明
   * @type {string}
   */
  @Column('COLUMN_COMMENT')
  columnComment!: string

  /**
   * 是否允许为空（"YES" 或 "NO"）
   * @type {string}
   */
  @Column('IS_NULLABLE')
  nullable!: string

  /**
   * 列在表中的位置序号（从1开始）
   * @type {number}
   */
  @Column('ORDINAL_POSITION')
  ordinalPosition!: number

  /**
   * 列映射方法，将数据库原始行数据映射为当前类的属性
   * @param {Array<Row> | Row} data 数据库行数据
   * @returns {Array<Row> | Row} 映射后的数据
   */
  columnsMapper(data: Array<Row> | Row): Array<Row> | Row {
    return mapToTarget(this, data, entityColumnsMap.get(this.constructor))
  }
}

/**
 * 默认查询的数据库 schema 名称
 * @type {string}
 */
const tableSchema = 'kanban_data'

/**
 * 数据库元数据访问 Mapper 类，提供查询表结构、列信息和预览数据的能力。
 * @extends {BaseMapper}
 */
export class DatabaseMapper extends BaseMapper {
  /**
   * 当前 mapper 使用的数据源名称（与 schema 同名）
   * @type {string}
   */
  public dataSourceName = tableSchema

  /**
   * 执行 SQL 语句并返回结果的基类覆盖方法
   * @template T 返回的数据类型
   * @param {string} sql 待执行的 SQL 语句
   * @param {Array<any>} [params] SQL 参数数组
   * @returns {Promise<T>} 返回的执行结果
   * @override
   */
  public override async exe<T>(sql: string, params?: Array<any>): Promise<T> {
    return await super.exe<T>(sql, params)
  }

  /**
   * 查询当前 schema 下的所有基础表
   * @template T 返回的表记录类型，继承自 DatabaseDao.TableRecord
   * @param {DatabaseDao.GetTablesParams} getTablesParams 表列表查询条件（支持按表名模糊搜索）
   * @returns {Promise<Array<T>>} 表元数据列表
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
   * 查询指定表的所有列信息
   * @template T 返回的列记录类型
   * @param {DatabaseDao.GetTableColumnsParams} getTableColumnsParams 表列查询参数，包含目标表名
   * @returns {Promise<Array<T>>} 指定表的列元数据列表
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
   * 预览指定表的数据，按字段配置查询并限制返回行数
   * @param {string} tableName 表名（已校验的 SQL 标识符）
   * @param {Array<{ sourceColumnName: string; fieldName: string }>} columns 字段映射列表，每项包含 sourceColumnName 和 fieldName
   * @param {number} limit 最大返回行数
   * @returns {Promise<AnalyzeDataVo.AnalyzeData[]>} 数据行列表
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
   * 预览用户 SQL 数据集查询结果
   * @param {string} querySql SQL查询语句
   * @param {number} limit 限制返回的数据条数
   * @returns {Promise<{ rows: AnalyzeDataVo.AnalyzeData[]; columns: Array<{ columnName: string; columnType: string }>; elapsedMs: number }>} 查询结果、列结构及耗时
   * @throws {Error} 如果当前数据源未配置，则抛出异常
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

  /**
   * 标准化 MySQL 的字段类型
   * @param {FieldPacket} field MySQL 字段定义包
   * @returns {string} 对应的标准类型字符串（number 或 string）
   * @private
   */
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
