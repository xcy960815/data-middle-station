declare namespace GetAnswerDto {
  interface GetAnswerParamsDto {
    dataSource: string
    filters: Array<FilterStore.FilterOption>
    orders: Array<OrderStore.OrderOption>
    groups: Array<GroupStore.GroupOption>
    dimensions: Array<DimensionStore.DimensionOption>
    limit: number
  }
}
