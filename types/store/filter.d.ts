/**
 * @description: 过滤器 store
 */
declare namespace FilterStore {
  /**
   * @desc 过滤器key
   */
  type FilterKey = 'filter'

  /**
   * @desc 过滤器聚合方式
   */
  const FilterAggregationsEnum = {
    原始值: 'raw',
    计数: 'count',
    计数去重: 'countDistinct',
    总计: 'sum',
    平均: 'avg',
    最大值: 'max',
    最小值: 'min'
  } as const

  /**
   * @desc 过滤器类型
   */
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

  /**
   * @desc 过滤器类型
   */
  type FilterType = (typeof FilterTypeEnums)[keyof typeof FilterTypeEnums]

  /**
   * @desc 过滤器聚合方式
   */
  type FilterAggregationType = (typeof FilterAggregationsEnum)[keyof typeof FilterAggregationsEnum]

  /**
   * @desc 过滤器选项
   */
  type FilterOption = ColumnStore.ColumnOption & {
    filterType?: FilterType
    filterValue?: string
    displayName?: string
    /**
     * 聚合方式
     */
    aggregationType: FilterAggregationType
  }

  /**
   * @desc 过滤器状态
   */
  type FilterState = {
    filters: Array<FilterOption>
  }
  /**
   * @desc getter
   */
  type FilterGetters = {}

  /**
   * @desc 过滤器操作
   */
  type FilterActions = {
    addFilters: (filters: FilterOption[]) => void
    removeFilter: (index: number) => void
  }
}
