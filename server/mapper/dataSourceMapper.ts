import type { IColumnTarget, Row } from '@/server/mapper/baseMapper'
import { BaseMapper, Column, Mapping, entityColumnsMap, mapToTarget } from '@/server/mapper/baseMapper'
import { convertToSqlProperties } from '@/server/utils/databaseHelper'
import type { ResultSetHeader } from 'mysql2'

/**
 * 默认使用的数据库连接池名称
 * @type {string}
 */
const DATA_SOURCE_NAME = 'data_middle_station'

/**
 * 数据源主表的表名
 * @type {string}
 */
const DATA_SOURCE_TABLE_NAME = '`data_source`'

/**
 * 数据源同步表元数据表的表名
 * @type {string}
 */
const DATA_SOURCE_TABLE_TABLE_NAME = '`data_source_table`'

/**
 * 数据源同步列元数据表的表名
 * @type {string}
 */
const DATA_SOURCE_COLUMN_TABLE_NAME = '`data_source_column`'

/**
 * 数据源主表的所有字段列表
 * @type {string[]}
 */
const DATA_SOURCE_FIELDS = [
  'id',
  'source_name',
  'source_desc',
  'source_type',
  'host',
  'port',
  'database_name',
  'username',
  'status',
  'create_time',
  'update_time',
  'created_by',
  'updated_by',
  'is_deleted'
]

/**
 * 数据源列表排序字段映射表，将前端字段名映射为数据库带表前缀的列名
 * @type {Record<DataSourceDao.DataSourceListSortField, string>}
 */
const DATA_SOURCE_LIST_SORT_FIELD_MAP: Record<DataSourceDao.DataSourceListSortField, string> = {
  sourceName: 'ds.source_name',
  createTime: 'ds.create_time',
  updateTime: 'ds.update_time'
}

/**
 * 数据源映射实体类，用于将数据库行映射为数据源记录对象。
 * @implements {DataSourceDao.DataSourceRecord}
 * @implements {IColumnTarget}
 */
class DataSourceMapping implements DataSourceDao.DataSourceRecord, IColumnTarget {
  /**
   * 列映射方法，将数据库原始行数据映射为当前类的属性
   * @param {Array<Row> | Row} data 原始数据库行数据
   * @returns {Array<Row> | Row} 映射后的数据
   */
  columnsMapper(data: Array<Row> | Row): Array<Row> | Row {
    return mapToTarget(this, data, entityColumnsMap.get(this.constructor))
  }

  /**
   * 数据源 ID
   * @type {number}
   */
  @Column('id')
  id!: number

  /**
   * 数据源名称
   * @type {string}
   */
  @Column('source_name')
  sourceName!: string

  /**
   * 数据源描述
   * @type {string}
   */
  @Column('source_desc')
  sourceDesc!: string

  /**
   * 数据源类型（MySQL / ClickHouse 等）
   * @type {DataSourceDao.DataSourceType}
   */
  @Column('source_type')
  sourceType!: DataSourceDao.DataSourceType

  /**
   * 数据库主机 IP / 域名
   * @type {string}
   */
  @Column('host')
  host!: string

  /**
   * 数据库端口
   * @type {number}
   */
  @Column('port')
  port!: number

  /**
   * 数据库名称
   * @type {string}
   */
  @Column('database_name')
  databaseName!: string

  /**
   * 数据库登录用户名
   * @type {string}
   */
  @Column('username')
  username!: string

  /**
   * 数据源状态
   * @type {DataSourceDao.DataSourceStatus}
   */
  @Column('status')
  status!: DataSourceDao.DataSourceStatus

  /**
   * 创建时间
   * @type {string}
   */
  @Column('create_time')
  createTime!: string

  /**
   * 更新时间
   * @type {string}
   */
  @Column('update_time')
  updateTime!: string

  /**
   * 创建人
   * @type {string}
   */
  @Column('created_by')
  createdBy!: string

  /**
   * 更新人
   * @type {string}
   */
  @Column('updated_by')
  updatedBy!: string

  /**
   * 是否删除标记
   * @type {number | null}
   */
  @Column('is_deleted')
  isDeleted!: number | null
}

