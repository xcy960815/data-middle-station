import { computed } from 'vue'
import { buildAnalyzeDrillFilters, deriveAnalyzeDrillState, isAnalyzeDrillDimension } from '@/shared/analyzeDrillState'

export const useAnalyzeDrill = () => {
  const dimensionStore = useDimensionsStore()

  const dimensions = computed(() => dimensionStore.getDimensions)

  const isDrillEnabledDimension = (dimension: DimensionStore.DimensionOption) => isAnalyzeDrillDimension(dimension)

  const drillState = computed(() => deriveAnalyzeDrillState(dimensions.value, { preNormalized: true }))

  const drillDimensions = computed(() => drillState.value.drillDimensions)

  const effectiveDrillLevel = computed(() => drillState.value.effectiveDrillLevel)

  const currentDrillDimension = computed(() => drillState.value.currentDrillDimension)

  const nextDrillDimension = computed(() => drillState.value.nextDrillDimension)

  const drillPath = computed(() => drillState.value.drillPath)

  const drillFilters = computed<FilterStore.FilterOption[]>(() => buildAnalyzeDrillFilters(drillPath.value))

  const getDimensionLabel = (dimension?: DimensionStore.DimensionOption) => {
    return dimension?.displayName || dimension?.columnComment || dimension?.columnName || ''
  }

  return {
    dimensions,
    drillDimensions,
    isDrillEnabledDimension,
    effectiveDrillLevel,
    currentDrillDimension,
    nextDrillDimension,
    drillPath,
    drillFilters,
    getDimensionLabel
  }
}
