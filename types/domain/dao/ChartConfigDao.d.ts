/**
 * 图表配置
 */
declare namespace ChartConfigDao {
  /**
   * 列配置
   */
  type ColumnOption = DatabaseDao.TableColumnOption

  /**
   * 维度配置
   */
  type DimensionOption = ColumnOption & {
    __invalid?: boolean
  }

  /**
   * 过滤聚合方式
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
   * 过滤类型
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
   * 过滤类型
   */
  type FilterType = (typeof FilterTypeEnums)[keyof typeof FilterTypeEnums]

  /**
   * 过滤聚合方式
   */
  type FilterAggregationsType = (typeof FilterAggregationsEnum)[keyof typeof FilterAggregationsEnum]

  /**
   * 过滤配置
   */
  type FilterOption = ColumnOption & {
    filterType?: FilterType
    filterValue?: string
    displayName?: string
    // 聚合方式
    aggregationType: FilterAggregationsType
  }

  /**
   * 分组配置
   */
  type GroupOption = DatabaseDao.TableColumnOption & {
    __invalid?: boolean
  }

  /**
   * 排序类型
   */
  const OrderTypeEnums = {
    升序: 'asc',
    降序: 'desc'
  } as const

  type OrderType = (typeof OrderTypeEnums)[keyof typeof OrderTypeEnums]

  /**
   * 排序聚合方式
   */
  const OrderAggregationsEnum = {
    原始值: 'raw',
    计数: 'count',
    总计: 'sum',
    平均: 'avg',
    最大值: 'max',
    最小值: 'min'
  } as const

  /**
   * 排序聚合方式
   */
  type OrderAggregationsType = (typeof OrderAggregationsEnum)[keyof typeof OrderAggregationsEnum]

  /**
   * 排序配置
   */
  type OrderOption = ColumnOption & {
    /**
     * 排序类型
     */
    orderType: OrderType
    /**
     * 聚合方式
     */
    aggregationType: OrderAggregationsType
  }

  /**
   * 图表配置
   */
  type ChartConfig = {
    /**
     * 图表id
     */
    id: number
    /**
     * 数据源
     */
    dataSource: string | null
    /**
     * 图表类型
     */
    chartType: string
    /**
     * 列配置
     */
    column: ColumnOption[]
    /**
     * 维度配置
     */
    dimension: DimensionOption[]
    /**
     * 过滤配置
     */
    filter: FilterOption[]
    /**
     * 分组配置
     */
    group: GroupOption[]
    /**
     * 排序配置
     */
    order: OrderOption[]
    /**
     * 限制
     */
    limit: number
    /**
     * 更新时间
     */
    updateTime: string
    /**
     * 创建时间
     */
    createTime: string
    /**
     * 创建人
     */
    createdBy: string
    /**
     * 更新人
     */
    updatedBy: string
    /**
     * 是否删除：0-未删除，1-已删除
     */
    isDeleted?: number
  }
}
