/// <reference path="./commom.d.ts" />
/**
 * @desc 左侧列字段
 */
declare namespace OrderStore {
  type OrderKey = 'sort'
  /**
   * @desc 左侧列字段
   * @interface Order
   * @property {string} name 列名
   * @property {string} comment 列注释
   * @property {string} type 列类型
   */
  interface Order extends FieldOption {}

  interface OrderState {
    orders: Order[]
  }

  interface OrderGetters
    extends Record<
      `get${Capitalize<keyof OrderState>}`,
      (
        state: OrderState
      ) => <
        K extends string & keyof OrderState
      >() => OrderState[K]
    > {}

  interface OrderActions {
    updateOrder: (orders: Order[]) => void
    addOrder: (orders: Order[]) => void
    removeOrder: (index: number) => void
  }
}
