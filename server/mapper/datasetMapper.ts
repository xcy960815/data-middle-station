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
 * 数据集主表的表名
 * @type {string}
 */
const DATASET_TABLE_NAME = '`dataset`'

/**
 * 数据集配置历史表的表名
 * @type {string}
 */
const DATASET_CONFIG_TABLE_NAME = '`dataset_config`'

/**
 * 数据集主表的所有字段列表
 * @type {string[]}
 */
const DATASET_FIELDS = [
  'id',
  'dataset_name',
  'dataset_desc',
  'status',
  'current_config_id',
  'create_time',
  'update_time',
  'created_by',
  'updated_by',
  'is_deleted'
]

/**
 * 数据集配置历史表的所有字段列表
 * @type {string[]}
 */
const DATASET_CONFIG_FIELDS = [
  'id',
  'dataset_id',
  'version_no',
  'query_sql',
  'fields_config',
  'change_note',
  'create_time',
  'created_by',
  'update_time',
  'is_deleted'
]

/**
 * 数据集列表排序字段映射表，将前端字段名映射为数据库带表前缀的列名
 * @type {Record<DatasetDao.DatasetListSortField, string>}
 */
const DATASET_LIST_SORT_FIELD_MAP: Record<DatasetDao.DatasetListSortField, string> = {
  datasetName: 'd.dataset_name',
  createTime: 'd.create_time',
  updateTime: 'd.update_time'
}

/**
 * 数据集基本信息实体映射类，用于把数据库行数据映射成数据集记录对象。
 * @implements {DatasetDao.DatasetRecord}
 * @implements {IColumnTarget}
 */
class DatasetMapping implements DatasetDao.DatasetRecord, IColumnTarget {
  /**
   * 列映射方法，将数据库原始行数据映射为当前类的属性
   * @param {Array<Row> | Row} data 原始数据库行数据
   * @returns {Array<Row> | Row} 映射后的数据
   */
  columnsMapper(data: Array<Row> | Row): Array<Row> | Row {
    return mapToTarget(this, data, entityColumnsMap.get(this.constructor))
  }

  /**
   * 数据集 ID
   * @type {number}
   */
  @Column('id')
  id!: number

  /**
   * 数据集名称
   * @type {string}
   */
  @Column('dataset_name')
  datasetName!: string

  /**
   * 数据集描述
   * @type {string}
   */
  @Column('dataset_desc')
  datasetDesc!: string

  /**
   * 数据集状态
   * @type {DatasetDao.DatasetStatus}
   */
  @Column('status')
  status!: DatasetDao.DatasetStatus

  /**
   * 当前生效的配置 ID
   * @type {number | null}
   */
  @Column('current_config_id')
  currentConfigId!: number | null

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
   * 创建人账号
   * @type {string}
   */
  @Column('created_by')
  createdBy!: string

  /**
   * 更新人账号
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
 * 数据集配置实体映射类，用于把数据库行数据映射成数据集配置对象。
 * @implements {DatasetDao.DatasetConfigRecord}
 * @implements {IColumnTarget}
 */
class DatasetConfigMapping implements DatasetDao.DatasetConfigRecord, IColumnTarget {
  /**
   * 缓存的反序列化后的字段配置列表
   * @type {DatasetDao.DatasetFieldConfigItem[]}
   * @private
   */
  private mappedFieldsConfig: DatasetDao.DatasetFieldConfigItem[] = []

  /**
   * 列映射方法，将数据库原始行数据映射为当前类的属性
   * @param {Array<Row> | Row} data 原始数据库行数据
   * @returns {Array<Row> | Row} 映射后的数据
   */
  columnsMapper(data: Array<Row> | Row): Array<Row> | Row {
    return mapToTarget(this, data, entityColumnsMap.get(this.constructor))
  }

  /**
   * 配置 ID
   * @type {number}
   */
  @Column('id')
  id!: number

  /**
   * 数据集 ID
   * @type {number}
   */
  @Column('dataset_id')
  datasetId!: number

  /**
   * 版本号
   * @type {number}
   */
  @Column('version_no')
  versionNo!: number

  /**
   * 查询 SQL
   * @type {string}
   */
  @Column('query_sql')
  querySql!: string

