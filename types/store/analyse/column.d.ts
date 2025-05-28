/**
 * @desc 左侧列字段
 */
declare namespace ColumnStore {
  type ColumnKey = 'column'
  /**
   * @desc 列字段
   * @interface ColumnOption
   * @property {string} columnName 列名
   * @property {string} columnType 列类型
   * @property {string} columnComment 列注释
   * @property {string} alias 别名
   * @property {string} displayName 显示名称
   */
  interface ColumnOptionDto
    extends TableInfoModule.TableColumnOptionDao {
    // 重写 columnName 类型 在dao层已经转换为驼峰
    columnName: string
    columnType: string
    columnComment?: string
    alias: string
    displayName: string
  }

  type DataSourceOption = TableInfoModule.TableOptionDao

  type ColumnState = {
    dataSource: string
    dataSourceOptions: Array<DataSourceOption>
    columns: ColumnOption[]
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
