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
  /**
   * @desc 关于列所哟的数据字段
   */
  state: () => ({
    dataSource: '',
    dataSourceMode: 'table' as ColumnsStore.DataSourceMode,
    datasetId: null as number | null,
    datasetName: '',
    dataSourceOptions: [],
    columns: []
  }),

  getters: {
    /**
     * @desc 返回列名
     * @param state {ColumnState}
     * @returns {ColumnOptions[]}
     */
    getColumns(state) {
      return state.columns
    },
    /**
     * @desc 返回数据源
     * @param state {ColumnState}
     * @returns {string}
     */
    getDataSource(state): string {
      return state.dataSource
    },
    /**
     * @desc 返回数据来源类型
     */
    getDataSourceMode(state): ColumnsStore.DataSourceMode {
      return state.dataSourceMode
    },
    /**
     * @desc 返回数据集ID
     */
    getDatasetId(state): number | null {
      return state.datasetId
    },
    /**
     * @desc 返回数据集名称
     */
    getDatasetName(state): string {
      return state.datasetName
    },
    /**
     * @desc 返回数据源选项
     * @param state {ColumnState}
     * @returns {DataSourceOption[]}
     */
    getDataSourceOptions(state) {
      return state.dataSourceOptions
    }
  },

  actions: {
    /**
     * @desc 更新列名
     */
    setColumns(columns) {
      this.columns = columns
    },
    /**
     * @desc 更新列名
     * @param params {{ column: ColumnOptions, index: number }}
     */
    updateColumn({ column, index }) {
      this.columns[index] = column
    },
    /**
     * @desc 更新数据源
     * @param dataSource {string}
     */
    setDataSource(dataSource: string) {
      this.dataSource = dataSource
    },
    /**
     * @desc 更新数据来源类型
     */
    setDataSourceMode(dataSourceMode: ColumnsStore.DataSourceMode) {
      this.dataSourceMode = dataSourceMode
    },
    /**
     * @desc 更新数据集ID
     */
    setDatasetId(datasetId: number | null) {
      this.datasetId = datasetId
    },
    /**
     * @desc 更新数据集名称
     */
    setDatasetName(datasetName: string) {
      this.datasetName = datasetName
    },
    /**
     * @desc 更新所有的表
     * @param dataSourceOptions {DataSourceOption[]}
     * @returns {void}
     */
    setDataSourceOptions(dataSourceOptions) {
      this.dataSourceOptions = dataSourceOptions
    }
  }
})
