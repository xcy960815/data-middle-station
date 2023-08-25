/**
 * @desc 维度 store
 */
export const useDimensionStore = definePiniaStore<
  DimensionStore.DimensionKey,
  DimensionStore.DimensionState,
  DimensionStore.DimensionGetters,
  DimensionStore.DimensionActions
>('dimension', {
  state: () => ({
    dimensions: [
      {
        name: 'age',
        alias: 'age',
        comment: '年龄',
        displyName: '年龄',
        type: 'number',
        choosed: true
      }
    ]
  }),
  getters: {
    getDimensions(state) {
      return () => {
        return state.dimensions
      }
    }
  },
  actions: {
    updateDimension(dimensions) {
      this.dimensions = dimensions
    },
    addDimension(dimensions) {
      this.dimensions = this.dimensions.concat(dimensions)
    },
    removeDimension(index) {
      this.dimensions.splice(index, 1)
    }
  }
})
