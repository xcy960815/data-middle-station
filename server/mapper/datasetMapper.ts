import type { IColumnTarget, Row } from '@/server/mapper/baseMapper'
import { BaseMapper, Column, Mapping, entityColumnsMap, mapToTarget } from '@/server/mapper/baseMapper'
import { convertToSqlProperties } from '@/server/utils/databaseHelper'
import type { ResultSetHeader } from 'mysql2'

const DATA_SOURCE_NAME = 'data_middle_station'
const DATASET_TABLE_NAME = '`dataset`'
const DATASET_CONFIG_TABLE_NAME = '`dataset_config`'

const DATASET_FIELDS = [
  'id',
  'dataset_name',
  'dataset_desc',
  'data_source_id',
  'base_table',
  'status',
  'current_config_id',
  'create_time',
  'update_time',
  'created_by',
  'updated_by',
  'is_deleted'
]

const DATASET_CONFIG_FIELDS = [
  'id',
  'dataset_id',
  'version_no',
  'fields_config',
  'change_note',
  'create_time',
  'created_by',
  'update_time',
  'is_deleted'
]

const DATASET_LIST_SORT_FIELD_MAP: Record<DatasetDao.DatasetListSortField, string> = {
  datasetName: 'd.dataset_name',
  createTime: 'd.create_time',
  updateTime: 'd.update_time'
}

class DatasetMapping implements DatasetDao.DatasetRecord, IColumnTarget {
  columnsMapper(data: Array<Row> | Row): Array<Row> | Row {
    return mapToTarget(this, data, entityColumnsMap.get(this.constructor))
  }

  @Column('id')
  id!: number

  @Column('dataset_name')
  datasetName!: string

  @Column('dataset_desc')
  datasetDesc!: string

  @Column('data_source_id')
  dataSourceId!: number

  @Column('base_table')
  baseTable!: string

  @Column('status')
  status!: DatasetDao.DatasetStatus

  @Column('current_config_id')
  currentConfigId!: number | null

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

class DatasetConfigMapping implements DatasetDao.DatasetConfigRecord, IColumnTarget {
  private mappedFieldsConfig: DatasetDao.DatasetFieldConfigItem[] = []

  columnsMapper(data: Array<Row> | Row): Array<Row> | Row {
    return mapToTarget(this, data, entityColumnsMap.get(this.constructor))
  }

  @Column('id')
  id!: number

  @Column('dataset_id')
  datasetId!: number

  @Column('version_no')
  versionNo!: number

  @Column('fields_config')
  get fieldsConfig(): DatasetDao.DatasetFieldConfigItem[] {
    return this.mappedFieldsConfig
  }

  set fieldsConfig(value: string | DatasetDao.DatasetFieldConfigItem[] | null) {
    if (!value) {
      this.mappedFieldsConfig = []
      return
    }
    this.mappedFieldsConfig = typeof value === 'string' ? JSON.parse(value) : value
  }

  @Column('change_note')
  changeNote!: string | null

  @Column('create_time')
  createTime!: string

  @Column('created_by')
  createdBy!: string

  @Column('update_time')
  updateTime!: string

  @Column('is_deleted')
  isDeleted!: number | null
}

class DatasetListMapping implements DatasetVo.DatasetListItem, IColumnTarget {
  columnsMapper(data: Array<Row> | Row): Array<Row> | Row {
    return mapToTarget(this, data, entityColumnsMap.get(this.constructor))
  }

  @Column('id')
  id!: number

  @Column('dataset_name')
  datasetName!: string

  @Column('dataset_desc')
  datasetDesc!: string

  @Column('data_source_id')
  dataSourceId!: number

  @Column('base_table')
  baseTable!: string

  @Column('status')
  status!: DatasetDao.DatasetStatus

  @Column('create_time')
  createTime!: string

  @Column('update_time')
  updateTime!: string

  @Column('created_by')
  createdBy!: string

  @Column('updated_by')
  updatedBy!: string

  @Column('data_source_name')
  dataSourceName!: string

  @Column('field_count')
  fieldCount!: number
}

/**
 * @desc 数据集 mapper，负责对数据集及数据集配置的增删改查
 */
export class DatasetMapper extends BaseMapper {
  /**
   * @desc 当前 mapper 使用的数据源名称
   */
  public dataSourceName = DATA_SOURCE_NAME

  /**
   * @desc 执行 SQL 的便捷封装（保留泛型能力）
   * @param sql 需要执行的 SQL 语句
   * @param params 预编译参数数组
   * @returns 查询或写入操作的执行结果
   */
  public override async exe<T>(sql: string, params?: Array<any>): Promise<T> {
    return await super.exe<T>(sql, params)
  }

  /**
   * @desc 创建数据集
   * @param createParams 创建参数
   * @returns 新创建的数据集 ID
   */
  public async createDataset(createParams: DatasetDao.CreateDatasetParams): Promise<number> {
    const { keys, values } = convertToSqlProperties(createParams)
    const sql = `insert into ${DATASET_TABLE_NAME} (${keys.join(',')}) values (${keys.map(() => '?').join(',')})`
    const result = await this.exe<ResultSetHeader>(sql, values)
    return result.insertId
  }

  /**
   * @desc 更新数据集基本信息
   * @param updateParams 更新参数
   * @returns 是否更新成功
   */
  public async updateDataset(updateParams: DatasetDao.UpdateDatasetParams): Promise<boolean> {
    const { keys, values } = convertToSqlProperties(updateParams)
    const setClause = keys.map((key) => `${key} = ?`).join(', ')
    const sql = `update ${DATASET_TABLE_NAME} set ${setClause} where id = ? and is_deleted = 0`
    const result = await this.exe<ResultSetHeader>(sql, [...values, updateParams.id])
    return result.affectedRows > 0
  }