  /**
   * 字段配置信息，包含 getter 和 setter，用于 JSON 字符串和对象的自动转换
   * @type {DatasetDao.DatasetFieldConfigItem[]}
   */
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

  /**
   * 变更说明
   * @type {string | null}
   */
  @Column('change_note')
  changeNote!: string | null

  /**
   * 创建时间
   * @type {string}
   */
  @Column('create_time')
  createTime!: string

  /**
   * 创建人
   * @type {string}
   */
  @Column('created_by')
  createdBy!: string

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
 * 数据集列表项实体映射类，用于将包含关联字段的数据库行映射为列表展示对象。
 * @implements {DatasetVo.DatasetListItem}
 * @implements {IColumnTarget}
 */
class DatasetListMapping implements DatasetVo.DatasetListItem, IColumnTarget {
  /**
   * 列映射方法，将数据库原始行数据映射为当前类的属性
   * @param {Array<Row> | Row} data 原始数据库行数据
   * @returns {Array<Row> | Row} 映射后的数据
   */
  columnsMapper(data: Array<Row> | Row): Array<Row> | Row {
    return mapToTarget(this, data, entityColumnsMap.get(this.constructor))
  }

  /**
   * 数据集 ID
   * @type {number}
   */
  @Column('id')
  id!: number

  /**
   * 数据集名称
   * @type {string}
   */
  @Column('dataset_name')
  datasetName!: string

  /**
   * 数据集描述
   * @type {string}
   */
  @Column('dataset_desc')
  datasetDesc!: string

  /**
   * 数据集查询 SQL
   * @type {string}
   */
  @Column('query_sql')
  querySql!: string

  /**
   * 数据集状态
   * @type {DatasetDao.DatasetStatus}
   */
  @Column('status')
  status!: DatasetDao.DatasetStatus

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
   * 字段数量
   * @type {number}
   */
  @Column('field_count')
  fieldCount!: number

  /**
   * 当前用户对该数据集的最高权限类型
   * @type {PermissionVo.ResourcePermissionType}
   */
  @Column('dataset_permission')
  datasetPermission!: PermissionVo.ResourcePermissionType
}

/**
 * 数据集 Mapper 类，负责对数据集基本信息及其配置版本进行增删改查。
 * @extends {BaseMapper}
 */
export class DatasetMapper extends BaseMapper {
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
   * 创建数据集
   * @param {DatasetDao.CreateDatasetParams} createParams 创建参数
   * @returns {Promise<number>} 新创建的数据集 ID
   */
  public async createDataset(createParams: DatasetDao.CreateDatasetParams): Promise<number> {
    const { keys, values } = convertToSqlProperties(createParams)
    const sql = `insert into ${DATASET_TABLE_NAME} (${keys.join(',')}) values (${keys.map(() => '?').join(',')})`
    const result = await this.exe<ResultSetHeader>(sql, values)
    return result.insertId
  }

  /**
   * 更新数据集基本信息
   * @param {DatasetDao.UpdateDatasetParams} updateParams 更新参数
   * @returns {Promise<boolean>} 是否更新成功
   */
  public async updateDataset(updateParams: DatasetDao.UpdateDatasetParams): Promise<boolean> {
    const { keys, values } = convertToSqlProperties(updateParams)
    const setClause = keys.map((key) => `${key} = ?`).join(', ')
    const sql = `update ${DATASET_TABLE_NAME} set ${setClause} where id = ? and is_deleted = 0`
    const result = await this.exe<ResultSetHeader>(sql, [...values, updateParams.id])
    return result.affectedRows > 0
  }

  /**
   * 删除数据集（逻辑删除）
   * @param {DatasetDao.DeleteDatasetParams} deleteParams 删除参数
   * @returns {Promise<boolean>} 是否删除成功
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
   * 获取单个数据集详情（含资源权限校验）
   * @template T 返回的数据集记录类型，默认继承自 DatasetDao.DatasetRecord
   * @param {DatasetDao.GetDatasetParams} query 查询及权限判断参数
   * @returns {Promise<T>} 数据集记录
   */
  @Mapping(DatasetMapping)
  public async getDataset<T extends DatasetDao.DatasetRecord = DatasetDao.DatasetRecord>(
    query: DatasetDao.GetDatasetParams
  ): Promise<T> {
    const { whereClause, params } = this.buildDatasetAccessQuery(query)
    const sql = `select ${DATASET_FIELDS.join(', ')} from ${DATASET_TABLE_NAME} d ${whereClause}`
    const result = await this.exe<Array<T>>(sql, params)
    return result?.[0]
  }

