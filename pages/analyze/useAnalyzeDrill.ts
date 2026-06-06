import { computed } from 'vue'
import { createFilterRule } from '@/shared/analyzeFieldRules'

export const useAnalyzeDrill = () => {
  const dimensionStore = useDimensionsStore()

  const dimensions = computed(() => dimensionStore.getDimensions)

  const effectiveDrillLevel = computed(() => {
    const dimensionCount = dimensions.value.length
    if (dimensionCount === 0) return 0
    return Math.min(dimensionStore.getDrillCurrentLevel, dimensionCount - 1)
  })

  const currentDrillDimension = computed(() => {
    return dimensions.value[effectiveDrillLevel.value]
  })

  const nextDrillDimension = computed(() => {
    return dimensions.value[effectiveDrillLevel.value + 1]
  })

  const drillPath = computed(() => {
    return dimensionStore.getDrillPath.slice(0, effectiveDrillLevel.value)
  })

  const drillFilters = computed<FilterStore.FilterOption[]>(() => {
    return drillPath.value.map((item) => ({
      ...JSON.parse(JSON.stringify(item.dimension)),
      filterRule: createFilterRule({
        aggregation: 'raw',
        operator: 'eq',
        operand: item.value == null ? '' : String(item.value)
      }),
      displayName: item.dimension.displayName || item.dimension.columnComment || item.dimension.columnName || '钻取路径'
    }))
  })

  const getDimensionLabel = (dimension?: DimensionStore.DimensionOption) => {
    return dimension?.displayName || dimension?.columnComment || dimension?.columnName || ''
  }

  return {
    dimensions,
    effectiveDrillLevel,
    currentDrillDimension,
    nextDrillDimension,
    drillPath,
    drillFilters,
    getDimensionLabel
  }
}
