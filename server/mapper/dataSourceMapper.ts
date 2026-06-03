import type { IColumnTarget, Row } from '@/server/mapper/baseMapper'
import { BaseMapper, Column, Mapping, entityColumnsMap, mapToTarget } from '@/server/mapper/baseMapper'
import { convertToSqlProperties } from '@/server/utils/databaseHelper'
import type { ResultSetHeader } from 'mysql2'

const DATA_SOURCE_NAME = 'data_middle_station'
const DATA_SOURCE_TABLE_NAME = '`data_source`'
const DATA_SOURCE_TABLE_TABLE_NAME = '`data_source_table`'
const DATA_SOURCE_COLUMN_TABLE_NAME = '`data_source_column`'

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

const DATA_SOURCE_LIST_SORT_FIELD_MAP: Record<DataSourceDao.DataSourceListSortField, string> = {
  sourceName: 'ds.source_name',
  createTime: 'ds.create_time',
  updateTime: 'ds.update_time'
}

class DataSourceMapping implements DataSourceDao.DataSourceRecord, IColumnTarget {
  columnsMapper(data: Array<Row> | Row): Array<Row> | Row {
    return mapToTarget(this, data, entityColumnsMap.get(this.constructor))
  }

  @Column('id')
  id!: number

  @Column('source_name')
  sourceName!: string

  @Column('source_desc')
  sourceDesc!: string

  @Column('source_type')
  sourceType!: DataSourceDao.DataSourceType

  @Column('host')
  host!: string

  @Column('port')
  port!: number

  @Column('database_name')
  databaseName!: string

  @Column('username')
  username!: string

  @Column('status')
  status!: DataSourceDao.DataSourceStatus

  @Column('create_time')
  createTime!: string

  @Column('update_time')
  updateTime!: string

  @Column('created_by')
  createdBy!: string

  @Column('updated_by')
  updatedBy!: string

  @Column('is_deleted')
  isDeleted!: number | null
}

class DataSourceListMapping implements DataSourceVo.DataSourceListItem, IColumnTarget {
  columnsMapper(data: Array<Row> | Row): Array<Row> | Row {
    return mapToTarget(this, data, entityColumnsMap.get(this.constructor))
  }

  @Column('id')
  id!: number

  @Column('source_name')
  sourceName!: string

  @Column('source_desc')
  sourceDesc!: string

  @Column('source_type')
  sourceType!: DataSourceDao.DataSourceType

  @Column('host')
  host!: string

  @Column('port')
  port!: number

  @Column('database_name')
  databaseName!: string

  @Column('username')
  username!: string

  @Column('status')
  status!: DataSourceDao.DataSourceStatus

  @Column('create_time')
  createTime!: string

  @Column('update_time')
  updateTime!: string

  @Column('created_by')
  createdBy!: string

  @Column('updated_by')
  updatedBy!: string

  @Column('table_count')
  tableCount!: number
}

class DataSourceTableMapping implements DataSourceDao.DataSourceTableRecord, IColumnTarget {
  columnsMapper(data: Array<Row> | Row): Array<Row> | Row {
    return mapToTarget(this, data, entityColumnsMap.get(this.constructor))
  }

  @Column('id')
  id!: number

  @Column('data_source_id')
  dataSourceId!: number

  @Column('table_name')
  tableName!: string

  @Column('table_comment')
  tableComment!: string

  @Column('table_rows')
  tableRows!: number

  @Column('last_sync_time')
  lastSyncTime!: string

  @Column('create_time')
  createTime!: string

  @Column('update_time')
  updateTime!: string

  @Column('is_deleted')
  isDeleted!: number | null
}

class DataSourceColumnMapping implements DataSourceDao.DataSourceColumnRecord, IColumnTarget {
  columnsMapper(data: Array<Row> | Row): Array<Row> | Row {
    return mapToTarget(this, data, entityColumnsMap.get(this.constructor))
  }

  @Column('id')
  id!: number

  @Column('data_source_id')
  dataSourceId!: number

  @Column('table_name')
  tableName!: string

  @Column('column_name')
  columnName!: string

  @Column('column_type')
  columnType!: string

  @Column('column_comment')
  columnComment!: string

  @Column('nullable')
  nullable!: string

  @Column('ordinal_position')
  ordinalPosition!: number

  @Column('create_time')
  createTime!: string

  @Column('update_time')
  updateTime!: string

  @Column('is_deleted')
  isDeleted!: number | null
}

export class DataSourceMapper extends BaseMapper {
  public dataSourceName = DATA_SOURCE_NAME

  public override async exe<T>(sql: string, params?: Array<any>): Promise<T> {
    return await super.exe<T>(sql, params)
  }

  public async createDataSource(createParams: DataSourceDao.CreateDataSourceParams): Promise<number> {
    const { keys, values } = convertToSqlProperties(createParams)
    const sql = `insert into ${DATA_SOURCE_TABLE_NAME} (${keys.join(',')}) values (${keys.map(() => '?').join(',')})`
    const result = await this.exe<ResultSetHeader>(sql, values)
    return result.insertId
  }

  public async updateDataSource(updateParams: DataSourceDao.UpdateDataSourceParams): Promise<boolean> {
    const { keys, values } = convertToSqlProperties(updateParams)
    const setClause = keys.map((key) => `${key} = ?`).join(', ')
    const sql = `update ${DATA_SOURCE_TABLE_NAME} set ${setClause} where id = ? and is_deleted = 0`
    const result = await this.exe<ResultSetHeader>(sql, [...values, updateParams.id])
    return result.affectedRows > 0
  }

  public async deleteDataSource(deleteParams: DataSourceDao.DeleteDataSourceParams): Promise<boolean> {
    const sql = `update ${DATA_SOURCE_TABLE_NAME} set is_deleted = 1, updated_by = ?, update_time = ? where id = ? and is_deleted = 0`
    const result = await this.exe<ResultSetHeader>(sql, [
      deleteParams.updatedBy,
      deleteParams.updateTime,
      deleteParams.id
    ])
    return result.affectedRows > 0
  }

  @Mapping(DataSourceMapping)
  public async getDataSource<T extends DataSourceDao.DataSourceRecord = DataSourceDao.DataSourceRecord>(
    query: DataSourceDao.GetDataSourceParams
  ): Promise<T> {
    const sql = `select ${DATA_SOURCE_FIELDS.join(', ')} from ${DATA_SOURCE_TABLE_NAME} where id = ? and is_deleted = 0`
    const result = await this.exe<Array<T>>(sql, [query.id])
    return result?.[0]
  }

  public async countDataSources(query: DataSourceDao.GetDataSourceListParams): Promise<number> {
    const { whereClause, params } = this.buildDataSourceListQuery(query)
    const sql = `select count(*) as total from ${DATA_SOURCE_TABLE_NAME} ds ${whereClause}`
    const result = await this.exe<Array<{ total: number }>>(sql, params)
    return Number(result?.[0]?.total || 0)
  }

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
