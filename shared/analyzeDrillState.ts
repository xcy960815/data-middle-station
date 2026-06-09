import { cloneAnalyzeFilterFieldRule } from '@/shared/analyzeConfigFieldRules'

export type AnalyzeDrillValue = string | number | boolean | null

export type AnalyzeDrillPathItem<T extends AnalyzeConfigDao.DimensionOption = AnalyzeConfigDao.DimensionOption> = {
  dimension: T
  value: AnalyzeDrillValue
}

export type AnalyzeDrillState<T extends AnalyzeConfigDao.DimensionOption = AnalyzeConfigDao.DimensionOption> = {
  drillDimensions: T[]
  drillPath: AnalyzeDrillPathItem<T>[]
  effectiveDrillLevel: number
  currentDrillDimension?: T
  nextDrillDimension?: T
}

type DeriveAnalyzeDrillStateOptions = {
  preNormalized?: boolean
}

const hasAnalyzeDrillValue = (value: unknown): value is AnalyzeDrillValue => {
  return value !== null && typeof value !== 'undefined' && value !== ''
}

export function filterValidAnalyzeQueryFilters<T extends AnalyzeConfigDao.FilterOption>(filters: T[] = []): T[] {
  return filters.filter((item) => item.filterRule?.aggregation && (item.filterRule.operator || item.filterRule.operand))
}

export function isAnalyzeDrillDimension(dimension: AnalyzeConfigDao.DimensionOption): boolean {
  const drillRule = dimension.dimensionRule?.drill
  return drillRule?.enabled !== false && (!drillRule?.role || drillRule.role === 'level')
}

export function getAnalyzeDrillDimensionIndexes<T extends AnalyzeConfigDao.DimensionOption>(dimensions: T[]): number[] {
  return dimensions.reduce<number[]>((indexes, dimension, index) => {
    if (isAnalyzeDrillDimension(dimension)) {
      indexes.push(index)
    }
    return indexes
  }, [])
}

export function setAnalyzeDimensionDrillValue<T extends AnalyzeConfigDao.DimensionOption>(
  dimension: T,
  value: AnalyzeDrillValue | undefined
): T {
  return {
    ...dimension,
    dimensionRule: {
      ...dimension.dimensionRule,
      drill: {
        ...dimension.dimensionRule?.drill,
        value
      }
    }
  }
}

export function normalizeAnalyzeDrillDimensions<T extends AnalyzeConfigDao.DimensionOption>(dimensions: T[]): T[] {
  const drillIndexes = getAnalyzeDrillDimensionIndexes(dimensions)
  const maxPersistedPathLength = Math.max(drillIndexes.length - 1, 0)
  let acceptsPathValue = true
  let persistedPathLength = 0
  const drillIndexSet = new Set(drillIndexes)

  return dimensions.map((dimension, index) => {
    const drillValue = dimension.dimensionRule?.drill?.value

    if (!drillIndexSet.has(index)) {
      return hasAnalyzeDrillValue(drillValue) ? setAnalyzeDimensionDrillValue(dimension, undefined) : dimension
    }

    if (!acceptsPathValue || persistedPathLength >= maxPersistedPathLength || !hasAnalyzeDrillValue(drillValue)) {
      acceptsPathValue = false
      return hasAnalyzeDrillValue(drillValue) ? setAnalyzeDimensionDrillValue(dimension, undefined) : dimension
    }

    persistedPathLength += 1
    return dimension
  })
}

export function deriveAnalyzeDrillState<T extends AnalyzeConfigDao.DimensionOption>(
  dimensions: T[],
  options: DeriveAnalyzeDrillStateOptions = {}
): AnalyzeDrillState<T> {
  const normalizedDimensions = options.preNormalized ? dimensions : normalizeAnalyzeDrillDimensions(dimensions)
  const drillDimensions = normalizedDimensions.filter(isAnalyzeDrillDimension)
  const drillPath: AnalyzeDrillPathItem<T>[] = []

  for (const dimension of drillDimensions) {
    const value = dimension.dimensionRule?.drill?.value
    if (!hasAnalyzeDrillValue(value)) break
    drillPath.push({ dimension, value })
  }

  const effectiveDrillLevel = drillPath.length

  return {
    drillDimensions,
    drillPath,
    effectiveDrillLevel,
    currentDrillDimension: drillDimensions[effectiveDrillLevel],
    nextDrillDimension: drillDimensions[effectiveDrillLevel + 1]
  }
}

export function buildAnalyzeDrillFilters(drillPath: AnalyzeDrillPathItem[]): AnalyzeConfigDao.FilterOption[] {
  return drillPath.map((item) => ({
    ...JSON.parse(JSON.stringify(item.dimension)),
    filterRule: cloneAnalyzeFilterFieldRule({
      aggregation: 'raw',
      operator: 'eq',
      operand: item.value == null ? '' : String(item.value)
    }),
    displayName: item.dimension.displayName || item.dimension.columnComment || item.dimension.columnName || '钻取路径'
  }))
}

export function resolveAnalyzeDrillQueryFields(params: {
  dimensions: AnalyzeConfigDao.DimensionOption[]
  filters?: AnalyzeConfigDao.FilterOption[]
}): {
  dimensions: AnalyzeConfigDao.DimensionOption[]
  filters: AnalyzeConfigDao.FilterOption[]
  drillState: AnalyzeDrillState
  normalizedDimensions: AnalyzeConfigDao.DimensionOption[]
} {
  const normalizedDimensions = normalizeAnalyzeDrillDimensions(params.dimensions || [])
  const drillState = deriveAnalyzeDrillState(normalizedDimensions, { preNormalized: true })
  const isDrillQueryEnabled = drillState.drillDimensions.length > 1
  const drillFilters = isDrillQueryEnabled ? buildAnalyzeDrillFilters(drillState.drillPath) : []

  return {
    dimensions:
      isDrillQueryEnabled && drillState.currentDrillDimension
        ? [drillState.currentDrillDimension]
        : normalizedDimensions,
    filters: [...filterValidAnalyzeQueryFilters(params.filters || []), ...drillFilters],
    drillState,
    normalizedDimensions
  }
}
