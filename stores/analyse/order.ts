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
    // addOrder(sort) {
    //   this.orders = this.orders.concat(sort);
    // },
    setOrders(orders) {
      this.orders = orders;
    },
    // removeOrder(index) {
    //   this.orders.splice(index, 1);
    // },
  },
});
