import { DatabaseMapper } from '@/server/mapper/databaseMapper'
import { DatasetMapper } from '@/server/mapper/datasetMapper'
import { BaseService } from '@/server/service/baseService'
import { ResourcePermissionService } from '@/server/service/resourcePermissionService'
import { assertReadOnlyDatasetSql } from '@/server/utils/datasetSql'
import { RedisStorage } from '@/server/utils/redis-storage'

const DEFAULT_PREVIEW_LIMIT = 100
const MAX_PREVIEW_LIMIT = 500
const DEFAULT_QUERY_SQL = 'SELECT 1 AS sample_value'
const SCHEMA_CACHE_TTL = 5 * 60 * 1000 // 5 分钟
const SCHEMA_CACHE_KEY = 'dataset_schema'

/**
 * @class DatasetService
 * @extends BaseService
 * @description 数据集服务类，负责数据集的 CRUD 业务逻辑处理、SQL 安全性校验以及数据预览等操作。
 */
export class DatasetService extends BaseService {
  /**
   * 数据集数据访问映射器
   * @private
   * @type {DatasetMapper}
   */
  private datasetMapper: DatasetMapper

  /**
   * 资源权限服务
   * @private
   * @type {ResourcePermissionService}
   */
  private resourcePermissionService: ResourcePermissionService

  /**
   * 构造函数，初始化数据集映射器
   */
  constructor() {
    super()
    this.datasetMapper = new DatasetMapper()
    this.resourcePermissionService = new ResourcePermissionService()
  }

  /**
   * 分页获取数据集列表
   * @public
   * @param {DatasetDto.GetDatasetListRequest} [queryRequest={}] 数据集列表查询请求参数
   * @returns {Promise<DatasetVo.DatasetListResponse>} 包含分页数据和查询条件的数据集列表响应
   */
  public async getDatasets(
    queryRequest: DatasetDto.GetDatasetListRequest = {}
  ): Promise<DatasetVo.DatasetListResponse> {
    const currentUser = this.getCurrentUser()
    const normalizedQueryParams: DatasetDao.GetDatasetListParams = {
      page: Math.max(1, Math.floor(Number(queryRequest.page || 1))),
      pageSize: Math.min(100, Math.max(1, Math.floor(Number(queryRequest.pageSize || 12)))),
      keyword: queryRequest.keyword?.trim() || '',
      sortField: queryRequest.sortField || 'updateTime',
      sortOrder: queryRequest.sortOrder || 'desc',
      currentUserName: currentUser?.userName,
      roleCodes: currentUser?.roleCodes || []
    }

    const [total, list] = await Promise.all([
      this.datasetMapper.countDatasets(normalizedQueryParams),
      this.datasetMapper.getDatasetList(normalizedQueryParams)
    ])

    return {
      list,
      total,
      page: normalizedQueryParams.page,
      pageSize: normalizedQueryParams.pageSize,
      keyword: normalizedQueryParams.keyword || '',
      sortField: normalizedQueryParams.sortField,
      sortOrder: normalizedQueryParams.sortOrder
    }
  }

  /**
   * 根据 ID 获取数据集的详细信息（包括当前的 SQL 配置和字段配置），含权限校验
   * @public
   * @param {DatasetDto.GetDatasetRequest} queryRequest 获取单个数据集请求参数，包含 ID
   * @throws {Error} 当数据集不存在或无权访问时抛出异常
   * @returns {Promise<DatasetVo.DatasetDetailResponse>} 数据集详情响应
   */
  public async getDataset(queryRequest: DatasetDto.GetDatasetRequest): Promise<DatasetVo.DatasetDetailResponse> {
    const currentUser = this.getCurrentUser()
    await this.resourcePermissionService.assertResourcePermission({
      resourceType: 'dataset',
      resourceId: queryRequest.id,
      requiredPermission: 'view'
    })
    const dataset = await this.datasetMapper.getDataset({
      id: queryRequest.id,
      currentUserName: currentUser?.userName,
      roleCodes: currentUser?.roleCodes || []
    })
    if (!dataset) {
      throw new Error('数据集不存在或无权访问')
    }
    const datasetConfig = dataset.currentConfigId
      ? await this.datasetMapper.getDatasetConfig({ id: dataset.currentConfigId })
      : null

    return {
      ...dataset,
      querySql: datasetConfig?.querySql || '',
      fieldsConfig: datasetConfig?.fieldsConfig || [],
      datasetPermission: currentUser
        ? await this.resourcePermissionService.getCurrentUserResourcePermission(
            'dataset',
            dataset.id,
            currentUser.userName,
            currentUser.roleCodes || []
          )
        : 'manage'
    }
  }

