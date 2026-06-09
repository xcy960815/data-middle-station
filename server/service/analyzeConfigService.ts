import { AnalyzeConfigMapper } from '@/server/mapper/analyzeConfigMapper'
import { BaseService } from '@/server/service/baseService'
import {
  migrateAnalyzeTableColumnUiFromFields,
  ANALYZE_TABLE_COLUMN_UI_KEYS,
  type AnalyzeTableColumnUiKey
} from '@/shared/analyzeTableColumnConfig'

type TableColumnUiMigrationResult = {
  measures: AnalyzeConfigDao.MeasureOption[]
  dimensions: AnalyzeConfigDao.DimensionOption[]
  privateChartConfig: AnalyzeConfigDao.PrivateChartConfig | undefined
  removedFieldCount: number
  migratedColumnCount: number
  changed: boolean
}

type AnalyzeConfigField = Record<string, any>

export class AnalyzeConfigService extends BaseService {
  private analyzeConfigMapper: AnalyzeConfigMapper

  constructor() {
    super()
    this.analyzeConfigMapper = new AnalyzeConfigMapper()
  }

  private convertDaoToVo(configRecord: AnalyzeConfigDao.AnalyzeConfigRecord): AnalyzeConfigVo.AnalyzeConfigResponse {
    const normalizedData = this.normalizeConfigRecord(configRecord)
    return {
      ...normalizedData,
      measures: normalizedData.measures.map((item: AnalyzeConfigDao.MeasureOption) => ({
        ...item,
        displayName: item.displayName || item.columnComment
      })),
      filters: normalizedData.filters.map((item: AnalyzeConfigDao.FilterOption) => ({
        ...item,
        displayName: item.displayName || item.columnComment
      })),
      dimensions: normalizedData.dimensions.map((item: AnalyzeConfigDao.DimensionOption) => ({
        ...item,
        displayName: item.displayName || item.columnComment
      })),
      orders: normalizedData.orders.map((item: AnalyzeConfigDao.OrderOption) => ({
        ...item,
        displayName: item.displayName || item.columnComment
      }))
    }
  }

  public async getAnalyzeConfig(
    queryRequest: AnalyzeConfigDto.GetAnalyzeConfigRequest
  ): Promise<AnalyzeConfigVo.AnalyzeConfigResponse> {
    const configRecord = await this.analyzeConfigMapper.getAnalyzeConfig(queryRequest)
    if (!configRecord) {
      throw new Error('分析配置不存在')
    }
    return this.convertDaoToVo(configRecord)
  }

  public async getAnalyzeConfigHistory(analyzeId: number): Promise<AnalyzeConfigVo.AnalyzeConfigResponse[]> {
    const configs = await this.analyzeConfigMapper.getAnalyzeConfigHistory(analyzeId)
    return configs.map((config) => this.convertDaoToVo(config))
  }

  public async createAnalyzeConfigVersion(
    createRequest: AnalyzeConfigDto.CreateAnalyzeConfigRequest
  ): Promise<AnalyzeConfigVo.AnalyzeConfigResponse> {
    const { createdBy, createTime, updateTime } = await this.getDefaultInfo()
    const versionNo = await this.analyzeConfigMapper.getNextVersionNo(createRequest.analyzeId)
    const tableColumnUiMigration = this.migrateTableColumnUiConfig({
      chartType: createRequest.chartType,
      measures: createRequest.measures || [],
      dimensions: createRequest.dimensions || [],
      privateChartConfig: createRequest.privateChartConfig
    })
    const createParams: AnalyzeConfigDao.CreateAnalyzeConfigParams = {
      ...createRequest,
      versionNo,
      measures: tableColumnUiMigration.measures,
      filters: createRequest.filters || [],
      dimensions: tableColumnUiMigration.dimensions,
      orders: createRequest.orders || [],
      commonChartConfig: createRequest.commonChartConfig,
      privateChartConfig: tableColumnUiMigration.privateChartConfig,
      createdBy,
      createTime,
      updateTime
    }
    const configId = await this.analyzeConfigMapper.createAnalyzeConfig(createParams)
    return this.getAnalyzeConfig({ id: configId })
  }

