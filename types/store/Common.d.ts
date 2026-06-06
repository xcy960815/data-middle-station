/**
 * @description: 分析模块公共类型
 */
type AnalyzeFieldRole = 'measures' | 'orders' | 'filters' | 'dimensions'

type AnalyzeFieldSource = AnalyzeFieldRole | 'columns'

type AnalyzeFieldOptionMap = {
  columns: ColumnsStore.ColumnOptions
  measures: MeasureStore.MeasureOption
  orders: OrderStore.OrderOption
  filters: FilterStore.FilterOption
  dimensions: DimensionStore.DimensionOption
}

type AnalyzeFieldOption = AnalyzeFieldOptionMap[AnalyzeFieldSource]

type DragData<V = AnalyzeFieldOption> = {
  from: AnalyzeFieldSource
  index: number
  value: V
}
