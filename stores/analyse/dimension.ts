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
    dimensions: [
      {
        name: 'register',
        alias: 'register',
        comment: '注册',
        displyName: '注册',
        type: 'number',
        choosed: true
      }
    ]
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
    // addDimension(dimensions) {
    //   this.dimensions = this.dimensions.concat(dimensions)
    // },
    // removeDimension(index) {
    //   this.dimensions.splice(index, 1)
    // }
  }
})
