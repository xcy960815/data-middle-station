import { StoreNames } from './store-names'
import {
  getAnalyzeDrillDimensionIndexes,
  normalizeAnalyzeDrillDimensions,
  setAnalyzeDimensionDrillValue
} from '@/shared/analyzeDrillState'
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
    dimensions: [],
    selectedDrillValue: null
  }),
  getters: {
    getDimensions(state) {
      return state.dimensions
    },
    getSelectedDrillValue(state) {
      return state.selectedDrillValue
    }
  },
  actions: {
    /**
     * @desc 添加分组
     * @param dimensions {DimensionOption[]}
     * @returns {void}
     */
    addDimensions(dimensions) {
      this.dimensions = normalizeAnalyzeDrillDimensions(this.dimensions.concat(dimensions))
    },
    /**
     * @desc 设置分组
     * @param dimensions {DimensionOption[]}
     * @returns {void}
     */
    setDimensions(dimensions) {
      this.dimensions = normalizeAnalyzeDrillDimensions(dimensions)
    },
    /**
     * @desc 重置分组和钻取状态
     * @returns {void}
     */
    resetDimensions() {
      this.dimensions = []
      this.resetDrill()
    },
    /**
     * @desc 删除分组
     * @param index {number}
     * @returns {void}
     */
    removeDimension(index: number) {
      this.dimensions.splice(index, 1)
      this.dimensions = normalizeAnalyzeDrillDimensions(this.dimensions)
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
        this.dimensions = normalizeAnalyzeDrillDimensions(this.dimensions)
      }
    },
    resetDrill() {
      this.dimensions = this.dimensions.map((dimension) => setAnalyzeDimensionDrillValue(dimension, undefined))
      this.selectedDrillValue = null
    },
    setSelectedDrillValue(value: DimensionStore.DrillPathItem['value']) {
      this.selectedDrillValue = value
    },
    drillDown(level: number, value: DimensionStore.DrillPathItem['value']) {
      const normalizedLevel = Math.max(0, Math.floor(Number(level) || 0))
      const drillIndexes = getAnalyzeDrillDimensionIndexes(this.dimensions)
      const targetIndex = drillIndexes[normalizedLevel]
      if (typeof targetIndex === 'undefined') return

      this.dimensions[targetIndex] = setAnalyzeDimensionDrillValue(this.dimensions[targetIndex], value)
      for (let i = normalizedLevel + 1; i < drillIndexes.length; i++) {
        this.dimensions[drillIndexes[i]] = setAnalyzeDimensionDrillValue(this.dimensions[drillIndexes[i]], undefined)
      }
      this.dimensions = normalizeAnalyzeDrillDimensions(this.dimensions)
      this.selectedDrillValue = null
    },
    rollUpTo(level: number) {
      const normalizedLevel = Math.max(0, Math.floor(Number(level) || 0))
      const drillIndexes = getAnalyzeDrillDimensionIndexes(this.dimensions)
      for (let i = normalizedLevel; i < drillIndexes.length; i++) {
        this.dimensions[drillIndexes[i]] = setAnalyzeDimensionDrillValue(this.dimensions[drillIndexes[i]], undefined)
      }
      this.dimensions = normalizeAnalyzeDrillDimensions(this.dimensions)
      this.selectedDrillValue = null
    }
  }
})
