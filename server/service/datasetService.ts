import { DatabaseMapper } from '@/server/mapper/databaseMapper'
import { DatasetMapper } from '@/server/mapper/datasetMapper'
import { BaseService } from '@/server/service/baseService'
import { assertReadOnlyDatasetSql } from '@/server/utils/datasetSql'

const DEFAULT_PREVIEW_LIMIT = 100
const MAX_PREVIEW_LIMIT = 500
const DEFAULT_QUERY_SQL = 'SELECT 1 AS sample_value'

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
   * 构造函数，初始化数据集映射器
   */
  constructor() {
    super()
    this.datasetMapper = new DatasetMapper()
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
    const normalizedQueryParams: DatasetDao.GetDatasetListParams = {
      page: Math.max(1, Math.floor(Number(queryRequest.page || 1))),
      pageSize: Math.min(100, Math.max(1, Math.floor(Number(queryRequest.pageSize || 12)))),
      keyword: queryRequest.keyword?.trim() || '',
      sortField: queryRequest.sortField || 'updateTime',
      sortOrder: queryRequest.sortOrder || 'desc'
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
   * 根据 ID 获取数据集的详细信息（包括当前的 SQL 配置和字段配置）
   * @public
   * @param {DatasetDto.GetDatasetRequest} queryRequest 获取单个数据集请求参数，包含 ID
   * @throws {Error} 当数据集不存在时抛出异常
   * @returns {Promise<DatasetVo.DatasetDetailResponse>} 数据集详情响应
   */
  public async getDataset(queryRequest: DatasetDto.GetDatasetRequest): Promise<DatasetVo.DatasetDetailResponse> {
    const dataset = await this.datasetMapper.getDataset(queryRequest)
    if (!dataset) {
      throw new Error('数据集不存在')
    }
    const datasetConfig = dataset.currentConfigId
      ? await this.datasetMapper.getDatasetConfig({ id: dataset.currentConfigId })
      : null

    return {
      ...dataset,
      querySql: datasetConfig?.querySql || '',
      fieldsConfig: datasetConfig?.fieldsConfig || []
    }
  }

  /**
   * 创建新的数据集（需要管理员权限），并自动生成初始版本配置
   * @public
   * @param {DatasetDto.CreateDatasetRequest} createRequest 创建数据集请求参数
   * @throws {Error} 当前登录用户不是管理员，或 SQL 包含非只读语句时抛出异常
   * @returns {Promise<DatasetVo.DatasetDetailResponse>} 创建成功后的数据集详情
   */
  public async createDataset(createRequest: DatasetDto.CreateDatasetRequest): Promise<DatasetVo.DatasetDetailResponse> {
    this.assertCurrentUserAdmin('仅管理员可创建数据集')
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
   * 更新数据集基础信息或配置（需要管理员权限）。若修改了 SQL 或字段配置，会保存为新版本。
   * @public
   * @param {DatasetDto.UpdateDatasetRequest} updateRequest 更新数据集请求参数
   * @throws {Error} 当前登录用户不是管理员，SQL 包含非只读语句，或保存数据集失败时抛出异常
   * @returns {Promise<DatasetVo.DatasetDetailResponse>} 更新后的数据集详情
   */
  public async updateDataset(updateRequest: DatasetDto.UpdateDatasetRequest): Promise<DatasetVo.DatasetDetailResponse> {
    this.assertCurrentUserAdmin('仅管理员可更新数据集')
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
   * 删除数据集（需要管理员权限，逻辑删除）
   * @public
   * @param {DatasetDto.DeleteDatasetRequest} deleteRequest 删除数据集请求参数，包含 ID
   * @throws {Error} 当前登录用户不是管理员，或数据集不存在时抛出异常
   * @returns {Promise<boolean>} 是否删除成功
   */
  public async deleteDataset(deleteRequest: DatasetDto.DeleteDatasetRequest): Promise<boolean> {
    this.assertCurrentUserAdmin('仅管理员可删除数据集')
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
   * 预览已保存数据集的数据（使用已保存的数据集 SQL 配置）
   * @public
   * @param {DatasetDto.PreviewDatasetRequest} previewRequest 预览数据集请求参数，包含数据集 ID 和条数限制
   * @throws {Error} 数据集 SQL 为空时抛出异常
   * @returns {Promise<DatasetVo.DatasetPreviewResponse>} 数据集数据预览结果
   */
  public async previewDataset(
    previewRequest: DatasetDto.PreviewDatasetRequest
  ): Promise<DatasetVo.DatasetPreviewResponse> {
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
