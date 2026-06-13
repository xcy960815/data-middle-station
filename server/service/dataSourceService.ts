import { DataSourceMapper } from '@/server/mapper/dataSourceMapper'
import { DatabaseMapper } from '@/server/mapper/databaseMapper'
import { BaseService } from '@/server/service/baseService'
import dayjs from 'dayjs'

/**
 * 数据源服务类，提供数据源列表查询、详情获取、增删改、同步表结构等业务逻辑
 */
export class DataSourceService extends BaseService {
  /**
   * 数据源映射器
   * @private
   * @type {DataSourceMapper}
   */
  private dataSourceMapper: DataSourceMapper

  /**
   * 数据库元数据映射器
   * @private
   * @type {DatabaseMapper}
   */
  private databaseMapper: DatabaseMapper

  /**
   * 构造函数，初始化服务依赖的各类 Mapper 实例
   */
  constructor() {
    super()
    this.dataSourceMapper = new DataSourceMapper()
    this.databaseMapper = new DatabaseMapper()
  }

  /**
   * 分页获取数据源列表
   * @param {DataSourceDto.GetDataSourceListRequest} [queryRequest={}] 查询请求参数
   * @returns {Promise<DataSourceVo.DataSourceListResponse>} 数据源列表分页数据
   */
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

  /**
   * 获取指定数据源详情，包括其拥有的表数量
   * @param {DataSourceDto.GetDataSourceRequest} queryRequest 查询参数，包含数据源 ID
   * @returns {Promise<DataSourceVo.DataSourceDetailResponse>} 数据源详情响应数据
   * @throws {Error} 数据源不存在时抛出异常
   */
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

  /**
   * 创建数据源（仅限管理员操作）
   * @param {DataSourceDto.CreateDataSourceRequest} createRequest 创建数据源参数
   * @returns {Promise<DataSourceVo.DataSourceDetailResponse>} 新增后的数据源详情
   * @throws {Error} 当前用户非管理员时抛出异常
   */
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

  /**
   * 更新数据源配置（仅限管理员操作）
   * @param {DataSourceDto.UpdateDataSourceRequest} updateRequest 更新请求参数，包含数据源 ID
   * @returns {Promise<DataSourceVo.DataSourceDetailResponse>} 更新后的数据源详情
   * @throws {Error} 当前用户非管理员、或数据源不存在、或保存失败时抛出异常
   */
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

  /**
   * 删除数据源（仅限管理员操作）
   * @param {DataSourceDto.DeleteDataSourceRequest} deleteRequest 删除请求参数，包含数据源 ID
   * @returns {Promise<boolean>} 是否删除成功
   * @throws {Error} 当前用户非管理员或数据源不存在时抛出异常
   */
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

  /**
   * 同步数据源表结构（仅限管理员操作，且目前只支持同步内置业务数据库 kanban_data）
   * @param {DataSourceDto.SyncDataSourceSchemaRequest} syncRequest 同步请求参数，包含数据源 ID
   * @returns {Promise<DataSourceVo.SyncDataSourceSchemaResponse>} 同步结果，包含表数量和列数量
   * @throws {Error} 当前用户非管理员、数据源被禁用或不是内置业务库时抛出异常
   */
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

  /**
   * 获取指定数据源拥有的表列表
   * @param {DataSourceDto.GetDataSourceTablesRequest} queryRequest 查询参数，包含数据源 ID 和表名关键字
   * @returns {Promise<DataSourceVo.DataSourceTableItem[]>} 表列表
   * @throws {Error} 数据源不存在时抛出异常
   */
  public async getDataSourceTables(
    queryRequest: DataSourceDto.GetDataSourceTablesRequest
  ): Promise<DataSourceVo.DataSourceTableItem[]> {
    await this.getDataSource({ id: queryRequest.id })
    return await this.dataSourceMapper.getDataSourceTables(queryRequest.id, queryRequest.keyword?.trim() || '')
  }

  /**
   * 获取指定数据源中某张表的所有列元数据列表
   * @param {DataSourceDto.GetDataSourceColumnsRequest} queryRequest 查询参数，包含数据源 ID 和目标表名
   * @returns {Promise<DataSourceVo.DataSourceColumnItem[]>} 列元数据列表
   * @throws {Error} 数据源不存在时抛出异常
   */
  public async getDataSourceColumns(
    queryRequest: DataSourceDto.GetDataSourceColumnsRequest
  ): Promise<DataSourceVo.DataSourceColumnItem[]> {
    await this.getDataSource({ id: queryRequest.id })
    return await this.dataSourceMapper.getDataSourceColumns(queryRequest.id, queryRequest.tableName)
  }
}
