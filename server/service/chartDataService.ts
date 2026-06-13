import { ChartDataMapper } from '@/server/mapper/chartDataMapper'
import { AnalyzeService } from '@/server/service/analyzeService'
import { AnalyzeQueryBuilder, type AnalyzeQueryContext } from '@/server/service/analyzeQueryBuilder'
import { BaseService } from '@/server/service/baseService'
import { DatasetService } from '@/server/service/datasetService'
import { ResourcePermissionService } from '@/server/service/resourcePermissionService'
import { buildDatasetAnalyzeFromClause } from '@/server/utils/datasetSql'

/**
 * 图表数据服务，提供图表数据的获取、权限校验、SQL 查询构建等业务逻辑
 */
export class ChartDataService extends BaseService {
  /**
   * 图表数据映射器
   * @private
   * @type {ChartDataMapper}
   */
  private chartDataMapper: ChartDataMapper

  /**
   * 分析查询构建器
   * @private
   * @type {AnalyzeQueryBuilder}
   */
  private analyzeQueryBuilder: AnalyzeQueryBuilder

  /**
   * 分析服务
   * @private
   * @type {AnalyzeService}
   */
  private analyzeService: AnalyzeService

  /**
   * 数据集服务
   * @private
   * @type {DatasetService}
   */
  private datasetService: DatasetService

  /**
   * 资源权限服务
   * @private
   * @type {ResourcePermissionService}
   */
  private resourcePermissionService: ResourcePermissionService

  /**
   * 构造函数，初始化服务依赖的各类 Mapper 与 Service 实例
   */
  constructor() {
    super()
    this.chartDataMapper = new ChartDataMapper()
    this.analyzeQueryBuilder = new AnalyzeQueryBuilder()
    this.analyzeService = new AnalyzeService()
    this.datasetService = new DatasetService()
    this.resourcePermissionService = new ResourcePermissionService()
  }

  /**
   * 将 DAO 层的分析数据转换为 VO 层的分析数据
   * @private
   * @param {Array<AnalyzeDataDao.AnalyzeData>} analyzeDataRecords DAO 层分析数据数组
   * @returns {Array<AnalyzeDataVo.AnalyzeData>} VO 层分析数据数组
   */
  private convertDaoToVo(analyzeDataRecords: Array<AnalyzeDataDao.AnalyzeData>): Array<AnalyzeDataVo.AnalyzeData> {
    return analyzeDataRecords.map((analyzeDataRecord) => ({
      ...analyzeDataRecord,
      [String(analyzeDataRecord.columnName)]: analyzeDataRecord.columnValue
    }))
  }

  /**
   * 解析分析数据查询所使用的数据库连接池/数据源名称
   * @private
   * @returns {string} 数据库连接池名称
   * @throws {Error} 未配置查询数据源时抛出异常
   */
  private resolveAnalyzeDataPoolName() {
    const poolName = useRuntimeConfig().serviceDataDbName || 'kanban_data'
    if (!poolName) {
      throw new Error('查询数据源未配置')
    }
    return poolName
  }

  /**
   * 根据数据集 ID 创建分析查询上下文
   * @private
   * @param {number} datasetId 数据集 ID
   * @returns {Promise<AnalyzeQueryContext>} 分析查询上下文对象
   * @throws {Error} 数据集不存在、SQL为空或数据集被禁用、无可用字段时抛出异常
   */
  private async createDatasetQueryContext(datasetId: number): Promise<AnalyzeQueryContext> {
    const dataset = await this.datasetService.getDataset({ id: datasetId })
    if (!dataset.querySql?.trim()) {
      throw new Error('数据集 SQL 为空，请先在数据集页面配置 SQL')
    }
    if (dataset.status !== 'enabled') {
      throw new Error('数据集已禁用')
    }

    const allowedColumns = new Set<string>()
    for (const field of dataset.fieldsConfig || []) {
      if (!field.visible) continue
      allowedColumns.add(this.analyzeQueryBuilder.normalizeIdentifier(field.sourceColumnName, '字段'))
    }
    if (allowedColumns.size === 0) {
      throw new Error('数据集没有可用字段，请先配置并保存字段')
    }

    return {
      tableName: `dataset:${datasetId}`,
      quotedTableName: buildDatasetAnalyzeFromClause(dataset.querySql),
      allowedColumns
    }
  }

  /**
   * 校验当前用户是否有执行该分析数据查询的权限
   * @private
   * @param {AnalyzeDataDto.AnalyzeDataQuery} analyzeDataQuery 数据查询对象
   * @returns {Promise<void>} 无返回值
   * @throws {Error} 校验不通过或权限不足时抛出异常
   */
  private async assertAnalyzeDataQueryAccess(analyzeDataQuery: AnalyzeDataDto.AnalyzeDataQuery): Promise<void> {
    if (!analyzeDataQuery.analyzeId) {
      this.assertCurrentUserAdmin('未绑定分析资源的数据查询仅管理员可访问')
      return
    }

    const permission = await this.resourcePermissionService.assertResourcePermission({
      resourceType: 'analyze',
      resourceId: analyzeDataQuery.analyzeId,
      requiredPermission: 'view'
    })

    if (permission === 'edit' || permission === 'manage') {
      return
    }

    const analyzeDetail = await this.analyzeService.getAnalyze({ id: analyzeDataQuery.analyzeId })
    const chartConfig = analyzeDetail.chartConfig
    if (!chartConfig) {
      throw new Error('分析配置不存在')
    }

    this.assertViewQueryMatchesSavedConfig(analyzeDataQuery, chartConfig)
  }