  /**
   * 获取数据集详情（内部使用，跳过权限校验，仅用于获取 Owner 等内部信息）
   * @template T 返回的数据集记录类型，默认继承自 DatasetDao.DatasetRecord
   * @param {number} id 数据集 ID
   * @returns {Promise<T>} 数据集记录
   */
  @Mapping(DatasetMapping)
  public async getDatasetWithoutAccess<T extends DatasetDao.DatasetRecord = DatasetDao.DatasetRecord>(
    id: number
  ): Promise<T> {
    const sql = `select ${DATASET_FIELDS.join(', ')} from ${DATASET_TABLE_NAME} d where d.id = ? and d.is_deleted = 0`
    const result = await this.exe<Array<T>>(sql, [id])
    return result?.[0]
  }

  /**
   * 获取数据集数量
   * @param {DatasetDao.GetDatasetListParams} query 列表查询参数
   * @returns {Promise<number>} 数据集数量
   */
  public async countDatasets(query: DatasetDao.GetDatasetListParams): Promise<number> {
    const { whereClause, params } = this.buildDatasetListQuery(query)
    const sql = `
      select count(distinct d.id) as total
      from ${DATASET_TABLE_NAME} d
      left join ${DATASET_CONFIG_TABLE_NAME} dc on dc.id = d.current_config_id
      left join resource_role_permission rrp on rrp.resource_type = 'dataset' and rrp.resource_id = d.id
      left join role r on r.id = rrp.role_id and r.is_deleted = 0 and r.status = 1
      ${whereClause}`
    const result = await this.exe<Array<{ total: number }>>(sql, params)
    return Number(result?.[0]?.total || 0)
  }

  /**
   * 获取数据集列表（分页）
   * @template T 返回的列表项类型，默认继承自 DatasetVo.DatasetListItem
   * @param {DatasetDao.GetDatasetListParams} query 列表查询参数
   * @returns {Promise<T[]>} 数据集列表
   */
  @Mapping(DatasetListMapping)
  public async getDatasetList<T extends DatasetVo.DatasetListItem = DatasetVo.DatasetListItem>(
    query: DatasetDao.GetDatasetListParams
  ): Promise<T[]> {
    const { whereClause, params, permissionSelectSql } = this.buildDatasetListQuery(query)
    const sortField = DATASET_LIST_SORT_FIELD_MAP[query.sortField] || DATASET_LIST_SORT_FIELD_MAP.updateTime
    const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc'
    const offset = (query.page - 1) * query.pageSize
    const sql = `
      select
        ${DATASET_FIELDS.map((field) => `d.${field}`).join(',\n        ')},
        dc.query_sql as query_sql,
        json_length(dc.fields_config) as field_count,
        ${permissionSelectSql} as dataset_permission
      from ${DATASET_TABLE_NAME} d
      left join ${DATASET_CONFIG_TABLE_NAME} dc on dc.id = d.current_config_id
      left join resource_role_permission rrp on rrp.resource_type = 'dataset' and rrp.resource_id = d.id
      left join role r on r.id = rrp.role_id and r.is_deleted = 0 and r.status = 1
      ${whereClause}
      group by d.id, d.dataset_name, d.dataset_desc, d.status, d.create_time, d.update_time, d.created_by, d.updated_by, dc.query_sql, dc.fields_config
      order by ${sortField} ${sortOrder}
      limit ? offset ?`
    return await this.exe<T[]>(sql, [...params, query.pageSize, offset])
  }

  /**
   * 获取数据集配置详情
   * @template T 返回配置记录类型，默认继承自 DatasetDao.DatasetConfigRecord
   * @param {DatasetDao.GetDatasetConfigParams} query 查询参数
   * @returns {Promise<T>} 数据集配置记录
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
   * 创建数据集配置版本
   * @param {DatasetDao.CreateDatasetConfigParams} createParams 创建参数
   * @returns {Promise<number>} 新创建的配置版本 ID
   */
  public async createDatasetConfig(createParams: DatasetDao.CreateDatasetConfigParams): Promise<number> {
    const { keys, values } = convertToSqlProperties(createParams)
    const sql = `insert into ${DATASET_CONFIG_TABLE_NAME} (${keys.join(',')}) values (${keys.map(() => '?').join(',')})`
    const result = await this.exe<ResultSetHeader>(sql, values)
    return result.insertId
  }

