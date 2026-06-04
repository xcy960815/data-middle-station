declare namespace CanvasTable {
  type DimensionOption = DimensionStore.DimensionOption & {
    width: number
    colIndex: number
    align: 'left' | 'right' | 'center'
    verticalAlign: 'top' | 'middle' | 'bottom'
  }

  type MeasureOption = MeasureStore.MeasureOption & {
    width: number
    colIndex: number
    align: 'left' | 'right' | 'center'
    verticalAlign: 'top' | 'middle' | 'bottom'
  }
}
