import { DataSourceMapper } from '@/server/mapper/dataSourceMapper'
import { DatabaseMapper } from '@/server/mapper/databaseMapper'
import { DatasetMapper } from '@/server/mapper/datasetMapper'
import { BaseService } from '@/server/service/baseService'
import { toLine } from '@/server/utils/databaseHelper'

const DEFAULT_PREVIEW_LIMIT = 100
const MAX_PREVIEW_LIMIT = 500
const SQL_IDENTIFIER_REGEXP = /^[a-zA-Z0-9_]+$/

/**
 * @desc 数据集服务，负责数据集的 CRUD 业务编排
 */
export class DatasetService extends BaseService {
  private datasetMapper: DatasetMapper
  private dataSourceMapper: DataSourceMapper
  private databaseMapper: DatabaseMapper

  constructor() {
    super()
    this.datasetMapper = new DatasetMapper()
    this.dataSourceMapper = new DataSourceMapper()
    this.databaseMapper = new DatabaseMapper()
  }

  /**
   * @desc 获取数据集列表（分页）
   * @param queryRequest 分页查询参数
   * @returns 数据集列表及分页信息
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
   * @desc 获取单个数据集详情
   * @param queryRequest 查询参数
   * @returns 数据集详情
   */
  public async getDataset(queryRequest: DatasetDto.GetDatasetRequest): Promise<DatasetVo.DatasetDetailResponse> {
    const dataset = await this.datasetMapper.getDataset(queryRequest)
    if (!dataset) {
      throw new Error('数据集不存在')
    }
    const [dataSource, datasetConfig] = await Promise.all([
      this.dataSourceMapper.getDataSource({ id: dataset.dataSourceId }),
      dataset.currentConfigId ? this.datasetMapper.getDatasetConfig({ id: dataset.currentConfigId }) : null
    ])

    return {
      ...dataset,
      dataSource: dataSource
        ? {
            ...dataSource,
            tableCount: (await this.dataSourceMapper.getDataSourceTables(dataSource.id)).length
          }
        : null,
      fieldsConfig: datasetConfig?.fieldsConfig || []
    }
  }

  /**
   * @desc 创建数据集
   * @param createRequest 创建请求参数
   * @returns 创建后的数据集详情
   */
  public async createDataset(createRequest: DatasetDto.CreateDatasetRequest): Promise<DatasetVo.DatasetDetailResponse> {
    const dataSource = await this.dataSourceMapper.getDataSource({ id: createRequest.dataSourceId })
    if (!dataSource) {
      throw new Error('数据源不存在')
    }
    if (dataSource.status !== 'enabled') {
      throw new Error('数据源已禁用')
    }
    const columns = await this.dataSourceMapper.getDataSourceColumns(
      createRequest.dataSourceId,
      createRequest.baseTable
    )
    if (!columns.length) {
      throw new Error('请先同步数据源表结构')
    }
    const { createdBy, updatedBy, createTime, updateTime } = await this.getDefaultInfo()
    const datasetId = await this.datasetMapper.createDataset({
      datasetName: createRequest.datasetName,
      datasetDesc: createRequest.datasetDesc || '',
      dataSourceId: createRequest.dataSourceId,
      baseTable: createRequest.baseTable,
      status: createRequest.status || 'enabled',
      currentConfigId: null,
      createdBy,
      updatedBy,
      createTime,
      updateTime
    })
    const configId = await this.datasetMapper.createDatasetConfig({
      datasetId,
      versionNo: 1,
      fieldsConfig: this.createDefaultFieldsConfig(columns),
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
   * @desc 更新数据集（含字段配置版本管理）
   * @param updateRequest 更新请求参数
   * @returns 更新后的数据集详情
   */
  public async updateDataset(updateRequest: DatasetDto.UpdateDatasetRequest): Promise<DatasetVo.DatasetDetailResponse> {
    const currentDataset = await this.getDataset({ id: updateRequest.id })
    const { createdBy, updatedBy, createTime, updateTime } = await this.getDefaultInfo()
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

    if (updateRequest.fieldsConfig) {
      const nextVersionNo = await this.datasetMapper.getNextVersionNo(updateRequest.id)
      const configId = await this.datasetMapper.createDatasetConfig({
        datasetId: updateRequest.id,
        versionNo: nextVersionNo,
        fieldsConfig: updateRequest.fieldsConfig,
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
   * @desc 删除数据集（逻辑删除）
   * @param deleteRequest 删除请求参数
   * @returns 是否删除成功
   */
  public async deleteDataset(deleteRequest: DatasetDto.DeleteDatasetRequest): Promise<boolean> {
    await this.getDataset({ id: deleteRequest.id })
    const { updatedBy, updateTime } = await this.getDefaultInfo()
    return await this.datasetMapper.deleteDataset({
      id: deleteRequest.id,
      updatedBy,
      updateTime
    })
  }

  /**
   * @desc 预览数据集内容（按字段配置查询样本数据）
   * @param previewRequest 预览请求参数
   * @returns 预览列定义与行数据
   */
  public async previewDataset(
    previewRequest: DatasetDto.PreviewDatasetRequest
  ): Promise<DatasetVo.DatasetPreviewResponse> {
    const dataset = await this.getDataset({ id: previewRequest.id })
    if (!dataset.fieldsConfig.length) {
      return {
        columns: [],
        rows: []
      }
    }
    const visibleColumns = dataset.fieldsConfig.filter((field) => field.visible)
    const limit = Math.min(
      MAX_PREVIEW_LIMIT,
      Math.max(1, Math.floor(Number(previewRequest.limit || DEFAULT_PREVIEW_LIMIT)))
    )
    const selectedColumns = visibleColumns.length ? visibleColumns : dataset.fieldsConfig
    const baseTable = this.normalizeSqlIdentifier(dataset.baseTable)
    const previewColumns = selectedColumns.map((field) => ({
      sourceColumnName: this.normalizeSqlIdentifier(field.sourceColumnName),
      fieldName: this.normalizeSqlIdentifier(field.fieldName)
    }))
    const rows = await this.databaseMapper.previewTableData(baseTable, previewColumns, limit)
    return {
      columns: selectedColumns,
      rows
    }
  }

  private createDefaultFieldsConfig(
    columns: DataSourceDao.DataSourceColumnRecord[]
  ): DatasetDao.DatasetFieldConfigItem[] {
    return columns.map((column, index) => {
      const normalizedColumnType = column.columnType.toLowerCase()
      const isMetric = /int|decimal|float|double|number/.test(normalizedColumnType)
      return {
        sourceColumnName: column.columnName,
        fieldName: column.columnName,
        displayName: column.columnComment || column.columnName,
        fieldType: isMetric ? 'measure' : 'dimension',
        dataType: column.columnType,
        aggregationType: isMetric ? 'sum' : null,
        expression: '',
        visible: true,
        sortOrder: index + 1
      }
    })
  }

  private normalizeSqlIdentifier(identifier: string): string {
    const normalizedIdentifier = toLine(String(identifier || '').trim())
    if (!normalizedIdentifier || !SQL_IDENTIFIER_REGEXP.test(normalizedIdentifier)) {
      throw new Error(`非法 SQL 标识符: ${identifier}`)
    }
    return normalizedIdentifier
  }
}
