declare namespace ChartsConfigDto {
  type ChartsConfigDto = {
    id: number
    chartName: string
    chartType: string
    chartConfigId: number
    chartConfig: {
      dataSource: string
      column: ChartConfigDao.ColumnOption[]
      dimension: ChartConfigDao.DimensionOption[]
      filter: ChartConfigDao.FilterOption[]
      group: ChartConfigDao.GroupOption[]
      order: ChartConfigDao.OrderOption[]
    }
  }
}
