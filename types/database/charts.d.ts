/**
 * @desc  表结构
 */
declare namespace ChartsModule {
  
  type ChartsMappingOption = {
    id?: number;
    name: string;
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
    filter?: Array<FilterStore.FilterOption>;
    group?: Array<GroupStore.GroupOption>;
    dimension?: Array<DimensionStore.DimensionOption>;
    order?: Array<OrderStore.OrderOption>;
    createTime?: string;
    updateTime?: string;
    visits?: number;
  }

  type ChartsOption = ChartsParamsOption & {
    id:number
    filter: Array<FilterStore.FilterOption>;
    group: Array<GroupStore.GroupOption>;
    dimension: Array<DimensionStore.DimensionOption>;
    order: Array<OrderStore.OrderOption>;
    createTime: string;
    updateTime: string;
    visits: number;
  }
}
