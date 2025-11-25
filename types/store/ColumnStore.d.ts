/**
 * @desc 列存储类型
 */
declare namespace ColumnStore {
  /**
   * @desc 列key
   */
  type ColumnKey = 'columns'

  /**
   * @desc 列选项
   */
  type ColumnOption = DatabaseVo.GetTableColumnsResponse

  /**
   * @desc 数据源选项
   */
  type DataSourceOption = DatabaseVo.GetDatabaseTablesResponse

  /**
   * @desc 列状态
   */
  type ColumnState = {
    /**
     * @desc 数据源
     */
    dataSource: string
    /**
     * @desc 数据源选项
     */
    dataSourceOptions: Array<DataSourceOption>
    /**
     * @desc 列
     */
    columns: Array<ColumnOption>
  }

  /**
   * @desc getter
   */
  type ColumnGetters = {}
  /**
   * @desc action
   */
  type ColumnActions = {
    /**
     * @desc 删除列
     */
    removeColumns: (columns: ColumnOption[]) => void
    /**
     * @desc 设置数据源
     */
    setDataSource: (dataSource: string) => void
    /**
     * @desc 设置数据源选项
     */
    setDataSourceOptions: (dataSourceOptions: DataSourceOption[]) => void
    /**
     * @desc 删除数据源
     */
    removeDataSource: (dataSource: string) => void
    /**
     * @desc 删除数据源选项
     */
    removeDataSourceOptions: (dataSourceOptions: DataSourceOption[]) => void
    /**
     * @desc 更新列
     */
    updateColumn: (params: { column: ColumnOption; index: number }) => void
  }
}
