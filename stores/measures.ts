import { StoreNames } from './store-names'
/**
 * @desc 值/度量 store。
 */
import { defineStore } from 'pinia'
export const useMeasuresStore = defineStore<
  MeasureStore.MeasureKey,
  BaseStore.State<MeasureStore.MeasureState>,
  BaseStore.Getters<MeasureStore.MeasureState, MeasureStore.MeasureGetters>,
  BaseStore.Actions<MeasureStore.MeasureState, MeasureStore.MeasureActions>
>(StoreNames.MEASURES, {
  state: () => ({
    measures: []
  }),
  getters: {
    getMeasures(state) {
      return state.measures
    }
  },
  actions: {
    /**
     * @desc 设置值/度量字段
     * @param measures {MeasureOption[]}
     * @returns {void}
     */
    setMeasures(measures) {
      this.measures = measures
    },
    /**
     * @desc 重置值/度量字段
     * @returns {void}
     */
    resetMeasures() {
      this.measures = []
    },
    /**
     * @desc 添加值/度量字段
     * @param measures {MeasureStore.MeasureOption[]}
     * @returns {void}
     */
    addMeasures(measures) {
      this.measures.push(...measures)
    },
    /**
     * @desc 删除值/度量字段
     * @param index {number}
     * @returns {void}
     */
    removeMeasure(index: number) {
      this.measures.splice(index, 1)
    },
    updateMeasure(measure: MeasureStore.MeasureOption) {
      const index = this.measures.findIndex(
        (item: MeasureStore.MeasureOption) => item.columnName === measure.columnName
      )
      if (index !== -1) {
        this.measures[index] = measure
      }
    },
    updateMeasureByIndex(index: number, measure: MeasureStore.MeasureOption) {
      if (index >= 0 && index < this.measures.length) {
        this.measures[index] = measure
      }
    }
  }
})
