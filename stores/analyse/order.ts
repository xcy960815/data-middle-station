/**
 * @desc 排序 store
 */
interface OrderOption {
  label: string
  value: string
}

interface OrderState {
  orders: OrderOption[]
}

export const useOrderStore = defineStore('order', {
  state: (): OrderState => ({
    orders: []
  }),
  getters: {
    getOrders(state): OrderOption[] {
      return state.orders
    }
  },
  actions: {
    /**
     * @desc 设置排序
     * @param orders {OrderOption[]}
     * @returns {void}
     */
    setOrders(orders: OrderOption[]) {
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
