import { StoreNames } from './store-names'
/**
 * @desc 列 store
 */
export const useColumnsStore = defineStore<
  ColumnsStore.ColumnKey,
  BaseStore.State<ColumnsStore.ColumnState>,
  BaseStore.Getters<ColumnsStore.ColumnState, ColumnsStore.ColumnGetters>,
  BaseStore.Actions<ColumnsStore.ColumnState, ColumnsStore.ColumnActions>
>(StoreNames.COLUMNS, {
  state: () => ({
    datasetId: null as number | null,
    datasetName: '',
    columns: []
  }),

  getters: {
    getColumns(state) {
      return state.columns
    },
    getDatasetId(state): number | null {
      return state.datasetId
    },
    getDatasetName(state): string {
      return state.datasetName
    }
  },

  actions: {
    setColumns(columns) {
      this.columns = columns
    },
    updateColumn({ column, index }) {
      this.columns[index] = column
    },
    setDatasetId(datasetId) {
      this.datasetId = datasetId
    },
    setDatasetName(datasetName) {
      this.datasetName = datasetName
    },
    resetDataset() {
      this.datasetId = null
      this.datasetName = ''
      this.columns = []
    }
  }
})
