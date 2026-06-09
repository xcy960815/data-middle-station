declare namespace CanvasTable {
  type TableColumnUi = Partial<Omit<AnalyzeConfigDao.TableColumnSetting, 'columnName' | 'role'>> & {
    width: number
    colIndex: number
    align: 'left' | 'right' | 'center'
    verticalAlign: 'top' | 'middle' | 'bottom'
  }

  type ColumnOption = (DimensionStore.DimensionOption | MeasureStore.MeasureOption) & TableColumnUi
}
