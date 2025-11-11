/**
 * @desc 清空所有
 * @returns 清空所有
 */
export const clearAllHandler = () => {
  const orderStore = useOrdersStore()
  const filterStore = useFiltersStore()
  const groupStore = useGroupsStore()
  const dimensionStore = useDimensionsStore()

  /**
   * @desc 清空所有
   * @param type 类型
   */
  const clearAll = (type: 'orders' | 'filters' | 'groups' | 'dimensions') => {
    switch (type) {
      case 'orders':
        orderStore.setOrders([])
        break
      case 'filters':
        filterStore.setFilters([])
        break
      case 'groups':
        groupStore.setGroups([])
        break
      case 'dimensions':
        dimensionStore.setDimensions([])
        break
      default:
        console.log('clearAll', type)
        break
    }
  }

  /**
   * @desc 判断是否清空
   * @param type 类型
   * @returns 是否清空
   */
  const hasClearAll = (type: 'orders' | 'filters' | 'groups' | 'dimensions') => {
    switch (type) {
      case 'orders':
        return orderStore.getOrders.length > 0
      case 'filters':
        return filterStore.getFilters.length > 0
      case 'groups':
        return groupStore.getGroups.length > 0
      case 'dimensions':
        return dimensionStore.getDimensions.length > 0
      default:
        return false
    }
  }

  return {
    clearAll,
    hasClearAll
  }
}
