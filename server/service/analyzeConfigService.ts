import { AnalyzeConfigMapper } from '@/server/mapper/analyzeConfigMapper'
import { BaseService } from '@/server/service/baseService'
import {
  createDefaultDimensionRule,
  createDefaultFilterRule,
  createDefaultMeasureRule,
  createDefaultOrderRule
} from '@/shared/analyzeFieldRules'
import type {
  FilterAggregationType,
  FilterType,
  MeasureAggregationType,
  OrderAggregationType,
  OrderType
} from '@/shared/domainTypes'

type CleanFieldRuleResult<T> = {
  data: T
  changed: boolean
  normalizedFieldCount: number
  removedFieldCount: number
}

type AnalyzeConfigField = Record<string, any>
type LegacyAnalyzeConfigField = AnalyzeConfigField & {
  datasetFieldName?: string
  datasetFieldType?: string
  datasetAggregationType?: MeasureAggregationType
  aggregationType?: MeasureAggregationType | FilterAggregationType | OrderAggregationType
}
type LegacyMeasureOption = AnalyzeConfigDao.MeasureOption &
  LegacyAnalyzeConfigField & {
    aggregationType?: MeasureAggregationType
    datasetAggregationType?: MeasureAggregationType
  }
type LegacyFilterOption = AnalyzeConfigDao.FilterOption &
  LegacyAnalyzeConfigField & {
    filterType?: FilterType | string
    filterValue?: string
    aggregationType?: FilterAggregationType
  }
