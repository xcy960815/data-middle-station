import { StoreNames } from './store-names'
import cloneDeep from 'lodash/cloneDeep'
/**
 * @desc 维度 store
 */
import { defineStore } from 'pinia'
export const useDimensionStore = defineStore<
  DimensionStore.DimensionKey,
  BaseStore.State<DimensionStore.DimensionState>,
  BaseStore.Getters<DimensionStore.DimensionState, DimensionStore.DimensionGetters>,
  BaseStore.Actions<DimensionStore.DimensionState, DimensionStore.DimensionActions>
>(StoreNames.DIMENSION, {
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
     * @param dimensions {DimensionOption[]}
     * @returns {void}
     */
    setDimensions(dimensions) {
      this.dimensions = dimensions
    },
    /**
     * @desc 添加维度
     * @param dimensions {DimensionStore.DimensionOption[]}
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
    removeDimension(index: number) {
      this.dimensions.splice(index, 1)
    },
    updateDimension(dimension) {
      const index = this.dimensions.findIndex((item) => item.columnName === dimension.columnName)
      if (index !== -1) {
        this.dimensions[index] = dimension
      }
    }
  }
})