  public async deleteAnalyzeConfigs(deleteRequest: AnalyzeConfigDto.DeleteAnalyzeConfigsRequest): Promise<boolean> {
    const { updatedBy, updateTime } = await this.getDefaultInfo()
    return await this.analyzeConfigMapper.deleteAnalyzeConfigs({
      analyzeId: deleteRequest.analyzeId,
      updatedBy,
      updateTime
    })
  }

  private normalizeConfigRecord(
    configRecord: AnalyzeConfigDao.AnalyzeConfigRecord
  ): AnalyzeConfigDao.AnalyzeConfigRecord {
    return {
      ...configRecord,
      measures: configRecord.measures || [],
      filters: configRecord.filters || [],
      dimensions: configRecord.dimensions || [],
      orders: configRecord.orders || []
    }
  }

  private migrateTableColumnUiConfig(config: {
    chartType?: string | null
    measures: AnalyzeConfigDao.MeasureOption[]
    dimensions: AnalyzeConfigDao.DimensionOption[]
    privateChartConfig?: AnalyzeConfigDao.PrivateChartConfig
  }): TableColumnUiMigrationResult {
    const removedFieldCount = this.countTableColumnUiFields([...config.dimensions, ...config.measures])
    const fields = [...config.dimensions, ...config.measures]
    const legacyColumnCount = this.countFieldsWithTableColumnUi(fields)
    const shouldCreateTableColumns =
      config.chartType === 'table' && fields.length > 0 && !config.privateChartConfig?.table?.columns?.length
    const migratedColumnCount = shouldCreateTableColumns ? fields.length : legacyColumnCount
    const migrated = migrateAnalyzeTableColumnUiFromFields(
      config.dimensions as Array<{ columnName: string } & Record<string, unknown>>,
      config.measures as Array<{ columnName: string } & Record<string, unknown>>,
      config.privateChartConfig,
      { forceColumns: shouldCreateTableColumns }
    )
    const measures = migrated.measures as AnalyzeConfigDao.MeasureOption[]
    const dimensions = migrated.dimensions as AnalyzeConfigDao.DimensionOption[]
    const privateChartConfig = migrated.privateChartConfig
    const previousTableColumns = config.privateChartConfig?.table?.columns || []
    const nextTableColumns = privateChartConfig?.table?.columns || []
    const tableColumnsChanged = !this.isJsonEquivalent(previousTableColumns, nextTableColumns)
    const changed =
      removedFieldCount > 0 ||
      !this.isJsonEquivalent(measures, config.measures) ||
      !this.isJsonEquivalent(dimensions, config.dimensions) ||
      tableColumnsChanged

    return {
      measures,
      dimensions,
      privateChartConfig,
      removedFieldCount,
      migratedColumnCount,
      changed
    }
  }

  private countTableColumnUiFields(fields: AnalyzeConfigField[]): number {
    return fields.reduce((count, field) => {
      if (!field || typeof field !== 'object') return count
      return (
        count + ANALYZE_TABLE_COLUMN_UI_KEYS.filter((key) => Object.prototype.hasOwnProperty.call(field, key)).length
      )
    }, 0)
  }

  private countFieldsWithTableColumnUi(fields: AnalyzeConfigField[]): number {
    return fields.filter((field) => this.hasTableColumnUiField(field)).length
  }

  private hasTableColumnUiField(field: AnalyzeConfigField): boolean {
    if (!field || typeof field !== 'object') return false
    return ANALYZE_TABLE_COLUMN_UI_KEYS.some((key: AnalyzeTableColumnUiKey) =>
      Object.prototype.hasOwnProperty.call(field, key)
    )
  }

  private isJsonEquivalent(left: unknown, right: unknown): boolean {
    return JSON.stringify(this.normalizeJsonValue(left)) === JSON.stringify(this.normalizeJsonValue(right))
  }

  private normalizeJsonValue(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map((item) => this.normalizeJsonValue(item))
    }

    if (!value || typeof value !== 'object') {
      return value
    }

    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((result, key) => {
        result[key] = this.normalizeJsonValue((value as Record<string, unknown>)[key])
        return result
      }, {})
  }
}
