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
  type OrderTypeEnums = AnalyzeConfigVo.OrderTypeEnums

  type OrderType = AnalyzeConfigVo.OrderType

  /**
   * @desc 排序聚合方式
   */
  type OrderAggregationsEnum = AnalyzeConfigVo.OrderAggregationsEnum

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
  type OrderOption = ColumnsStore.ColumnOptions & {
    orderRule: import('@/shared/analyzeFieldRules').OrderRule
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
  type OrderGetters = {
    getOrders: (state: OrderState) => OrderOption[]
  }

  /**
   * @desc 排序操作
   */
  type OrderActions = {
    setOrders: (orders: OrderOption[]) => void
    updateOrder: (params: { order: OrderOption; index: number }) => void
    addOrders: (orders: OrderOption[]) => void
    removeOrder: (index: number) => void
  }
}
