interface HandlerParams {
  dimensionList: Ref<Array<DimensionStore.DimensionOption>>;
}

export const handler = ({ dimensionList }: HandlerParams) => {
  const columnStore = useColumnStore();
  const dimensionStore = useDimensionStore();
  /**
   * @desc addDimension
   * @param {DimensionStore.DimensionOption|Array<DimensionStore.DimensionOption>} dimensions
   */
  const addDimension = (dimension: DimensionStore.DimensionOption | Array<DimensionStore.DimensionOption>) => {
    dimension = Array.isArray(dimension) ? dimension : [dimension];
    dimensionStore.addDimensions(dimension);
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
      .call(document.querySelectorAll('.dimension__content > [data-action="drag"]'))
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
   * @desc 发起拖拽
   * @param {number} index
   * @param {DragEvent} dragEvent
   * @returns {void}
   */
  const dragstartHandler = (index: number, dragEvent: DragEvent) => {
    dragEvent.dataTransfer?.setData(
      'text',
      JSON.stringify({
        from: 'dimension',
        index,
        value: dimensionList.value[index],
      }),
    );
  };
  /**
   * @desc 结束拖拽
   * @param {number} index
   * @param {DragEvent} dragEvent
   * @returns {void}
   */
  const dragHandler = (index: number, dragEvent: DragEvent) => {
    dragEvent.preventDefault();
  };
  /**
   * @desc 拖拽开始
   * @param {DragEvent} dragEvent
   * @returns {void}
   */
  const dragoverHandler = (dragEvent: DragEvent) => {
    dragEvent.preventDefault();
  };
  /**
   * @desc 拖拽结束
   * @param {DragEvent} dragEvent
   * @returns {void}
   */
  const dropHandler = (dragEvent: DragEvent) => {
    dragEvent.preventDefault();
    // get drag data
    const data: DragData = JSON.parse(dragEvent.dataTransfer?.getData('text') || '{}');
    const dimension = data.value;
    const cloumn = data.value;
    const index = data.index;
    switch (data.from) {
      case 'dimension':
        // 移动位置
        const targetIndex = getTargetIndex(data.index, dragEvent);
        if (targetIndex === data.index) return;
        const dimensions = JSON.parse(JSON.stringify(dimensionStore.dimensions));
        const target = dimensions.splice(data.index, 1)[0];
        dimensions.splice(targetIndex, 0, target);
        dimensionStore.setDimensions(dimensions);
        break;
      default:
        dimension.choosed = true;
        // 更新列名 主要是显示已经选中的标志
        columnStore.updateColumn(cloumn, index);
        addDimension(dimension);
        break;
    }
  };
  return {
    dragstartHandler,
    dragHandler,
    dragoverHandler,
    dropHandler,
  };
};
