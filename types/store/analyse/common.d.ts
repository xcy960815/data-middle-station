/**
 * @description: 分析模块公共类型
 */
interface DragData {
  from:
    | 'dimension'
    | 'order'
    | 'filter'
    | 'group'
    | 'column'
  index: number
  value: DimensionStore.DimensionOption | FilterStore.FilterOption | OrderStore.OrderOption | GroupStore.GroupOption | ColumnStore.Column
}
