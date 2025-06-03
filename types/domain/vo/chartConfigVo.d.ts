declare namespace ChartConfigVo {
  type ColumnOption = DatabaseVo.TableColumnOptionVo

  type DimensionOption = DatabaseVo.TableColumnOptionVo & {
    __invalid?: boolean
  }

  const FilterAggregationsEnum = {
    原始值: 'raw',
    计数: 'count',
    计数去重: 'countDistinct',
    总计: 'sum',
    平均: 'avg',
    最大值: 'max',
    最小值: 'min'
  } as const

  const FilterTypeEnums = {
    等于: 'eq',
    不等于: 'neq',
    大于: 'gt',
    大于等于: 'gte',
    小于: 'lt',
    小于等于: 'lte',
    包含: 'like',
    不包含: 'notLike',
    为空: 'isNull',
    不为空: 'isNotNull'
  } as const

  type FilterType =
    (typeof FilterTypeEnums)[keyof typeof FilterTypeEnums]

  type FilterAggregationsType =
    (typeof FilterAggregationsEnum)[keyof typeof FilterAggregationsEnum]

  interface FilterOption extends ColumnOption {
    filterType?: FilterType
    filterValue?: string
    displayName?: string
    // 聚合方式
    aggregationType: FilterAggregationsType
  }

  type GroupOption = DatabaseVo.TableColumnOptionVo & {
    __invalid?: boolean
  }

  const OrderTypeEnums = {
    升序: 'asc',
    降序: 'desc'
  } as const

  type OrderType =
    (typeof OrderTypeEnums)[keyof typeof OrderTypeEnums]

  const OrderAggregationsEnum = {
    原始值: 'raw',
    计数: 'count',
    总计: 'sum',
    平均: 'avg',
    最大值: 'max',
    最小值: 'min'
  } as const

  type OrderAggregationsType =
    (typeof OrderAggregationsEnum)[keyof typeof OrderAggregationsEnum]
  /**
   * @desc 左侧列字段
   * @interface OrderOption
   * @property {string} name 列名
   * @property {string} comment 列注释
   * @property {string} type 列类型
   */
  interface OrderOption extends ColumnOption {
    orderType: OrderType
    aggregationType: OrderAggregationsType
  }

  interface ChartConfig {
    id: number
    dataSource: string
    chartType: string
    column: ColumnOption[]
    dimension: DimensionOption[]
    filter: FilterOption[]
    group: GroupOption[]
    order: OrderOption[]
    limit: number
    createTime: string
    updateTime: string
  }
}
