/**
 * @description: 分析模块公共类型
 */
type DragData<V = ColumnsStore.ColumnOptions> = {
  from: 'measures' | 'orders' | 'filters' | 'dimensions' | 'columns'
  index: number
  // value: MeasureStore.MeasureOption | FilterStore.FilterOption | OrderStore.OrderOption | DimensionStore.DimensionOption | ColumnsStore.ColumnOptions
  value: V
}