  /**
   * 校验前端传入的查询参数是否与已保存的图表配置相匹配（针对仅有只读权限的用户）
   * @private
   * @param {AnalyzeDataDto.AnalyzeDataQuery} analyzeDataQuery 前端查询参数
   * @param {AnalyzeConfigVo.ChartConfigResponse} chartConfig 已保存的图表配置
   * @returns {void}
   * @throws {Error} 数据集 ID 不匹配或字段超限时抛出异常
   */
  private assertViewQueryMatchesSavedConfig(
    analyzeDataQuery: AnalyzeDataDto.AnalyzeDataQuery,
    chartConfig: AnalyzeConfigVo.ChartConfigResponse
  ): void {
    if (!chartConfig.datasetId || analyzeDataQuery.datasetId !== chartConfig.datasetId) {
      throw new Error('无权查询该数据集')
    }

    const savedDimensionColumns = this.getFieldColumnSet(chartConfig.dimensions || [])
    const savedMeasureColumns = this.getFieldColumnSet(chartConfig.measures || [])
    const savedFilterColumns = this.getFieldColumnSet([
      ...(chartConfig.filters || []),
      ...(chartConfig.dimensions || [])
    ])
    const savedOrderColumns = this.getFieldColumnSet([
      ...(chartConfig.orders || []),
      ...(chartConfig.dimensions || []),
      ...(chartConfig.measures || [])
    ])

    this.assertFieldColumnsAllowed(analyzeDataQuery.dimensions || [], savedDimensionColumns, '分组字段')
    this.assertFieldColumnsAllowed(analyzeDataQuery.measures || [], savedMeasureColumns, '值字段')
    this.assertFieldColumnsAllowed(analyzeDataQuery.filters || [], savedFilterColumns, '筛选字段')
    this.assertFieldColumnsAllowed(analyzeDataQuery.orders || [], savedOrderColumns, '排序字段')
  }

  /**
   * 提取配置字段集合中的列名集合
   * @private
   * @param {Array<{ columnName?: string }>} fields 字段配置数组
   * @returns {Set<string>} 列名集合
   */
  private getFieldColumnSet(fields: Array<{ columnName?: string }>): Set<string> {
    return new Set(
      fields.map((field) => field.columnName).filter((columnName): columnName is string => Boolean(columnName))
    )
  }

  /**
   * 校验待查询的字段列是否在允许的集合中
   * @private
   * @param {Array<{ columnName?: string }>} fields 待查询的字段数组
   * @param {Set<string>} allowedColumns 允许的字段列集合
   * @param {string} fieldLabel 字段标识
   * @returns {void}
   * @throws {Error} 查询了未获授权的字段时抛出异常
   */
  private assertFieldColumnsAllowed(
    fields: Array<{ columnName?: string }>,
    allowedColumns: Set<string>,
    fieldLabel: string
  ): void {
    const unauthorizedField = fields.find((field) => !field.columnName || !allowedColumns.has(field.columnName))
    if (unauthorizedField) {
      throw new Error(`无权查询该${fieldLabel}`)
    }
  }

  /**
   * 获取分析图表数据
   * @param {AnalyzeDataDto.AnalyzeDataQuery} analyzeDataQuery 分析图表数据查询参数
   * @returns {Promise<Array<AnalyzeDataVo.AnalyzeData>>} 分析图表数据列表
   * @throws {Error} 数据集非法、权限校验失败或执行 SQL 报错时抛出异常
   */
  public async getAnalyzeData(
    analyzeDataQuery: AnalyzeDataDto.AnalyzeDataQuery
  ): Promise<Array<AnalyzeDataVo.AnalyzeData>> {
    const datasetId = Number(analyzeDataQuery.datasetId)
    if (!Number.isFinite(datasetId) || datasetId <= 0) {
      throw new Error('请选择数据集')
    }

    await this.assertAnalyzeDataQueryAccess(analyzeDataQuery)
    const queryContext = await this.createDatasetQueryContext(datasetId)
    const { sql, params } = this.analyzeQueryBuilder.buildAnalyzeDataQuery(analyzeDataQuery, queryContext)

    this.chartDataMapper.dataSourceName = this.resolveAnalyzeDataPoolName()
    const analyzeDataRecords = await this.chartDataMapper.getAnalyzeData(sql, params)
    return this.convertDaoToVo(analyzeDataRecords)
  }
}
