declare namespace CanvasTable {
  type GroupOption = GroupStore.GroupOption & {
    width: number
    colIndex: number
    align: 'left' | 'right' | 'center'
    verticalAlign: 'top' | 'middle' | 'bottom'
  }

  type DimensionOption = DimensionStore.DimensionOption & {
    width: number
    colIndex: number
    align: 'left' | 'right' | 'center'
    verticalAlign: 'top' | 'middle' | 'bottom'
  }
}