  /**
   * 创建新的数据集，并自动生成初始版本配置。任何登录用户均可创建，创建者自动成为 Owner。
   * @public
   * @param {DatasetDto.CreateDatasetRequest} createRequest 创建数据集请求参数
   * @throws {Error} SQL 包含非只读语句时抛出异常
   * @returns {Promise<DatasetVo.DatasetDetailResponse>} 创建成功后的数据集详情
   */
  public async createDataset(createRequest: DatasetDto.CreateDatasetRequest): Promise<DatasetVo.DatasetDetailResponse> {
    const querySql = String(createRequest.querySql || DEFAULT_QUERY_SQL).trim() || DEFAULT_QUERY_SQL
    assertReadOnlyDatasetSql(querySql)

    const { createdBy, updatedBy, createTime, updateTime } = await this.getDefaultInfo()
    const datasetId = await this.datasetMapper.createDataset({
      datasetName: createRequest.datasetName,
      datasetDesc: createRequest.datasetDesc || '',
      status: createRequest.status || 'enabled',
      currentConfigId: null,
      createdBy,
      updatedBy,
      createTime,
      updateTime
    })

    const fieldsConfig = createRequest.fieldsConfig?.length
      ? createRequest.fieldsConfig
      : (await this.previewDatasetSql({ querySql, limit: DEFAULT_PREVIEW_LIMIT })).columns

    const configId = await this.datasetMapper.createDatasetConfig({
      datasetId,
      versionNo: 1,
      querySql,
      fieldsConfig,
      changeNote: '初始化版本',
      createdBy,
      createTime,
      updateTime
    })
    await this.datasetMapper.updateDataset({
      id: datasetId,
      currentConfigId: configId,
      updatedBy,
      updateTime
    })
    return await this.getDataset({ id: datasetId })
  }

  /**
   * 更新数据集基础信息或配置。需要 edit 及以上权限。若修改了 SQL 或字段配置，会保存为新版本。
   * @public
   * @param {DatasetDto.UpdateDatasetRequest} updateRequest 更新数据集请求参数
   * @throws {Error} 权限不足，SQL 包含非只读语句，或保存数据集失败时抛出异常
   * @returns {Promise<DatasetVo.DatasetDetailResponse>} 更新后的数据集详情
   */
  public async updateDataset(updateRequest: DatasetDto.UpdateDatasetRequest): Promise<DatasetVo.DatasetDetailResponse> {
    await this.resourcePermissionService.assertResourcePermission({
      resourceType: 'dataset',
      resourceId: updateRequest.id,
      requiredPermission: 'edit'
    })
    const currentDataset = await this.getDataset({ id: updateRequest.id })
    const { createdBy, updatedBy, createTime, updateTime } = await this.getDefaultInfo()

    if (updateRequest.querySql) {
      assertReadOnlyDatasetSql(updateRequest.querySql)
    }

    const updateResult = await this.datasetMapper.updateDataset({
      id: updateRequest.id,
      datasetName: updateRequest.datasetName,
      datasetDesc: updateRequest.datasetDesc,
      status: updateRequest.status,
      updatedBy,
      updateTime
    })
    if (!updateResult) {
      throw new Error('保存数据集失败')
    }

    const shouldCreateConfigVersion = Boolean(updateRequest.querySql || updateRequest.fieldsConfig)
    if (shouldCreateConfigVersion) {
      const nextVersionNo = await this.datasetMapper.getNextVersionNo(updateRequest.id)
      const querySql = String(updateRequest.querySql || currentDataset.querySql || DEFAULT_QUERY_SQL).trim()
      assertReadOnlyDatasetSql(querySql)
      const fieldsConfig =
        updateRequest.fieldsConfig ||
        currentDataset.fieldsConfig ||
        (await this.previewDatasetSql({ querySql, limit: DEFAULT_PREVIEW_LIMIT })).columns

      const configId = await this.datasetMapper.createDatasetConfig({
        datasetId: updateRequest.id,
        versionNo: nextVersionNo,
        querySql,
        fieldsConfig,
        changeNote: updateRequest.changeNote || null,
        createdBy,
        createTime,
        updateTime
      })
      await this.datasetMapper.updateDataset({
        id: updateRequest.id,
        currentConfigId: configId,
        updatedBy,
        updateTime
      })
    }

    return await this.getDataset({ id: currentDataset.id })
  }

