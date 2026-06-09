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
    dimensions: [],
    drillCurrentLevel: 0,
    drillPath: [],
    selectedDrillValue: null
  }),
  getters: {
    getDimensions(state) {
      return state.dimensions
    },
    getDrillCurrentLevel(state) {
      return state.drillCurrentLevel
    },
    getDrillPath(state) {
      return state.drillPath
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
     * @desc 重置分组和钻取状态
     * @returns {void}
     */
    resetDimensions() {
      this.dimensions = []
      this.resetDrill()
    },
    setDrillCurrentLevel(level: number) {
      this.drillCurrentLevel = Math.max(0, Math.floor(Number(level) || 0))
    },
    setDrillPath(path: DimensionStore.DrillPathItem[]) {
      this.drillPath = JSON.parse(JSON.stringify(path || []))
      this.drillCurrentLevel = this.drillPath.length
      this.selectedDrillValue = null
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
    },
    resetDrill() {
      this.drillCurrentLevel = 0
      this.drillPath = []
      this.selectedDrillValue = null
    },
    setSelectedDrillValue(value: DimensionStore.DrillPathItem['value']) {
      this.selectedDrillValue = value
    },
    drillDown(item: DimensionStore.DrillPathItem) {
      this.drillPath = this.drillPath.slice(0, this.drillCurrentLevel).concat([JSON.parse(JSON.stringify(item))])
      this.drillCurrentLevel = this.drillPath.length
      this.selectedDrillValue = null
    },
    rollUpTo(level: number) {
      const normalizedLevel = Math.max(0, Math.floor(Number(level) || 0))
      this.drillPath = this.drillPath.slice(0, normalizedLevel)
      this.drillCurrentLevel = this.drillPath.length
      this.selectedDrillValue = null
    }
  }
})
