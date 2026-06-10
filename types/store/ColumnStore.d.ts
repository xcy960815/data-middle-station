/**
 * @desc 列存储类型
 */
declare namespace ColumnsStore {
  type ColumnKey = 'columns'

  type ColumnOptions = DatabaseVo.TableColumnItem

  type ColumnState = {
    datasetId: number | null
    datasetName: string
    columns: Array<ColumnOptions>
  }

  type ColumnGetters = {}

  type ColumnActions = {
    setDatasetId: (datasetId: number | null) => void
    setDatasetName: (datasetName: string) => void
    resetDataset: () => void
    updateColumn: (params: { column: ColumnOptions; index: number }) => void
  }
}