  /**
   * @desc 删除数据集（逻辑删除）
   * @param deleteParams 删除参数
   * @returns 是否删除成功
   */
  public async deleteDataset(deleteParams: DatasetDao.DeleteDatasetParams): Promise<boolean> {
    const sql = `update ${DATASET_TABLE_NAME} set is_deleted = 1, updated_by = ?, update_time = ? where id = ? and is_deleted = 0`
    const result = await this.exe<ResultSetHeader>(sql, [
      deleteParams.updatedBy,
      deleteParams.updateTime,
      deleteParams.id
    ])
    return result.affectedRows > 0
  }

  /**
   * @desc 获取单个数据集详情
   * @param query 查询参数
   * @returns 数据集记录
   */
  @Mapping(DatasetMapping)
  public async getDataset<T extends DatasetDao.DatasetRecord = DatasetDao.DatasetRecord>(
    query: DatasetDao.GetDatasetParams
  ): Promise<T> {
    const sql = `select ${DATASET_FIELDS.join(', ')} from ${DATASET_TABLE_NAME} where id = ? and is_deleted = 0`
    const result = await this.exe<Array<T>>(sql, [query.id])
    return result?.[0]
  }

  /**
   * @desc 获取数据集数量
   * @param query 列表查询参数
   * @returns 数据集数量
   */
  public async countDatasets(query: DatasetDao.GetDatasetListParams): Promise<number> {
    const { whereClause, params } = this.buildDatasetListQuery(query)
    const sql = `select count(*) as total from ${DATASET_TABLE_NAME} d ${whereClause}`
    const result = await this.exe<Array<{ total: number }>>(sql, params)
    return Number(result?.[0]?.total || 0)
  }

  /**
   * @desc 获取数据集列表（分页）
   * @param query 列表查询参数
   * @returns 数据集列表
   */
  @Mapping(DatasetListMapping)
  public async getDatasetList<T extends DatasetVo.DatasetListItem = DatasetVo.DatasetListItem>(
    query: DatasetDao.GetDatasetListParams
  ): Promise<T[]> {
    const { whereClause, params } = this.buildDatasetListQuery(query)
    const sortField = DATASET_LIST_SORT_FIELD_MAP[query.sortField] || DATASET_LIST_SORT_FIELD_MAP.updateTime
    const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc'
    const offset = (query.page - 1) * query.pageSize
    const sql = `
      select
        ${DATASET_FIELDS.map((field) => `d.${field}`).join(',\n        ')},
        ds.source_name as data_source_name,
        json_length(dc.fields_config) as field_count
      from ${DATASET_TABLE_NAME} d
      left join data_source ds on ds.id = d.data_source_id
      left join ${DATASET_CONFIG_TABLE_NAME} dc on dc.id = d.current_config_id
      ${whereClause}
      order by ${sortField} ${sortOrder}
      limit ? offset ?`
    return await this.exe<T[]>(sql, [...params, query.pageSize, offset])
  }

  /**
   * @desc 获取数据集配置详情
   * @param query 查询参数
   * @returns 数据集配置记录
   */
  @Mapping(DatasetConfigMapping)
  public async getDatasetConfig<T extends DatasetDao.DatasetConfigRecord = DatasetDao.DatasetConfigRecord>(
    query: DatasetDao.GetDatasetConfigParams
  ): Promise<T> {
    const { keys, values } = convertToSqlProperties(query)
    const conditions = keys.map((key) => `${key} = ?`)
    if (!keys.includes('is_deleted')) {
      conditions.push('is_deleted = 0')
    }
    const sql = `select ${DATASET_CONFIG_FIELDS.join(', ')} from ${DATASET_CONFIG_TABLE_NAME} where ${conditions.join(' and ')}`
    const result = await this.exe<Array<T>>(sql, values)
    return result?.[0]
  }

  /**
   * @desc 创建数据集配置版本
   * @param createParams 创建参数
   * @returns 新创建的配置版本 ID
   */
  public async createDatasetConfig(createParams: DatasetDao.CreateDatasetConfigParams): Promise<number> {
    const { keys, values } = convertToSqlProperties(createParams)
    const sql = `insert into ${DATASET_CONFIG_TABLE_NAME} (${keys.join(',')}) values (${keys.map(() => '?').join(',')})`
    const result = await this.exe<ResultSetHeader>(sql, values)
    return result.insertId
  }

  /**
   * @desc 获取数据集配置的下一个版本号
   * @param datasetId 数据集 ID
   * @returns 下一个版本号
   */
  public async getNextVersionNo(datasetId: number): Promise<number> {
    const sql = `select coalesce(max(version_no), 0) + 1 as next_version_no from ${DATASET_CONFIG_TABLE_NAME} where dataset_id = ?`
    const result = await this.exe<Array<{ next_version_no: number }>>(sql, [datasetId])
    return Number(result?.[0]?.next_version_no || 1)
  }

  private buildDatasetListQuery(query: DatasetDao.GetDatasetListParams) {
    const conditions = ['d.is_deleted = 0']
    const params: string[] = []
    if (query.keyword) {
      conditions.push('(d.dataset_name like ? or d.dataset_desc like ? or d.base_table like ?)')
      params.push(`%${query.keyword}%`, `%${query.keyword}%`, `%${query.keyword}%`)
    }
    return {
      whereClause: `where ${conditions.join(' and ')}`,
      params
    }
  }
}