/**
 * 数据源列表映射实体类，包含关联统计信息。
 * @implements {DataSourceVo.DataSourceListItem}
 * @implements {IColumnTarget}
 */
class DataSourceListMapping implements DataSourceVo.DataSourceListItem, IColumnTarget {
  /**
   * 列映射方法，将数据库原始行数据映射为当前类的属性
   * @param {Array<Row> | Row} data 原始数据库行数据
   * @returns {Array<Row> | Row} 映射后的数据
   */
  columnsMapper(data: Array<Row> | Row): Array<Row> | Row {
    return mapToTarget(this, data, entityColumnsMap.get(this.constructor))
  }

  /**
   * 数据源 ID
   * @type {number}
   */
  @Column('id')
  id!: number

  /**
   * 数据源名称
   * @type {string}
   */
  @Column('source_name')
  sourceName!: string

  /**
   * 数据源描述
   * @type {string}
   */
  @Column('source_desc')
  sourceDesc!: string

  /**
   * 数据源类型
   * @type {DataSourceDao.DataSourceType}
   */
  @Column('source_type')
  sourceType!: DataSourceDao.DataSourceType

  /**
   * 数据库主机 IP / 域名
   * @type {string}
   */
  @Column('host')
  host!: string

  /**
   * 数据库端口
   * @type {number}
   */
  @Column('port')
  port!: number

  /**
   * 数据库名称
   * @type {string}
   */
  @Column('database_name')
  databaseName!: string

  /**
   * 数据库登录用户名
   * @type {string}
   */
  @Column('username')
  username!: string

  /**
   * 数据源状态
   * @type {DataSourceDao.DataSourceStatus}
   */
  @Column('status')
  status!: DataSourceDao.DataSourceStatus

  /**
   * 创建时间
   * @type {string}
   */
  @Column('create_time')
  createTime!: string

  /**
   * 更新时间
   * @type {string}
   */
  @Column('update_time')
  updateTime!: string

  /**
   * 创建人
   * @type {string}
   */
  @Column('created_by')
  createdBy!: string

  /**
   * 更新人
   * @type {string}
   */
  @Column('updated_by')
  updatedBy!: string

  /**
   * 关联的表数量
   * @type {number}
   */
  @Column('table_count')
  tableCount!: number
}

/**
 * 数据源表映射实体类，代表同步保存的表信息。
 * @implements {DataSourceDao.DataSourceTableRecord}
 * @implements {IColumnTarget}
 */
class DataSourceTableMapping implements DataSourceDao.DataSourceTableRecord, IColumnTarget {
  /**
   * 列映射方法，将数据库原始行数据映射为当前类的属性
   * @param {Array<Row> | Row} data 原始数据库行数据
   * @returns {Array<Row> | Row} 映射后的数据
   */
  columnsMapper(data: Array<Row> | Row): Array<Row> | Row {
    return mapToTarget(this, data, entityColumnsMap.get(this.constructor))
  }

  /**
   * 记录 ID
   * @type {number}
   */
  @Column('id')
  id!: number

  /**
   * 数据源 ID
   * @type {number}
   */
  @Column('data_source_id')
  dataSourceId!: number

  /**
   * 表名
   * @type {string}
   */
  @Column('table_name')
  tableName!: string

  /**
   * 表注释说明
   * @type {string}
   */
  @Column('table_comment')
  tableComment!: string

  /**
   * 表数据行数
   * @type {number}
   */
  @Column('table_rows')
  tableRows!: number

  /**
   * 最近一次同步的时间
   * @type {string}
   */
  @Column('last_sync_time')
  lastSyncTime!: string

  /**
   * 创建时间
   * @type {string}
   */
  @Column('create_time')
  createTime!: string

  /**
   * 更新时间
   * @type {string}
   */
  @Column('update_time')
  updateTime!: string

  /**
   * 是否删除标记
   * @type {number | null}
   */
  @Column('is_deleted')
  isDeleted!: number | null
}

/**
 * 数据源列映射实体类，代表同步保存的列信息。
 * @implements {DataSourceDao.DataSourceColumnRecord}
 * @implements {IColumnTarget}
 */
