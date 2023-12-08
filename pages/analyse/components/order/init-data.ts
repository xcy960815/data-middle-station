export const initData = () => {
  const orderStore = useOrderStore();
  /**
   * @desc orderList
   */
  const orderList = computed<OrderStore.OrderState['orders']>(() => {
    return orderStore.getOrders;
  });
  return {
    orderList,
  };
};
