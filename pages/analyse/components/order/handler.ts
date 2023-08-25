interface HandlerParams {
  orderList: Ref<Array<OrderStore.Order>>;
}

export const handler = ({ orderList }: HandlerParams) => {
  const orderStore = useOrderStore();
  /**
   * @desc addOrder
   * @param {OrderStore.Order|Array<OrderStore.Order>} orders
   */
  const addOrder = (order: OrderStore.Order | Array<OrderStore.Order>) => {
    order = Array.isArray(order) ? order : [order];
    orderStore.addOrder(order);
  };
  /**
   * @desc getTargetIndex
   * @param {number} index
   * @param {DragEvent} dragEvent
   * @returns {number}
   */
  const getTargetIndex = (index: number, dragEvent: DragEvent): number => {
    const dropY = dragEvent.clientY; // 落点Y
    let ys = [].slice
      .call(document.querySelectorAll('.sort__content > [data-action="drag"]'))
      .map(
        (element: HTMLDivElement) =>
          (element.getBoundingClientRect().top + element.getBoundingClientRect().bottom) / 2,
      );
    ys.splice(index, 1);
    let targetIndex = ys.findIndex((e) => dropY < e);
    if (targetIndex === -1) {
      targetIndex = ys.length;
    }
    return targetIndex;
  };

  /**
   * @desc dragstartHandler
   * @param {number} index
   * @param {DragEvent} dragEvent
   * @returns {void}
   */
  const dragstartHandler = (index: number, dragEvent: DragEvent) => {
    dragEvent.dataTransfer?.setData(
      'text',
      JSON.stringify({
        from: 'order',
        index,
        value: orderList.value[index],
      }),
    );
  };
  /**
   * @desc dragHandler
   * @param {number} index
   * @param {DragEvent} dragEvent
   * @returns {void}
   */
  const dragHandler = (index: number, dragEvent: DragEvent) => {
    dragEvent.preventDefault();
  };
  /**
   * @desc dragoverHandler
   * @param {DragEvent} dragEvent
   * @returns {void}
   */
  const dragoverHandler = (dragEvent: DragEvent) => {
    dragEvent.preventDefault();
    // dragEvent.dataTransfer.dropEffect = 'move';
  };
  /**
   * @desc dropHandler
   * @param {DragEvent} dragEvent
   * @returns {void}
   */
  const dropHandler = (dragEvent: DragEvent) => {
    dragEvent.preventDefault();
    const data = JSON.parse(dragEvent.dataTransfer?.getData('text') || '{}');
    const sorts = data.value;

    switch (data.from) {
      case 'order': {
        // relocate postion by dragging
        const targetIndex = getTargetIndex(data.index, dragEvent);
        if (targetIndex === data.index) return;
        const sorts = JSON.parse(JSON.stringify(orderStore.orders));
        const target = sorts.splice(data.index, 1)[0];
        sorts.splice(targetIndex, 0, target);
        orderStore.updateOrder(sorts);
        break;
      }
      default: {
        if (Array.isArray(sorts)) {
          addOrder(sorts);
        } else {
          addOrder(sorts);
        }
        break;
      }
    }
  };
  return {
    dragstartHandler,
    dragHandler,
    dragoverHandler,
    dropHandler,
  };
};
