/**
 * @desc 维度 store
 */
export const useFilterStore = definePiniaStore<
  FilterStore.FilterKey,
  FilterStore.FilterState,
  FilterStore.FilterGetters,
  FilterStore.FilterActions
>('filter', {
  state: () => ({
    filters: [],
  }),
  getters: {
    getFilters(state) {
      return () => {
        return state.filters;
      };
    },
  },
  actions: {
    updateFilter(filters) {
      this.filters = filters;
    },
    addFilter(filters) {
      this.filters = this.filters.concat(filters);
    },
    removeFilter(index) {
      this.filters.splice(index, 1);
    },
  },
});