class DataSourceColumnMapping implements DataSourceDao.DataSourceColumnRecord, IColumnTarget {
  /**
   * 列映射方法，将数据库原始行数据映射为当前类的属性
   * @param {Array<Row> | Row} data 原始数据库行数据
   * @returns {Array<Row> | Row} 映射后的数据
   */
  columnsMapper(data: Array<Row> | Row): Array<Row> | Row {
    return mapToTarget(this, data, entityColumnsMap.get(this.constructor))
  }

  /**
   * 记录 ID
   * @type {number}
   */
  @Column('id')
  id!: number

  /**
   * 数据源 ID
   * @type {number}
   */
  @Column('data_source_id')
  dataSourceId!: number

  /**
   * 表名
   * @type {string}
   */
  @Column('table_name')
  tableName!: string

  /**
   * 列名
   * @type {string}
   */
  @Column('column_name')
  columnName!: string

  /**
   * 列类型
   * @type {string}
   */
  @Column('column_type')
  columnType!: string

  /**
   * 列注释说明
   * @type {string}
   */
  @Column('column_comment')
  columnComment!: string

  /**
   * 是否允许为空（"YES" 或 "NO"）
   * @type {string}
   */
  @Column('nullable')
  nullable!: string

  /**
   * 位置序号
   * @type {number}
   */
  @Column('ordinal_position')
  ordinalPosition!: number

  /**
   * 创建时间
   * @type {string}
   */
  @Column('create_time')
  createTime!: string

  /**
   * 更新时间
   * @type {string}
   */
  @Column('update_time')
  updateTime!: string

  /**
   * 是否删除标记
   * @type {number | null}
   */
  @Column('is_deleted')
  isDeleted!: number | null
}

/**
 * 数据源 Mapper 类，提供数据源的基本 CRUD 操作，以及对其下表、列元数据的管理。
 * @extends {BaseMapper}
 */
export class DataSourceMapper extends BaseMapper {
  /**
   * 当前 mapper 使用的数据源名称
   * @type {string}
   */
  public dataSourceName = DATA_SOURCE_NAME

  /**
   * 执行 SQL 的便捷封装（保留泛型能力）
   * @template T 返回的数据类型
   * @param {string} sql 需要执行的 SQL 语句
   * @param {Array<any>} [params] 预编译参数数组
   * @returns {Promise<T>} 查询或写入操作的执行结果
   * @override
   */
  public override async exe<T>(sql: string, params?: Array<any>): Promise<T> {
    return await super.exe<T>(sql, params)
  }

  /**
   * 创建数据源
   * @param {DataSourceDao.CreateDataSourceParams} createParams 创建参数
   * @returns {Promise<number>} 新创建的数据源 ID
   */
  public async createDataSource(createParams: DataSourceDao.CreateDataSourceParams): Promise<number> {
    const { keys, values } = convertToSqlProperties(createParams)
    const sql = `insert into ${DATA_SOURCE_TABLE_NAME} (${keys.join(',')}) values (${keys.map(() => '?').join(',')})`
    const result = await this.exe<ResultSetHeader>(sql, values)
    return result.insertId
  }

  /**
   * 更新数据源
   * @param {DataSourceDao.UpdateDataSourceParams} updateParams 更新参数
   * @returns {Promise<boolean>} 是否更新成功
   */
  public async updateDataSource(updateParams: DataSourceDao.UpdateDataSourceParams): Promise<boolean> {
    const { keys, values } = convertToSqlProperties(updateParams)
    const setClause = keys.map((key) => `${key} = ?`).join(', ')
    const sql = `update ${DATA_SOURCE_TABLE_NAME} set ${setClause} where id = ? and is_deleted = 0`
    const result = await this.exe<ResultSetHeader>(sql, [...values, updateParams.id])
    return result.affectedRows > 0
  }

  /**
   * 删除数据源（逻辑删除）
   * @param {DataSourceDao.DeleteDataSourceParams} deleteParams 删除参数
   * @returns {Promise<boolean>} 是否删除成功
   */
  public async deleteDataSource(deleteParams: DataSourceDao.DeleteDataSourceParams): Promise<boolean> {
    const sql = `update ${DATA_SOURCE_TABLE_NAME} set is_deleted = 1, updated_by = ?, update_time = ? where id = ? and is_deleted = 0`
    const result = await this.exe<ResultSetHeader>(sql, [
      deleteParams.updatedBy,
      deleteParams.updateTime,
      deleteParams.id
    ])
    return result.affectedRows > 0
  }

