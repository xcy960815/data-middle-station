/**
 * @description: 分析模块公共类型
 */
type DragData<V = ColumnsStore.ColumnOption> = {
  from: 'dimensions' | 'orders' | 'filters' | 'groups' | 'columns'
  index: number
  // value: DimensionStore.DimensionOption | FilterStore.FilterOption | OrderStore.OrderOption | GroupStore.GroupOption | ColumnsStore.ColumnOption
  value: V
}
