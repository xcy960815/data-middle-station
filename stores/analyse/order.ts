export const useOrderStore = definePiniaStore<
  OrderStore.OrderKey,
  OrderStore.OrderState,
  OrderStore.OrderGetters,
  OrderStore.OrderActions
>('sort', {
  state: () => ({
    orders: [],
  }),
  getters: {
    getOrders(state) {
      return () => {
        return state.orders;
      };
    },
  },
  actions: {
    addOrder(sort) {
      this.orders = this.orders.concat(sort);
    },
    updateOrder(orders) {
      this.orders = orders;
    },
    removeOrder(index) {
      this.orders.splice(index, 1);
    },
  },
});
