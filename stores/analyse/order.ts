export const useOrderStore = definePiniaStore<
  OrderStore.OrderKey,
  OrderStore.OrderState,
  OrderStore.OrderGetters<OrderStore.OrderState>,
  OrderStore.OrderActions
>('order', {
  state: () => ({
    orders: [],
  }),
  getters: {
    getOrders(state) {
      return state.orders;
    },
  },
  actions: {
    setOrders(orders) {
      this.orders = orders;
    },
    addOrders(orders) {
      this.orders.push(...orders);
    },
    updateOrder(order,index) {
      this.orders[index] = order;
    },
    removeOrder(index) {
      this.orders.splice(index, 1);
    },
  },
});
