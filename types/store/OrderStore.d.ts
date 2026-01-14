/**
 * @desc 左侧列字段
 */
declare namespace OrderStore {
  /**
   * @desc 排序key
   */
  type OrderKey = 'orders'

  /**
   * @desc 排序类型
   */
  const OrderTypeEnums: typeof AnalyzeConfigVo.OrderTypeEnums

  type OrderType = AnalyzeConfigVo.OrderType

  /**
   * @desc 排序聚合方式
   */
  const OrderAggregationsEnum: typeof AnalyzeConfigVo.OrderAggregationsEnum

  /**
   * @desc 排序聚合方式
   */
  type OrderAggregationsType = AnalyzeConfigVo.OrderAggregationsType
  /**
   * @desc 左侧列字段
   * @interface OrderOptions
   * @property {string} name 列名
   * @property {string} comment 列注释
   * @property {string} type 列类型
   */
  type OrderOptions = ColumnsStore.ColumnOptions & {
    orderType: OrderType
    aggregationType?: OrderAggregationsType
    __invalid?: boolean | null
    __invalidMessage?: string | null
  }

  /**
   * @desc 排序状态
   */
  type OrderState = {
    orders: OrderOptions[]
  }
  /**
   * @desc getter
   */
  type OrderGetters = {}

  /**
   * @desc 排序操作
   */
  type OrderActions = {
    updateOrder: ({ order: OrderOptions, index: number }) => void
  } & {
    addOrders: (orders: OrderOptions[]) => void
    removeOrder: (index: number) => void
  }
}
