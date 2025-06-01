import { sw } from 'element-plus/es/locales.mjs'

/**
 * @desc 清空所有
 * @returns 清空所有
 */
export const clearAllHandler = () => {
  const orderStore = useOrderStore()
  const filterStore = useFilterStore()
  const groupStore = useGroupStore()
  const dimensionStore = useDimensionStore()

  /**
   * @desc 清空所有
   * @param type 类型
   */
  const clearAll = (
    type: 'order' | 'filter' | 'group' | 'dimension'
  ) => {
    switch (type) {
      case 'order':
        orderStore.setOrders([])
        break
      case 'filter':
        filterStore.setFilters([])
        break
      case 'group':
        groupStore.setGroups([])
        break
      case 'dimension':
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
  const hasClearAll = (
    type: 'order' | 'filter' | 'group' | 'dimension'
  ) => {
    switch (type) {
      case 'order':
        return orderStore.getOrders.length > 0
      case 'filter':
        return filterStore.getFilters.length > 0
      case 'group':
        return groupStore.getGroups.length > 0
      case 'dimension':
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
