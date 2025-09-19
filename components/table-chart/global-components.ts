/**
 * 全局组件实例管理器
 *
 * 用于在 render handlers 中访问组件实例
 */

import type FilterDropdown from './components/filter-dropdown.vue'

// 全局 FilterDropdown 组件实例
let globalFilterDropdownInstance: InstanceType<typeof FilterDropdown> | null = null

/**
 * 设置全局 FilterDropdown 实例
 */
export const setGlobalFilterDropdownInstance = (instance: InstanceType<typeof FilterDropdown> | null) => {
  globalFilterDropdownInstance = instance
}

/**
 * 获取全局 FilterDropdown 实例
 */
export const getGlobalFilterDropdownInstance = () => {
  return globalFilterDropdownInstance
}

/**
 * Filter Dropdown 方法集合
 *
 * 提供与原 filterDropdownHandler 相同的 API
 */
export const getFilterDropdownMethods = () => {
  if (!globalFilterDropdownInstance) {
    console.warn('FilterDropdown instance not available')
    return {
      openFilterDropdown: () => {},
      closeFilterDropdown: () => {},
      updateFilterDropdownPositionsInTable: () => {},
      handleSelectedFilter: () => {},
      initFilterDropdownListeners: () => {},
      cleanupFilterDropdownListeners: () => {}
    }
  }

  return {
    openFilterDropdown: globalFilterDropdownInstance.openFilterDropdown,
    closeFilterDropdown: globalFilterDropdownInstance.closeFilterDropdown,
    updateFilterDropdownPositionsInTable: globalFilterDropdownInstance.updateFilterDropdownPositionsInTable,
    handleSelectedFilter: globalFilterDropdownInstance.handleSelectedFilter,
    initFilterDropdownListeners: globalFilterDropdownInstance.initFilterDropdownListeners,
    cleanupFilterDropdownListeners: globalFilterDropdownInstance.cleanupFilterDropdownListeners
  }
}
