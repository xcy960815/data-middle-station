import { ChartDataMapper } from '@/server/mapper/chartDataMapper'
import { AnalyzeService } from '@/server/service/analyzeService'
import { AnalyzeQueryBuilder, type AnalyzeQueryContext } from '@/server/service/analyzeQueryBuilder'
import { BaseService } from '@/server/service/baseService'
import { DatabaseService } from '@/server/service/databaseService'
import { ResourcePermissionService } from '@/server/service/resourcePermissionService'

/**
 * @desc 图表数据服务
 */
export class ChartDataService extends BaseService {
  /**
   * @desc 图表数据mapper
   */
  private chartDataMapper: ChartDataMapper

  /**
   * @desc 数据库服务
   */
  private databaseService: DatabaseService

  /**
   * @desc SQL 构建器
   */
  private analyzeQueryBuilder: AnalyzeQueryBuilder
  private analyzeService: AnalyzeService
  private resourcePermissionService: ResourcePermissionService

  /**
   * @desc 构造函数
   */
  constructor() {
    super()
    this.chartDataMapper = new ChartDataMapper()
    this.databaseService = new DatabaseService()
    this.analyzeQueryBuilder = new AnalyzeQueryBuilder()
    this.analyzeService = new AnalyzeService()
    this.resourcePermissionService = new ResourcePermissionService()
  }

  /**
   * @desc 将DAO对象转换为VO对象
   * @param analyzeDataRecords {AnalyzeDataDao.AnalyzeData[]} 图表数据DAO列表
   * @returns {AnalyzeDataVo.AnalyzeData[]} 图表数据VO列表
   */
  private convertDaoToVo(analyzeDataRecords: Array<AnalyzeDataDao.AnalyzeData>): Array<AnalyzeDataVo.AnalyzeData> {
    return analyzeDataRecords.map((analyzeDataRecord) => ({
      ...analyzeDataRecord,
      [String(analyzeDataRecord.columnName)]: analyzeDataRecord.columnValue
    }))
  }

  /**
   * @desc 创建查询上下文
   * @param dataSource 数据源表名
   * @returns 查询上下文
   */
  private async createQueryContext(dataSource: string): Promise<AnalyzeQueryContext> {
    const normalizedTableName = this.analyzeQueryBuilder.normalizeIdentifier(dataSource, '数据源')
    const columns = await this.databaseService.getTableColumnsForAnalyzeQuery({
      tableName: normalizedTableName
    })

    if (columns.length === 0) {
      throw new Error(`数据源不存在或无可用字段: ${normalizedTableName}`)
    }

    return {
      tableName: normalizedTableName,
      quotedTableName: this.analyzeQueryBuilder.quoteIdentifier(normalizedTableName),
      allowedColumns: new Set(
        columns.map((column) => this.analyzeQueryBuilder.normalizeIdentifier(column.columnName, '字段'))
      )
    }
  }

  private async assertAnalyzeDataQueryAccess(analyzeDataQuery: AnalyzeDataDto.AnalyzeDataQuery): Promise<void> {
    if (!analyzeDataQuery.analyzeId) {
      this.assertCurrentUserAdmin('未绑定分析资源的原始数据查询仅管理员可访问')
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

  private assertViewQueryMatchesSavedConfig(
    analyzeDataQuery: AnalyzeDataDto.AnalyzeDataQuery,
    chartConfig: AnalyzeConfigVo.ChartConfigResponse
  ): void {
    if (!chartConfig.dataSource || analyzeDataQuery.dataSource !== chartConfig.dataSource) {
      throw new Error('无权查询该数据源')
    }

    const savedDimensionColumns = this.getFieldColumnSet(chartConfig.dimensions || [])
    const savedMeasureColumns = this.getFieldColumnSet(chartConfig.measures || [])
    // 筛选字段白名单包含 dimensions：用户在表格列头按维度字段做筛选是合法交互
    const savedFilterColumns = this.getFieldColumnSet([
      ...(chartConfig.filters || []),
      ...(chartConfig.dimensions || [])
    ])
    // 排序字段白名单包含 dimensions + measures：用户点击表头按任意可见字段排序是合法交互
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

  private getFieldColumnSet(fields: Array<{ columnName?: string }>): Set<string> {
    return new Set(
      fields.map((field) => field.columnName).filter((columnName): columnName is string => Boolean(columnName))
    )
  }

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
   * @desc 获取图表数据
   * @param analyzeDataQuery {AnalyzeDataDto.AnalyzeDataQuery} 请求参数
   * @returns {Promise<AnalyzeDataVo.AnalyzeData[]>}
   */
  public async getAnalyzeData(
    analyzeDataQuery: AnalyzeDataDto.AnalyzeDataQuery
  ): Promise<Array<AnalyzeDataVo.AnalyzeData>> {
    await this.assertAnalyzeDataQueryAccess(analyzeDataQuery)
    const queryContext = await this.createQueryContext(analyzeDataQuery.dataSource)
    const { sql, params } = this.analyzeQueryBuilder.buildAnalyzeDataQuery(analyzeDataQuery, queryContext)

    const analyzeDataRecords = await this.chartDataMapper.getAnalyzeData(sql, params)
    return this.convertDaoToVo(analyzeDataRecords)
  }
}
