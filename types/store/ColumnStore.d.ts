/**
 * @desc 列存储类型
 */
declare namespace ColumnsStore {
  /**
   * @desc 列key
   */
  type ColumnKey = 'columns'

  /**
   * @desc 列选项
   */
  type ColumnOptions = DatabaseVo.TableColumnItem

  /**
   * @desc 数据源选项
   */
  type DataSourceOption = DatabaseVo.TableItem

  /**
   * @desc 数据来源类型
   */
  type DataSourceMode = 'table' | 'dataset'

  /**
   * @desc 列状态
   */
  type ColumnState = {
    /**
     * @desc 数据源
     */
    dataSource: string
    /**
     * @desc 数据来源类型
     */
    dataSourceMode: DataSourceMode
    /**
     * @desc 数据集ID
     */
    datasetId: number | null
    /**
     * @desc 数据集名称
     */
    datasetName: string
    /**
     * @desc 数据源选项
     */
    dataSourceOptions: Array<DataSourceOption>
    /**
     * @desc 列
     */
    columns: Array<ColumnOptions>
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
    removeColumns: (columns: ColumnOptions[]) => void
    /**
     * @desc 设置数据源
     */
    setDataSource: (dataSource: string) => void
    /**
     * @desc 设置数据来源类型
     */
    setDataSourceMode: (dataSourceMode: DataSourceMode) => void
    /**
     * @desc 设置数据集ID
     */
    setDatasetId: (datasetId: number | null) => void
    /**
     * @desc 设置数据集名称
     */
    setDatasetName: (datasetName: string) => void
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
    updateColumn: (params: { column: ColumnOptions; index: number }) => void
  }
}
