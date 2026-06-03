import { StoreNames } from './store-names'
/**
 * @desc 值/度量 store。历史 store 名沿用 dimensions。
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
    },
    getMeasures(state) {
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
    updateDimension(dimension: DimensionStore.DimensionOption) {
      const index = this.dimensions.findIndex(
        (item: DimensionStore.DimensionOption) => item.columnName === dimension.columnName
      )
      if (index !== -1) {
        this.dimensions[index] = dimension
      }
    },
    updateDimensionByIndex(index: number, dimension: DimensionStore.DimensionOption) {
      if (index >= 0 && index < this.dimensions.length) {
        this.dimensions[index] = dimension
      }
    }
  }
})
