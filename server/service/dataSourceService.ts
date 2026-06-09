import { DataSourceMapper } from '@/server/mapper/dataSourceMapper'
import { DatabaseMapper } from '@/server/mapper/databaseMapper'
import { BaseService } from '@/server/service/baseService'
import dayjs from 'dayjs'

export class DataSourceService extends BaseService {
  private dataSourceMapper: DataSourceMapper
  private databaseMapper: DatabaseMapper

  constructor() {
    super()
    this.dataSourceMapper = new DataSourceMapper()
    this.databaseMapper = new DatabaseMapper()
  }

  public async getDataSources(
    queryRequest: DataSourceDto.GetDataSourceListRequest = {}
  ): Promise<DataSourceVo.DataSourceListResponse> {
    const normalizedQueryParams: DataSourceDao.GetDataSourceListParams = {
      page: Math.max(1, Math.floor(Number(queryRequest.page || 1))),
      pageSize: Math.min(100, Math.max(1, Math.floor(Number(queryRequest.pageSize || 12)))),
      keyword: queryRequest.keyword?.trim() || '',
      sortField: queryRequest.sortField || 'updateTime',
      sortOrder: queryRequest.sortOrder || 'desc'
    }

    const [total, list] = await Promise.all([
      this.dataSourceMapper.countDataSources(normalizedQueryParams),
      this.dataSourceMapper.getDataSourceList(normalizedQueryParams)
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

  public async getDataSource(
    queryRequest: DataSourceDto.GetDataSourceRequest
  ): Promise<DataSourceVo.DataSourceDetailResponse> {
    const dataSource = await this.dataSourceMapper.getDataSource(queryRequest)
    if (!dataSource) {
      throw new Error('数据源不存在')
    }
    const tables = await this.dataSourceMapper.getDataSourceTables(dataSource.id)
    return {
      ...dataSource,
      tableCount: tables.length
    }
  }

  public async createDataSource(
    createRequest: DataSourceDto.CreateDataSourceRequest
  ): Promise<DataSourceVo.DataSourceDetailResponse> {
    this.assertCurrentUserAdmin('仅管理员可创建数据源')
    const { createdBy, updatedBy, createTime, updateTime } = await this.getDefaultInfo()
    const dataSourceId = await this.dataSourceMapper.createDataSource({
      sourceName: createRequest.sourceName,
      sourceDesc: createRequest.sourceDesc || '',
      sourceType: createRequest.sourceType || 'mysql',
      host: createRequest.host,
      port: Number(createRequest.port || 3306),
      databaseName: createRequest.databaseName,
      username: createRequest.username,
      status: createRequest.status || 'enabled',
      createdBy,
      updatedBy,
      createTime,
      updateTime
    })
    return await this.getDataSource({ id: dataSourceId })
  }

  public async updateDataSource(
    updateRequest: DataSourceDto.UpdateDataSourceRequest
  ): Promise<DataSourceVo.DataSourceDetailResponse> {
    this.assertCurrentUserAdmin('仅管理员可更新数据源')
    await this.getDataSource({ id: updateRequest.id })
    const { updatedBy, updateTime } = await this.getDefaultInfo()
    const updateResult = await this.dataSourceMapper.updateDataSource({
      ...updateRequest,
      updatedBy,
      updateTime
    })
    if (!updateResult) {
      throw new Error('保存数据源失败')
    }
    return await this.getDataSource({ id: updateRequest.id })
  }

  public async deleteDataSource(deleteRequest: DataSourceDto.DeleteDataSourceRequest): Promise<boolean> {
    this.assertCurrentUserAdmin('仅管理员可删除数据源')
    await this.getDataSource({ id: deleteRequest.id })
    const { updatedBy, updateTime } = await this.getDefaultInfo()
    return await this.dataSourceMapper.deleteDataSource({
      id: deleteRequest.id,
      updatedBy,
      updateTime
    })
  }

  public async syncDataSourceSchema(
    syncRequest: DataSourceDto.SyncDataSourceSchemaRequest
  ): Promise<DataSourceVo.SyncDataSourceSchemaResponse> {
    this.assertCurrentUserAdmin('仅管理员可同步数据源表结构')
    const dataSource = await this.getDataSource({ id: syncRequest.id })
    if (dataSource.status !== 'enabled') {
      throw new Error('数据源已禁用')
    }
    if (dataSource.databaseName !== 'kanban_data') {
      throw new Error('当前版本仅支持同步内置业务数据库 kanban_data')
    }

    const syncTime = dayjs().format('YYYY-MM-DD HH:mm:ss')
    const tables = await this.databaseMapper.getDatabaseTables({})
    let columnCount = 0
    for (const table of tables) {
      await this.dataSourceMapper.upsertDataSourceTable({
        dataSourceId: dataSource.id,
        tableName: table.tableName,
        tableComment: table.tableComment || '',
        tableRows: Number(table.tableRows || 0),
        lastSyncTime: syncTime
      })
      const columns = await this.databaseMapper.getTableColumns({ tableName: table.tableName })
      columnCount += columns.length
      await this.dataSourceMapper.replaceDataSourceColumns({
        dataSourceId: dataSource.id,
        tableName: table.tableName,
        columns: columns.map((column, index) => ({
          columnName: column.columnName,
          columnType: column.columnType,
          columnComment: column.columnComment || '',
          nullable: column.nullable || '',
          ordinalPosition: Number(column.ordinalPosition || index + 1)
        }))
      })
    }

    return {
      tableCount: tables.length,
      columnCount
    }
  }

  public async getDataSourceTables(
    queryRequest: DataSourceDto.GetDataSourceTablesRequest
  ): Promise<DataSourceVo.DataSourceTableItem[]> {
    await this.getDataSource({ id: queryRequest.id })
    return await this.dataSourceMapper.getDataSourceTables(queryRequest.id, queryRequest.keyword?.trim() || '')
  }

  public async getDataSourceColumns(
    queryRequest: DataSourceDto.GetDataSourceColumnsRequest
  ): Promise<DataSourceVo.DataSourceColumnItem[]> {
    await this.getDataSource({ id: queryRequest.id })
    return await this.dataSourceMapper.getDataSourceColumns(queryRequest.id, queryRequest.tableName)
  }
}