  /**
   * 删除数据集（逻辑删除）。需要 manage 权限。
   * @public
   * @param {DatasetDto.DeleteDatasetRequest} deleteRequest 删除数据集请求参数，包含 ID
   * @throws {Error} 权限不足或数据集不存在时抛出异常
   * @returns {Promise<boolean>} 是否删除成功
   */
  public async deleteDataset(deleteRequest: DatasetDto.DeleteDatasetRequest): Promise<boolean> {
    await this.resourcePermissionService.assertResourcePermission({
      resourceType: 'dataset',
      resourceId: deleteRequest.id,
      requiredPermission: 'manage'
    })
    await this.getDataset({ id: deleteRequest.id })
    const { updatedBy, updateTime } = await this.getDefaultInfo()
    return await this.datasetMapper.deleteDataset({
      id: deleteRequest.id,
      updatedBy,
      updateTime
    })
  }

  /**
   * 预览自定义 SQL 执行结果，返回字段结构和示例数据（用于数据集新建/修改时的调试）
   * @public
   * @param {DatasetDto.PreviewDatasetSqlRequest} previewRequest 预览 SQL 请求参数，包含自定义 SQL 和条数限制
   * @returns {Promise<DatasetVo.DatasetPreviewResponse>} SQL 预览结果（字段配置列表、行数据、执行耗时）
   */
  public async previewDatasetSql(
    previewRequest: DatasetDto.PreviewDatasetSqlRequest
  ): Promise<DatasetVo.DatasetPreviewResponse> {
    const limit = Math.min(
      MAX_PREVIEW_LIMIT,
      Math.max(1, Math.floor(Number(previewRequest.limit || DEFAULT_PREVIEW_LIMIT)))
    )
    const previewResult = await this.executeDatasetQuery(previewRequest.querySql, limit)
    return {
      columns: this.createFieldsConfigFromPreviewColumns(previewResult.columns),
      rows: previewResult.rows,
      elapsedMs: previewResult.elapsedMs
    }
  }

  /**
   * 预览已保存数据集的数据（使用已保存的数据集 SQL 配置）。需要 view 及以上权限。
   * @public
   * @param {DatasetDto.PreviewDatasetRequest} previewRequest 预览数据集请求参数，包含数据集 ID 和条数限制
   * @throws {Error} 权限不足或数据集 SQL 为空时抛出异常
   * @returns {Promise<DatasetVo.DatasetPreviewResponse>} 数据集数据预览结果
   */
  public async previewDataset(
    previewRequest: DatasetDto.PreviewDatasetRequest
  ): Promise<DatasetVo.DatasetPreviewResponse> {
    await this.resourcePermissionService.assertResourcePermission({
      resourceType: 'dataset',
      resourceId: previewRequest.id,
      requiredPermission: 'view'
    })
    const dataset = await this.getDataset({ id: previewRequest.id })
    if (!dataset.querySql?.trim()) {
      throw new Error('数据集 SQL 为空，请先编写并保存 SQL')
    }

    const limit = Math.min(
      MAX_PREVIEW_LIMIT,
      Math.max(1, Math.floor(Number(previewRequest.limit || DEFAULT_PREVIEW_LIMIT)))
    )
    const previewResult = await this.executeDatasetQuery(dataset.querySql, limit)
    const columns = dataset.fieldsConfig.length
      ? dataset.fieldsConfig
      : this.createFieldsConfigFromPreviewColumns(previewResult.columns)

    return {
      columns,
      rows: previewResult.rows,
      elapsedMs: previewResult.elapsedMs
    }
  }