  /**
   * 获取单个数据源详情
   * @template T 返回数据源记录类型，默认继承自 DataSourceDao.DataSourceRecord
   * @param {DataSourceDao.GetDataSourceParams} query 查询参数
   * @returns {Promise<T>} 数据源记录
   */
  @Mapping(DataSourceMapping)
  public async getDataSource<T extends DataSourceDao.DataSourceRecord = DataSourceDao.DataSourceRecord>(
    query: DataSourceDao.GetDataSourceParams
  ): Promise<T> {
    const sql = `select ${DATA_SOURCE_FIELDS.join(', ')} from ${DATA_SOURCE_TABLE_NAME} where id = ? and is_deleted = 0`
    const result = await this.exe<Array<T>>(sql, [query.id])
    return result?.[0]
  }

  /**
   * 获取数据源数量
   * @param {DataSourceDao.GetDataSourceListParams} query 列表查询参数
   * @returns {Promise<number>} 数据源数量
   */
  public async countDataSources(query: DataSourceDao.GetDataSourceListParams): Promise<number> {
    const { whereClause, params } = this.buildDataSourceListQuery(query)
    const sql = `select count(*) as total from ${DATA_SOURCE_TABLE_NAME} ds ${whereClause}`
    const result = await this.exe<Array<{ total: number }>>(sql, params)
    return Number(result?.[0]?.total || 0)
  }

  /**
   * 获取数据源列表（分页）
   * @template T 返回的数据源列表项类型，默认继承自 DataSourceVo.DataSourceListItem
   * @param {DataSourceDao.GetDataSourceListParams} query 列表查询参数
   * @returns {Promise<T[]>} 数据源列表
   */
  @Mapping(DataSourceListMapping)
  public async getDataSourceList<T extends DataSourceVo.DataSourceListItem = DataSourceVo.DataSourceListItem>(
    query: DataSourceDao.GetDataSourceListParams
  ): Promise<T[]> {
    const { whereClause, params } = this.buildDataSourceListQuery(query)
    const sortField = DATA_SOURCE_LIST_SORT_FIELD_MAP[query.sortField] || DATA_SOURCE_LIST_SORT_FIELD_MAP.updateTime
    const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc'
    const offset = (query.page - 1) * query.pageSize
    const sql = `
      select
        ${DATA_SOURCE_FIELDS.map((field) => `ds.${field}`).join(',\n        ')},
        count(dst.id) as table_count
      from ${DATA_SOURCE_TABLE_NAME} ds
      left join ${DATA_SOURCE_TABLE_TABLE_NAME} dst on dst.data_source_id = ds.id and dst.is_deleted = 0
      ${whereClause}
      group by ds.id
      order by ${sortField} ${sortOrder}
      limit ? offset ?`
    return await this.exe<T[]>(sql, [...params, query.pageSize, offset])
  }

  /**
   * 获取数据源下的表列表
   * @template T 返回的表记录类型，默认继承自 DataSourceDao.DataSourceTableRecord
   * @param {number} dataSourceId 数据源 ID
   * @param {string} [keyword=''] 搜索关键字，默认为空字符串
   * @returns {Promise<T[]>} 数据源表列表
   */
  @Mapping(DataSourceTableMapping)
  public async getDataSourceTables<T extends DataSourceDao.DataSourceTableRecord = DataSourceDao.DataSourceTableRecord>(
    dataSourceId: number,
    keyword = ''
  ): Promise<T[]> {
    const params: Array<string | number> = [dataSourceId]
    const conditions = ['data_source_id = ?', 'is_deleted = 0']
    if (keyword) {
      conditions.push('(table_name like ? or table_comment like ?)')
      params.push(`%${keyword}%`, `%${keyword}%`)
    }
    const sql = `
      select *
      from ${DATA_SOURCE_TABLE_TABLE_NAME}
      where ${conditions.join(' and ')}
      order by table_name asc`
    return await this.exe<T[]>(sql, params)
  }

