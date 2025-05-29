/**
 * @desc 过滤器 store
 */
import { defineStore } from 'pinia'
export const useFilterStore = defineStore<
  FilterStore.FilterKey,
  BaseStore.State<FilterStore.FilterState>,
  BaseStore.Getters<
    FilterStore.FilterState,
    FilterStore.FilterGetters
  >,
  BaseStore.Actions<
    FilterStore.FilterState,
    FilterStore.FilterActions
  >
>('filter', {
  state: () => ({
    filters: []
  }),
  getters: {
    getFilters(state) {
      return state.filters
    }
  },
  actions: {
    /**
     * @desc 设置过滤器
     * @param filters {FilterOption[]}
     * @returns {void}
     */
    setFilters(filters) {
      this.filters = filters
    },
    /**
     * @desc 添加过滤器
     * @param filters {FilterOption[]}
     * @returns {void}
     */
    addFilters(filters) {
      this.filters = this.filters.concat(filters)
    },
    /**
     * @desc 删除过滤器
     * @param index {number}
     * @returns {void}
     */
    removeFilter(index: number) {
      this.filters.splice(index, 1)
    }
  }
})
