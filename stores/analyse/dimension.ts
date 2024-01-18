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
    /**
     * @desc 更新维度
     * @param dimensions {Array<DimensionStore.DimensionOption>}
     * @returns {void}
     */
    setDimensions(dimensions) {
     
      
      this.dimensions = dimensions
    },
    /**
     * @desc 添加维度
     * @param dimensions {Array<DimensionStore.DimensionOption>}
     * @returns {void}
     */
    addDimensions(dimensions) {
      this.dimensions.push(...dimensions)
    },
    /**
     * @desc 删除维度
     * @param index {number}
     * @returns {void}
     */
    removeDimension(index) {
      this.dimensions.splice(index, 1)
    }
  }
})
