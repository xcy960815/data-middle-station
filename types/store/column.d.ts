declare namespace ColumnStore {
  type ColumnKey = 'column'

  type ColumnOption = DatabaseVo.TableColumnOptionVo

  type DataSourceOption = DatabaseVo.TableOptionVo

  type ColumnState = {
    dataSource: string
    dataSourceOptions: Array<DataSourceOption>
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
    removeColumns: (columns: ColumnOption[]) => void
    setDataSource: (dataSource: string) => void
    setDataSourceOptions: (
      dataSourceOptions: DataSourceOption[]
    ) => void
    removeDataSource: (dataSource: string) => void
    removeDataSourceOptions: (
      dataSourceOptions: DataSourceOption[]
    ) => void
    updateColumn: (params: {
      column: ColumnOption
      index: number
    }) => void
  }
}
