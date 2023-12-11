/**
 * @desc 维度 store
 */
export const useDimensionStore = definePiniaStore<
  DimensionStore.DimensionKey,
  DimensionStore.DimensionState,
  DimensionStore.DimensionGetters<DimensionStore.DimensionState>,
  DimensionStore.DimensionActions
>('dimension', {
  state: () => ({
    dimensions: []
  }),
  getters: {
    getDimensions(state) {
      return state.dimensions
    }
  },
  actions: {
    setDimensions(dimensions) {
      this.dimensions = dimensions
    },
    addDimensions(dimensions) {
      this.dimensions.push(...dimensions)
    },
    removeDimensions(index) {
      this.dimensions.splice(index, 1)
    }
  }
})
