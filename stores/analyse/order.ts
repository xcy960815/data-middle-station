/**
 * @desc 排序 store
 */
interface OrderOption {
  label: string
  value: string
}

import { defineStore } from 'pinia'

export const useOrderStore = defineStore<
  OrderStore.OrderKey,
  BaseStore.State<OrderStore.OrderState>,
  BaseStore.Getters<
    OrderStore.OrderState,
    OrderStore.OrderGetters
  >,
  BaseStore.Actions<
    OrderStore.OrderState,
    OrderStore.OrderActions
  >
>('order', {
  state: () => ({
    orders: []
  }),
  getters: {
    getOrders(state) {
      return state.orders
    }
  },
  actions: {
    setOrders(orders) {
      this.orders = orders
    },
    /**
     * @desc 添加排序
     * @param orders {OrderOption[]}
     * @returns {void}
     */
    addOrders(orders: OrderOption[]) {
      this.orders.push(...orders)
    },
    /**
     * @desc 更新排序
     * @param order {OrderOption}
     * @param index {number}
     * @returns {void}
     */
    updateOrder(order: OrderOption, index: number) {
      this.orders[index] = order
    },
    /**
     * @desc 删除排序
     * @param index {number}
     * @returns {void}
     */
    removeOrder(index: number) {
      this.orders.splice(index, 1)
    }
  }
})
