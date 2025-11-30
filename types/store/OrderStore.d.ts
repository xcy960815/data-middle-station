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
   * @interface OrderOption
   * @property {string} name 列名
   * @property {string} comment 列注释
   * @property {string} type 列类型
   */
  type OrderOption = ColumnsStore.ColumnOption & {
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
