

declare namespace FilterStore {

  type FilterKey = 'filter'

  const FilterAggregationsEnum = {
    原始值: 'raw',
    计数: 'count',
    计数去重: 'countDistinct',
    总计: 'sum',
    平均: 'avg',
    最大值: 'max',
    最小值: 'min',
  } as const

  const FilterTypeEnums = {
    "等于": "eq",
    "不等于": "neq",
    "大于": "gt",
    "大于等于": "gte",
    "小于": "lt",
    "小于等于": "lte",
    "包含": "like",
    "不包含": "notLike",
    "为空": "isNull",
    "不为空": "isNotNull"
  } as const

  type FilterType = (typeof FilterTypeEnums)[keyof typeof FilterTypeEnums]

  type FilterAggregationsType = typeof FilterAggregationsEnum[keyof typeof FilterAggregationsEnum]

  type FilterOption = ColumnStore.Column & {
    filterType?: FilterType
    filterValue?: string
    displayName?: string
    // 聚合方式
    aggregationType: FilterAggregationsType
  }

  type FilterState = {
    filters: Array<FilterOption>
  }

  /**
   * @desc getter 名称
   */
  type GetterName<T extends string> = `get${Capitalize<T>}`;

  /**
   * @desc getter
   */
  type FilterGetters<S> = {
    [K in keyof S as GetterName<K & string>]: (state: S) => S[K];
  };

  /**
   * @desc action 名称
   */
  type ActionName<T extends string> = `set${Capitalize<T>}` | `add${Capitalize<T>}`
  /**
   * @desc action
   */
  type FilterActions = {
    [K in keyof FilterState as ActionName<K & string>]: (value: FilterState[K]) => void;
  } & {
    removeFilter: (value: number) => void;
  }
}
