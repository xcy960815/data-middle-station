import { DatabaseMapper } from '@/server/mapper/databaseMapper'
import { DatasetMapper } from '@/server/mapper/datasetMapper'
import { BaseService } from '@/server/service/baseService'
import { assertReadOnlyDatasetSql } from '@/server/utils/datasetSql'

const DEFAULT_PREVIEW_LIMIT = 100
const MAX_PREVIEW_LIMIT = 500
const DEFAULT_QUERY_SQL = 'SELECT 1 AS sample_value'

/**
 * @desc 数据集服务，负责数据集的 CRUD 与 SQL 预览
 */
export class DatasetService extends BaseService {
  private datasetMapper: DatasetMapper

  constructor() {
    super()
    this.datasetMapper = new DatasetMapper()
  }

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

  private resolveQueryDataSourceName() {
    const poolName = useRuntimeConfig().serviceDataDbName
    if (!poolName) {
      throw new Error('查询数据源未配置')
    }
    return poolName
  }

  private async executeDatasetQuery(querySql: string, limit: number) {
    const mapper = new DatabaseMapper()
    mapper.dataSourceName = this.resolveQueryDataSourceName()
    return await mapper.previewDatasetQuery(querySql, limit)
  }

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
