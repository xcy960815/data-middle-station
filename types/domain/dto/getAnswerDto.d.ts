declare namespace GetAnswerDto {
  interface GetAnswerParamsDto {
    dataSource: string
    filters: Array<FilterStore.FilterOptionDto>
    orders: Array<OrderStore.OrderOptionDto>
    groups: Array<GroupStore.GroupOptionDto>
    dimensions: Array<DimensionStore.DimensionOption>
    limit: number
  }
}
