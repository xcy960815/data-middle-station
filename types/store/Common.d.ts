/**
 * @description: 分析模块公共类型
 */
type DragData<V = ColumnsStore.ColumnOptions> = {
  from: 'measures' | 'orders' | 'filters' | 'groups' | 'columns'
  index: number
  // value: MeasureStore.MeasureOption | FilterStore.FilterOption | OrderStore.OrderOption | GroupStore.GroupOption | ColumnsStore.ColumnOptions
  value: V
}
