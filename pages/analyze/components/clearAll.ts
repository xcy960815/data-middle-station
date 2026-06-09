/**
 * @desc 清空所有
 * @returns 清空所有
 */
export const clearAllHandler = () => {
  const orderStore = useOrdersStore()
  const filterStore = useFiltersStore()
  const dimensionStore = useDimensionsStore()
  const measureStore = useMeasuresStore()

  /**
   * @desc 清空所有
   * @param type 类型
   */
  const clearAll = (type: 'orders' | 'filters' | 'dimensions' | 'measures') => {
    switch (type) {
      case 'orders':
        orderStore.resetOrders()
        break
      case 'filters':
        filterStore.resetFilters()
        break
      case 'dimensions':
        dimensionStore.resetDimensions()
        break
      case 'measures':
        measureStore.resetMeasures()
        break
      default:
        break
    }
  }

  /**
   * @desc 判断是否清空
   * @param type 类型
   * @returns 是否清空
   */
  const hasClearAll = (type: 'orders' | 'filters' | 'dimensions' | 'measures') => {
    switch (type) {
      case 'orders':
        return orderStore.getOrders.length > 0
      case 'filters':
        return filterStore.getFilters.length > 0
      case 'dimensions':
        return dimensionStore.getDimensions.length > 0
      case 'measures':
        return measureStore.getMeasures.length > 0
      default:
        return false
    }
  }

  return {
    clearAll,
    hasClearAll
  }
}
