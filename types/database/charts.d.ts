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


  type ChartType = (typeof ChartTypesEnums)[keyof typeof ChartTypesEnums]
  
  type ChartsMappingOption = {
    id: number;
    name: string;
    tbName?: string;
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
    name: string;
    tbName?: string;
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
    name: string;
    tbName: string;
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