  /**
   * 获取数据源指定表的列信息
   * @template T 返回的列记录类型，默认继承自 DataSourceDao.DataSourceColumnRecord
   * @param {number} dataSourceId 数据源 ID
   * @param {string} tableName 表名
   * @returns {Promise<T[]>} 列信息列表
   */
  @Mapping(DataSourceColumnMapping)
  public async getDataSourceColumns<
    T extends DataSourceDao.DataSourceColumnRecord = DataSourceDao.DataSourceColumnRecord
  >(dataSourceId: number, tableName: string): Promise<T[]> {
    const sql = `
      select *
      from ${DATA_SOURCE_COLUMN_TABLE_NAME}
      where data_source_id = ? and table_name = ? and is_deleted = 0
      order by ordinal_position asc`
    return await this.exe<T[]>(sql, [dataSourceId, tableName])
  }

  /**
   * 新增或更新数据源表信息（存在则更新，不存在则新增）
   * @param {DataSourceDao.UpsertDataSourceTableParams} upsertParams 表信息参数
   * @returns {Promise<void>}
   */
  public async upsertDataSourceTable(upsertParams: DataSourceDao.UpsertDataSourceTableParams): Promise<void> {
    const sql = `
      insert into ${DATA_SOURCE_TABLE_TABLE_NAME}
        (data_source_id, table_name, table_comment, table_rows, last_sync_time, is_deleted)
      values (?, ?, ?, ?, ?, 0)
      on duplicate key update
        table_comment = values(table_comment),
        table_rows = values(table_rows),
        last_sync_time = values(last_sync_time),
        is_deleted = 0`
    await this.exe<ResultSetHeader>(sql, [
      upsertParams.dataSourceId,
      upsertParams.tableName,
      upsertParams.tableComment,
      upsertParams.tableRows,
      upsertParams.lastSyncTime
    ])
  }

  /**
   * 替换数据源指定表的列信息（先标记删除再批量插入）
   * @param {DataSourceDao.ReplaceDataSourceColumnsParams} replaceParams 列信息替换参数
   * @returns {Promise<void>}
   */
  public async replaceDataSourceColumns(replaceParams: DataSourceDao.ReplaceDataSourceColumnsParams): Promise<void> {
    await this.exe<ResultSetHeader>(
      `update ${DATA_SOURCE_COLUMN_TABLE_NAME} set is_deleted = 1 where data_source_id = ? and table_name = ?`,
      [replaceParams.dataSourceId, replaceParams.tableName]
    )
    if (!replaceParams.columns.length) return

    const values = replaceParams.columns.flatMap((column) => [
      replaceParams.dataSourceId,
      replaceParams.tableName,
      column.columnName,
      column.columnType,
      column.columnComment,
      column.nullable,
      column.ordinalPosition
    ])
    const placeholders = replaceParams.columns.map(() => '(?, ?, ?, ?, ?, ?, ?, 0)').join(',')
    const sql = `
      insert into ${DATA_SOURCE_COLUMN_TABLE_NAME}
        (data_source_id, table_name, column_name, column_type, column_comment, nullable, ordinal_position, is_deleted)
      values ${placeholders}
      on duplicate key update
        column_type = values(column_type),
        column_comment = values(column_comment),
        nullable = values(nullable),
        ordinal_position = values(ordinal_position),
        is_deleted = 0`
    await this.exe<ResultSetHeader>(sql, values)
  }

  /**
   * 构造数据源列表查询的 where 子句及参数
   * @param {DataSourceDao.GetDataSourceListParams} query 列表查询参数
   * @returns {{ whereClause: string; params: string[] }} 返回的 where 子句和参数数组
   * @private
   */
  private buildDataSourceListQuery(query: DataSourceDao.GetDataSourceListParams) {
    const conditions = ['ds.is_deleted = 0']
    const params: string[] = []
    if (query.keyword) {
      conditions.push('(ds.source_name like ? or ds.source_desc like ? or ds.database_name like ?)')
      params.push(`%${query.keyword}%`, `%${query.keyword}%`, `%${query.keyword}%`)
    }
    return {
      whereClause: `where ${conditions.join(' and ')}`,
      params
    }
  }
}