  /**
   * 获取数据集配置的下一个版本号
   * @param {number} datasetId 数据集 ID
   * @returns {Promise<number>} 下一个版本号
   */
  public async getNextVersionNo(datasetId: number): Promise<number> {
    const sql = `select coalesce(max(version_no), 0) + 1 as next_version_no from ${DATASET_CONFIG_TABLE_NAME} where dataset_id = ?`
    const result = await this.exe<Array<{ next_version_no: number }>>(sql, [datasetId])
    return Number(result?.[0]?.next_version_no || 1)
  }

  /**
   * 构造数据集详情查询的 where 子句及参数（含权限过滤）
   * @param {DatasetDao.GetDatasetParams} query 查询参数
   * @returns {{ whereClause: string; params: Array<string | number> }} 返回的 where 子句和参数数组
   * @private
   */
  private buildDatasetAccessQuery(query: DatasetDao.GetDatasetParams) {
    const whereConditions = ['d.id = ?', 'd.is_deleted = 0']
    const params: Array<string | number> = [query.id]
    if (!query.roleCodes?.includes('admin')) {
      if (query.roleCodes?.length) {
        whereConditions.push(`(
          d.created_by = ?
          or exists (
            select 1
            from resource_role_permission rrp
            inner join role r on r.id = rrp.role_id and r.is_deleted = 0 and r.status = 1
            where rrp.resource_type = 'dataset'
              and rrp.resource_id = d.id
              and r.role_code in (${query.roleCodes.map(() => '?').join(',')})
          )
        )`)
        params.push(query.currentUserName || '', ...query.roleCodes)
      } else {
        whereConditions.push('d.created_by = ?')
        params.push(query.currentUserName || '')
      }
    }
    return {
      whereClause: `where ${whereConditions.join(' and ')}`,
      params
    }
  }

  /**
   * 构造数据集列表查询的 where 子句及参数（含权限过滤与权限计算 SQL 片段）
   * @param {DatasetDao.GetDatasetListParams} query 列表查询参数
   * @returns {{ whereClause: string; params: string[]; permissionSelectSql: string }} 返回的 where 子句和参数数组
   * @private
   */
  private buildDatasetListQuery(query: DatasetDao.GetDatasetListParams) {
    const roleCodes = query.roleCodes || []
    const isAdmin = roleCodes.includes('admin')
    const conditions = ['d.is_deleted = 0']
    const params: string[] = []
    if (query.keyword) {
      conditions.push('(d.dataset_name like ? or d.dataset_desc like ? or dc.query_sql like ?)')
      params.push(`%${query.keyword}%`, `%${query.keyword}%`, `%${query.keyword}%`)
    }

    if (!isAdmin) {
      if (roleCodes.length > 0) {
        conditions.push(`(d.created_by = ? or r.role_code in (${roleCodes.map(() => '?').join(',')}))`)
        params.push(query.currentUserName || '', ...roleCodes)
      } else {
        conditions.push('d.created_by = ?')
        params.push(query.currentUserName || '')
      }
    }

    return {
      whereClause: `where ${conditions.join(' and ')}`,
      params,
      permissionSelectSql: isAdmin
        ? `'manage'`
        : `case
            when d.created_by = ${this.escapeValue(query.currentUserName || '')} then 'manage'
            when max(case rrp.permission_type when 'manage' then 3 when 'edit' then 2 when 'view' then 1 else 0 end) = 3 then 'manage'
            when max(case rrp.permission_type when 'manage' then 3 when 'edit' then 2 when 'view' then 1 else 0 end) = 2 then 'edit'
            when max(case rrp.permission_type when 'manage' then 3 when 'edit' then 2 when 'view' then 1 else 0 end) = 1 then 'view'
            else 'none'
          end`
    }
  }

  /**
   * 转义单引号以保证 SQL 拼接安全性
   * @param {string} value 待转义的字符串
   * @returns {string} 转义并包裹单引号后的 SQL 值片段
   * @private
   */
  private escapeValue(value: string) {
    return `'${value.replace(/'/g, "''")}'`
  }
}
