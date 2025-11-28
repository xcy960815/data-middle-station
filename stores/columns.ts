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
    dataSourceOptions: [],
    columns: []
  }),

  getters: {
    /**
     * @desc 返回列名
     * @param state {ColumnState}
     * @returns {ColumnOption[]}
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
     * @desc 删除列名
     */
    removeColumns(columns) {
      this.columns = this.columns.filter((column: ColumnsStore.ColumnOption) => !columns.includes(column))
    },
    /**
     * @desc 更新列名
     * @param params {{ column: ColumnOption, index: number }}
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
     * @desc 删除数据源
     * @param dataSource {string}
     */
    removeDataSource(dataSource) {
      this.dataSource = dataSource
    },

    /**
     * @desc 更新所有的表
     * @param dataSourceOptions {DataSourceOption[]}
     * @returns {void}
     */
    setDataSourceOptions(dataSourceOptions) {
      this.dataSourceOptions = dataSourceOptions
    },
    /**
     * @desc 删除所有的表
     * @param dataSourceOptions {DataSourceOption[]}
     * @returns {void}
     */
    removeDataSourceOptions(dataSourceOptions) {
      this.dataSourceOptions = dataSourceOptions
    }
  }
})
