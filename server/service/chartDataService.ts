import { ChartDataMapper } from '@/server/mapper/chartDataMapper'
import { AnalyzeService } from '@/server/service/analyzeService'
import { AnalyzeQueryBuilder, type AnalyzeQueryContext } from '@/server/service/analyzeQueryBuilder'
import { BaseService } from '@/server/service/baseService'
import { DatasetService } from '@/server/service/datasetService'
import { ResourcePermissionService } from '@/server/service/resourcePermissionService'
import { buildDatasetAnalyzeFromClause } from '@/server/utils/datasetSql'

/**
 * @desc 图表数据服务
 */
export class ChartDataService extends BaseService {
  private chartDataMapper: ChartDataMapper
  private analyzeQueryBuilder: AnalyzeQueryBuilder
  private analyzeService: AnalyzeService
  private datasetService: DatasetService
  private resourcePermissionService: ResourcePermissionService

  constructor() {
    super()
    this.chartDataMapper = new ChartDataMapper()
    this.analyzeQueryBuilder = new AnalyzeQueryBuilder()
    this.analyzeService = new AnalyzeService()
    this.datasetService = new DatasetService()
    this.resourcePermissionService = new ResourcePermissionService()
  }

  private convertDaoToVo(analyzeDataRecords: Array<AnalyzeDataDao.AnalyzeData>): Array<AnalyzeDataVo.AnalyzeData> {
    return analyzeDataRecords.map((analyzeDataRecord) => ({
      ...analyzeDataRecord,
      [String(analyzeDataRecord.columnName)]: analyzeDataRecord.columnValue
    }))
  }

  private resolveAnalyzeDataPoolName() {
    const poolName = useRuntimeConfig().serviceDataDbName || 'kanban_data'
    if (!poolName) {
      throw new Error('查询数据源未配置')
    }
    return poolName
  }

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