  /**
   * 获取数据集目标数据库的表结构 Schema（含表和列），用于 Monaco Editor 表/字段联想。
   * 优先读取 Redis 缓存（5 分钟 TTL），缓存未命中时实时查询 information_schema。
   * @public
   * @returns {Promise<DatasetVo.DatasetSchemaResponse>} 数据库 Schema 响应
   */
  public async getDatasetSchema(): Promise<DatasetVo.DatasetSchemaResponse> {
    const cached = await RedisStorage.getItem<string>(SCHEMA_CACHE_KEY)
    if (cached) {
      try {
        return JSON.parse(cached)
      } catch {
        // 缓存数据损坏，忽略并重新查询
      }
    }

    const databaseName = this.resolveQueryDataSourceName()
    const mapper = new DatabaseMapper()
    mapper.dataSourceName = databaseName

    const tables = await mapper.getDatabaseTables({})
    const schemaTables: DatasetVo.DatasetSchemaTable[] = []

    for (const table of tables) {
      const columns = await mapper.getTableColumns({ tableName: table.tableName })
      schemaTables.push({
        tableName: table.tableName,
        tableComment: table.tableComment || '',
        columns: columns.map((col) => ({
          columnName: col.columnName,
          columnType: col.columnType,
          columnComment: col.columnComment || ''
        }))
      })
    }

    const result: DatasetVo.DatasetSchemaResponse = { databaseName, tables: schemaTables }
    await RedisStorage.setItem(SCHEMA_CACHE_KEY, JSON.stringify(result), SCHEMA_CACHE_TTL)
    return result
  }

  /**
   * 获取查询的目标数据库源名称
   * @private
   * @throws {Error} 查询数据源未在 runtimeConfig 中配置时抛出异常
   * @returns {string} 目标数据库连接池名称
   */
  private resolveQueryDataSourceName() {
    const poolName = useRuntimeConfig().serviceDataDbName
    if (!poolName) {
      throw new Error('查询数据源未配置')
    }
    return poolName
  }

  /**
   * 在目标数据源上执行数据集 SQL 查询
   * @private
   * @param {string} querySql 需要执行的 SQL 语句
   * @param {number} limit 限制返回的最大行数
   * @returns {Promise<{ columns: Array<{ columnName: string; columnType: string }>; rows: any[]; elapsedMs: number }>} 查询执行结果
   */
  private async executeDatasetQuery(querySql: string, limit: number) {
    const mapper = new DatabaseMapper()
    mapper.dataSourceName = this.resolveQueryDataSourceName()
    return await mapper.previewDatasetQuery(querySql, limit)
  }

  /**
   * 根据预览查询返回的列结构自动生成数据集字段配置
   * @private
   * @param {Array<{ columnName: string; columnType: string }>} columns 原始列元数据数组
   * @returns {DatasetDao.DatasetFieldConfigItem[]} 默认的数据集字段配置列表
   */
  private createFieldsConfigFromPreviewColumns(
    columns: Array<{ columnName: string; columnType: string }>
  ): DatasetDao.DatasetFieldConfigItem[] {
    return columns.map((column, index) => {
      const normalizedColumnType = column.columnType.toLowerCase()
      const isMetric = /int|decimal|float|double|number|bigint/.test(normalizedColumnType)
      return {
        sourceColumnName: column.columnName,
        fieldName: column.columnName,
        displayName: column.columnName,
        fieldType: isMetric ? 'measure' : 'dimension',
        dataType: column.columnType,
        aggregationType: isMetric ? 'sum' : null,
        expression: '',
        visible: true,
        sortOrder: index + 1
      }
    })
  }
}
