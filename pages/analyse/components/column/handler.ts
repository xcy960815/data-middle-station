interface HandlerParams {
  currentColumn: Ref<ColumnStore.Column | undefined>;
}

export const handler = ({ currentColumn }: HandlerParams) => {
  /**
   * @desc 发起拖拽
   * @param {ColumnStore.Column} column
   * @param {number} index
   * @param {DragEvent} event
   * @return {void}
   */
  const dragstartHandler = (column: ColumnStore.Column, index: number, event: DragEvent) => {
    event.dataTransfer?.setData(
      'text/plain',
      JSON.stringify({
        from: 'column',
        type: 'single',
        value: column,
      }),
    );
  };
  /**
   * @desc 拖拽结束
   * @param {DragEvent} event
   */
  const dragendHandler = (event: DragEvent) => {
    // 阻止默认事件
    event.preventDefault();
  };
  /**
   * @desc 拖拽进入
   * @param {DragEvent} dragEvent
   */
  const dragoverHandler = (dragEvent: DragEvent) => {
    dragEvent.preventDefault();
  };
  /**
   * @desc 拖拽结束
   * @param {DragEvent} dragEvent
   */
  const dropHandler = (dragEvent: DragEvent) => {
    dragEvent.preventDefault();
    const data: DragData = JSON.parse(dragEvent.dataTransfer?.getData('text') || '{}');

    switch (data.from) {
      case 'dimension':
        const dimensionSrore = useDimensionStore();
        dimensionSrore.removeDimension(data.index);
        break;
      case 'filter':
        const filterStore = useFilterStore();
        filterStore.removeFilter(data.index);
        break;
      case 'order':
        const orderStore = useOrderStore();
        orderStore.removeOrder(data.index);
        break;
      case 'group':
        const groupStore = useGroupStore();
        groupStore.removeGroup(data.index);
        break;
      default:
        console.error('未知拖拽类型', data.from);
        break;
    }
  };

  const contextmenuHandler = (column: ColumnStore.Column) => {
    currentColumn.value = column;
  };

  const setDataModel = () => {
    console.log('column', currentColumn.value);
  };

  return {
    dragstartHandler,
    dragendHandler,
    contextmenuHandler,
    setDataModel,
    dragoverHandler,
    dropHandler,
  };
};
