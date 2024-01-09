
/**
 * @desc 列 store
 */
export const useColumnStore = definePiniaStore<ColumnStore.ColumnKey, ColumnStore.ColumnState, ColumnStore.ColumnGetters<ColumnStore.ColumnState>, ColumnStore.ColumnActions>('column', {
  /**
   * @desc 关于列所哟的数据字段
   * @returns {ColumnStore.ColumnState}
   */
  state: () => ({
    dataSource: "employees",
    dataSourceOptions: [],
    columns: []
  }),

  getters: {
    /**
     * @desc 返回列名
     * @param state {ColumnStore.ColumnState}
     * @returns {ColumnStore.Column[]}
     */
    getColumns(state) {
      return state.columns;
    },
    /**
     * @desc 返回数据源
     * @param state {ColumnStore.ColumnState}
     * @returns {string}
     */
    getDataSource(state) {
      return state.dataSource;
    },
    /**
     * @desc 返回数据源选项
     * @param state {ColumnStore.ColumnState}
     * @returns {ColumnStore.dataSourceOption[]}
     */
    getDataSourceOptions(state) {
      return state.dataSourceOptions;
    },
  },

  actions: {
    /**
     * @desc 更新列名
     * @param columns {Array<ColumnStore.Column>}
     */
    setColumns(columns) {
      this.columns = columns
    },
    /**
     * @desc 删除列名
     * @param columns {Array<ColumnStore.Column>}
     */
    removeColumns(columns) {
      this.columns = this.columns.filter(column => !columns.includes(column))
    },
    /**
     * @desc 更新列名
     * @param column {ColumnStore.Column}
     * @param index {number}
     * @returns {void}
     */
    updateColumn(column, index) {
      this.columns[index] = column
    },
    /**
     * @desc 更新数据源
     * @param dataSource {string}
     */
    setDataSource(dataSource) {
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
     * @param dataSourceOptions {ColumnStore.dataSourceOption[]}
     * @returns {void}
     */
    setDataSourceOptions(dataSourceOptions) {
      this.dataSourceOptions = dataSourceOptions
    },
    /**
     * @desc 删除所有的表
     * @param dataSourceOptions {ColumnStore.dataSourceOption[]}
     * @returns {void}
     */
    removeDataSourceOptions(dataSourceOptions) {
      this.dataSourceOptions = dataSourceOptions
    }
  }
})
