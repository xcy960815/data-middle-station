/**
 * @desc  表结构
 */
declare namespace ChartsModule {


  const ChartTypesEnums = {
    table: 'table',
    line: 'line',
    pie: 'pie',
    interval: 'interval'
  } as const

  /**
   * @desc 图表类型
   */
  type ChartType = (typeof ChartTypesEnums)[keyof typeof ChartTypesEnums]
  
  type ChartsMappingOption = {
    id: number;
    chartName: string;
    tableName?: string;
    chartType?: string;
    filter?: (value: string) => Array<FilterStore.FilterOption>;
    group?: (value: string) => Array<GroupStore.GroupOption>;
    dimension?: (value: string) => Array<DimensionStore.DimensionOption>;
    order?: (value: string) => Array<OrderStore.OrderOption>;
    createTime?: string;
    updateTime?: string;
    visits?: number;
  }

  type ChartsParamsOption = {
    id?: number;
    chartName: string;
    tableName?: string;
    filter?: Array<FilterStore.FilterOption>;
    group?: Array<GroupStore.GroupOption>;
    dimension?: Array<DimensionStore.DimensionOption>;
    order?: Array<OrderStore.OrderOption>;
    createTime?: string;
    updateTime?: string;
    visits?: number;
    chartType?: ChartType;
  }

  type ChartsOption =  {
    id:number
    chartName: string;
    tableName: string;
    filter: Array<FilterStore.FilterOption>;
    group: Array<GroupStore.GroupOption>;
    dimension: Array<DimensionStore.DimensionOption>;
    order: Array<OrderStore.OrderOption>;
    createTime: string;
    updateTime: string;
    visits: number;
    chartType: ChartType;
  }
}
