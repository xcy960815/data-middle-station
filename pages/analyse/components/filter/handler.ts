interface HandlerParams {
  filterList: Ref<Array<FilterStore.FilterOption>>;
}

export const handler = ({ filterList }: HandlerParams) => {
  const filterStore = useFilterStore();
  /**
   * @desc addFilter
   * @param filter {FilterStore.FilterOption | Array<FilterStore.FilterOption>}
   * @returns {void}
   */
  const addFilter = (filter: FilterStore.FilterOption | Array<FilterStore.FilterOption>) => {
    filter = Array.isArray(filter) ? filter : [filter];
    filterStore.addFilters(filter);
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
      .call(document.querySelectorAll('.filter__content > [data-action="drag"]'))
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
        from: 'filter',
        index,
        value: filterList.value[index],
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
    const data: DragData = JSON.parse(dragEvent.dataTransfer?.getData('text') || '{}');
    const filters = data.value;
    switch (data.from) {
      case 'filter': {
        // relocate postion by dragging
        const targetIndex = getTargetIndex(data.index, dragEvent);
        if (targetIndex === data.index) return;
        const filters = JSON.parse(JSON.stringify(filterStore.filters));
        const target = filters.splice(data.index, 1)[0];
        filters.splice(targetIndex, 0, target);
        filterStore.setFilters(filters);
        break;
      }
      default: {
        if (Array.isArray(filters)) {
          addFilter(filters);
        } else {
          addFilter(filters);
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