type LegacyDimensionOption = AnalyzeConfigDao.DimensionOption & LegacyAnalyzeConfigField
type LegacyOrderOption = AnalyzeConfigDao.OrderOption &
  LegacyAnalyzeConfigField & {
    orderType?: OrderType
    aggregationType?: OrderAggregationType
  }

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
    const createParams: AnalyzeConfigDao.CreateAnalyzeConfigParams = {
      ...createRequest,
      versionNo,
      measures: createRequest.measures || [],
      filters: createRequest.filters || [],
      dimensions: createRequest.dimensions || [],
      orders: createRequest.orders || [],
      commonChartConfig: createRequest.commonChartConfig,
      privateChartConfig: createRequest.privateChartConfig,
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

  public async cleanRuntimeValidationFields(): Promise<AnalyzeConfigVo.CleanRuntimeValidationFieldsResponse> {
    const configs = await this.analyzeConfigMapper.getAnalyzeConfigsWithRuntimeValidationFields()
    let updatedCount = 0
    let removedFieldCount = 0

    for (const config of configs) {
      const measuresResult = this.removeRuntimeValidationFields(config.measures || [])
      const filtersResult = this.removeRuntimeValidationFields(config.filters || [])
      const dimensionsResult = this.removeRuntimeValidationFields(config.dimensions || [])
      const ordersResult = this.removeRuntimeValidationFields(config.orders || [])
      const removedCount =
        measuresResult.removedCount +
        filtersResult.removedCount +
        dimensionsResult.removedCount +
        ordersResult.removedCount

      if (!removedCount) continue

      const updated = await this.analyzeConfigMapper.updateAnalyzeConfigRuntimeFields(config.id, {
        measures: measuresResult.data as AnalyzeConfigDao.MeasureOption[],
        filters: filtersResult.data as AnalyzeConfigDao.FilterOption[],
        dimensions: dimensionsResult.data as AnalyzeConfigDao.DimensionOption[],
        orders: ordersResult.data as AnalyzeConfigDao.OrderOption[]
      })
      if (updated) {
        updatedCount += 1
        removedFieldCount += removedCount
      }
    }

    return {
      scannedCount: configs.length,
      updatedCount,
      removedFieldCount
    }
  }

  public async cleanFieldRules(): Promise<AnalyzeConfigVo.CleanFieldRulesResponse> {
    const configs = await this.analyzeConfigMapper.getAnalyzeConfigsForFieldRuleCleaning()
    let updatedCount = 0
    let normalizedFieldCount = 0
    let removedFieldCount = 0

    for (const config of configs) {
      const measuresResult = this.cleanMeasureFields((config.measures || []) as LegacyMeasureOption[])
      const filtersResult = this.cleanFilterFields((config.filters || []) as LegacyFilterOption[])
      const dimensionsResult = this.cleanDimensionFields((config.dimensions || []) as LegacyDimensionOption[])
      const ordersResult = this.cleanOrderFields((config.orders || []) as LegacyOrderOption[])
      const changed =
        measuresResult.changed || filtersResult.changed || dimensionsResult.changed || ordersResult.changed

      if (!changed) continue

      const updated = await this.analyzeConfigMapper.updateAnalyzeConfigRuntimeFields(config.id, {
        measures: measuresResult.data,
        filters: filtersResult.data,
        dimensions: dimensionsResult.data,
        orders: ordersResult.data
      })

      if (updated) {
        updatedCount += 1
        normalizedFieldCount +=
          measuresResult.normalizedFieldCount +
          filtersResult.normalizedFieldCount +
          dimensionsResult.normalizedFieldCount +
          ordersResult.normalizedFieldCount
        removedFieldCount +=
          measuresResult.removedFieldCount +
          filtersResult.removedFieldCount +
          dimensionsResult.removedFieldCount +
          ordersResult.removedFieldCount
      }
    }

    return {
      scannedCount: configs.length,
      updatedCount,
      normalizedFieldCount,
      removedFieldCount
    }
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

  private removeRuntimeValidationFields<T>(data: T): { data: T; removedCount: number } {
    if (Array.isArray(data)) {
      let removedCount = 0
      const cleanedArray = data.map((item) => {
        const result = this.removeRuntimeValidationFields(item)
        removedCount += result.removedCount
        return result.data
      })
      return {
        data: cleanedArray as T,
        removedCount
      }
    }

    if (!data || typeof data !== 'object') {
      return {
        data,
        removedCount: 0
      }
    }

    let removedCount = 0
    const cleanedObject: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      if (key === '__invalid' || key === '__invalidMessage') {
        removedCount += 1
        continue
      }
      const result = this.removeRuntimeValidationFields(value)
      cleanedObject[key] = result.data
      removedCount += result.removedCount
    }

    return {
      data: cleanedObject as T,
      removedCount
    }
  }

  private cleanMeasureFields(fields: LegacyMeasureOption[]): CleanFieldRuleResult<AnalyzeConfigDao.MeasureOption[]> {
    return this.cleanFields(fields, (field) => {
      const legacyAggregation = field.aggregationType || field.datasetAggregationType
      const measureRule = {
        ...createDefaultMeasureRule(field),
        ...(field.measureRule || {}),
        ...(legacyAggregation ? { aggregation: legacyAggregation } : {})
      }
      return {
        field: {
          ...field,
          measureRule
        },
        normalizedCount: field.measureRule ? 0 : 1
      }
    })
  }

  private cleanFilterFields(fields: LegacyFilterOption[]): CleanFieldRuleResult<AnalyzeConfigDao.FilterOption[]> {
    return this.cleanFields(fields, (field) => {
      const legacyOperator = field.filterType || field.filterRule?.operator
      const normalizedOperator = this.normalizeFilterOperator(legacyOperator)
      const operatorChanged = Boolean(legacyOperator && normalizedOperator !== legacyOperator)
      const filterRule = {
        ...createDefaultFilterRule(),
        ...(field.filterRule || {}),
        ...(normalizedOperator ? { operator: normalizedOperator } : {}),
        ...(typeof field.filterValue !== 'undefined' ? { operand: field.filterValue } : {}),
        ...(field.aggregationType ? { aggregation: field.aggregationType } : {})
      }
      return {
        field: {
          ...field,
          filterRule
        },
        normalizedCount: field.filterRule && !operatorChanged ? 0 : 1
      }
    })
  }

  private cleanDimensionFields(
    fields: LegacyDimensionOption[]
  ): CleanFieldRuleResult<AnalyzeConfigDao.DimensionOption[]> {
    return this.cleanFields(fields, (field) => ({
      field: {
        ...field,
        dimensionRule: field.dimensionRule || createDefaultDimensionRule()
      },
      normalizedCount: field.dimensionRule ? 0 : 1
    }))
  }

  private cleanOrderFields(fields: LegacyOrderOption[]): CleanFieldRuleResult<AnalyzeConfigDao.OrderOption[]> {
    return this.cleanFields(fields, (field) => {
      const orderRule = {
        ...createDefaultOrderRule(),
        ...(field.orderRule || {}),
        ...(field.orderType ? { direction: field.orderType } : {}),
        ...(field.aggregationType ? { aggregation: field.aggregationType } : {})
      }
      return {
        field: {
          ...field,
          orderRule
        },
        normalizedCount: field.orderRule ? 0 : 1
      }
    })
  }

  private cleanFields<T extends AnalyzeConfigField>(
    fields: T[],
    createRuleField: (field: T) => { field: T; normalizedCount: number }
  ): CleanFieldRuleResult<T[]> {
    let changed = false
    let normalizedFieldCount = 0
    let removedFieldCount = 0
    const data = fields.map((field) => {
      const { field: fieldWithRule, normalizedCount } = createRuleField(field)
      const { cleanedField, removedCount } = this.removeLegacyAnalyzeFieldKeys(fieldWithRule)
      if (normalizedCount > 0 || removedCount > 0) {
        changed = true
      }
      normalizedFieldCount += normalizedCount
      removedFieldCount += removedCount
      return cleanedField as T
    })

    return {
      data,
      changed,
      normalizedFieldCount,
      removedFieldCount
    }
  }

  private removeLegacyAnalyzeFieldKeys<T extends AnalyzeConfigField>(
    field: T
  ): { cleanedField: T; removedCount: number } {
    const legacyKeys = new Set([
      'orderType',
      'filterType',
      'filterValue',
      'aggregationType',
      'datasetFieldName',
      'datasetFieldType',
      'datasetAggregationType'
    ])
    let removedCount = 0
    const cleanedField: AnalyzeConfigField = {}

    for (const [key, value] of Object.entries(field)) {
      if (legacyKeys.has(key)) {
        removedCount += 1
        continue
      }
      cleanedField[key] = value
    }

    return {
      cleanedField: cleanedField as T,
      removedCount
    }
  }

  private normalizeFilterOperator(operator?: string): AnalyzeConfigDao.FilterType | undefined {
    if (!operator) return undefined
    const normalizedOperator = String(operator).trim()
    const operatorMap: Record<string, AnalyzeConfigDao.FilterType> = {
      '=': 'eq',
      eq: 'eq',
      '!=': 'neq',
      '<>': 'neq',
      neq: 'neq',
      '>': 'gt',
      gt: 'gt',
      '>=': 'gte',
      gte: 'gte',
      '<': 'lt',
      lt: 'lt',
      '<=': 'lte',
      lte: 'lte',
      like: 'like',
      notLike: 'notLike',
      notlike: 'notLike',
      isNull: 'isNull',
      isnull: 'isNull',
      'is null': 'isNull',
      isNotNull: 'isNotNull',
      isnotnull: 'isNotNull',
      'is not null': 'isNotNull'
    }
    return operatorMap[normalizedOperator] || operatorMap[normalizedOperator.toLowerCase()]
  }
}
