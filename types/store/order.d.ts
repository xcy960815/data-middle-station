/**
 * @desc 左侧列字段
 */
declare namespace OrderStore {
  /**
   * @desc 排序key
   */
  type OrderKey = 'order'

  /**
   * @desc 排序类型
   */
  const OrderTypeEnums = {
    升序: 'asc',
    降序: 'desc',
    无: null
  } as const

  type OrderType = (typeof OrderTypeEnums)[keyof typeof OrderTypeEnums]

  /**
   * @desc 排序聚合方式
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
   * @desc 排序聚合方式
   */
  type OrderAggregationsType = (typeof OrderAggregationsEnum)[keyof typeof OrderAggregationsEnum]
  /**
   * @desc 左侧列字段
   * @interface OrderOption
   * @property {string} name 列名
   * @property {string} comment 列注释
   * @property {string} type 列类型
   */
  type OrderOption = ColumnStore.ColumnOption & {
    orderType: OrderType | null
    aggregationType?: OrderAggregationsType
    __invalid?: boolean | null
    __invalidMessage?: string | null
  }

  /**
   * @desc 排序状态
   */
  type OrderState = {
    orders: OrderOption[]
  }
  /**
   * @desc getter
   */
  type OrderGetters = {}

  /**
   * @desc 排序操作
   */
  type OrderActions = {
    updateOrder: ({ order: OrderOption, index: number }) => void
  } & {
    addOrders: (orders: OrderOption[]) => void
    removeOrder: (index: number) => void
  }
}
