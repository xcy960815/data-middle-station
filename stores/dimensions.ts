import { StoreNames } from './store-names'
/**
 * @desc 分组 store
 */
import { defineStore } from 'pinia'
export const useDimensionsStore = defineStore<
  DimensionStore.DimensionKey,
  BaseStore.State<DimensionStore.DimensionState>,
  BaseStore.Getters<DimensionStore.DimensionState, DimensionStore.DimensionGetters>,
  BaseStore.Actions<DimensionStore.DimensionState, DimensionStore.DimensionActions>
>(StoreNames.DIMENSIONS, {
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
     * @desc 添加分组
     * @param dimensions {DimensionOption[]}
     * @returns {void}
     */
    addDimensions(dimensions) {
      this.dimensions = this.dimensions.concat(dimensions)
    },
    /**
     * @desc 设置分组
     * @param dimensions {DimensionOption[]}
     * @returns {void}
     */
    setDimensions(dimensions) {
      this.dimensions = dimensions
    },
    /**
     * @desc 删除分组
     * @param index {number}
     * @returns {void}
     */
    removeDimension(index: number) {
      this.dimensions.splice(index, 1)
    },
    /**
     * @desc 更新分组
     * @param dimension {DimensionOption}
     * @returns {void}
     */
    updateDimension(dimension: DimensionStore.DimensionOption) {
      const index = this.dimensions.findIndex(
        (item: DimensionStore.DimensionOption) => item.columnName === dimension.columnName
      )
      if (index !== -1) {
        this.dimensions[index] = dimension
      }
    }
  }
})
