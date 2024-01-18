interface HandlerParams {
  groupList: Ref<Array<GroupStore.GroupOption>>;
}

export const handler = ({ groupList }: HandlerParams) => {
  const columnStore = useColumnStore();
  const groupStore = useGroupStore();
  /**
   * @desc addGroup
   * @param {GroupStore.GroupOption|Array<GroupStore.GroupOption>} groups
   */
  const addGroup = (group: GroupStore.GroupOption | Array<GroupStore.GroupOption>) => {
    group = Array.isArray(group) ? group : [group];
    groupStore.addGroups(group);
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
      .call(document.querySelectorAll('.group__content > [data-action="drag"]'))
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
        from: 'group',
        index,
        value: groupList.value[index],
      }),
    );
  };
  /**
   * @desc dragHandler
   * @param {number} index
   * @param {DragEvent} dragEvent
   * @returns {void}
   */
  const dragHandler = (_index: number, dragEvent: DragEvent) => {
    dragEvent.preventDefault();
  };
  /**
   * @desc dragoverHandler
   * @param {DragEvent} dragEvent
   * @returns {void}
   */
  const dragoverHandler = (dragEvent: DragEvent) => {
    dragEvent.preventDefault();
  };
  /**
   * @desc dropHandler
   * @param {DragEvent} dragEvent
   * @returns {void}
   */
  const dropHandler = (dragEvent: DragEvent) => {
    dragEvent.preventDefault();
    const data: DragData = JSON.parse(dragEvent.dataTransfer?.getData('text') || '{}');
    const group = data.value;
    const cloumn = data.value;
    const index = data.index;
    switch (data.from) {
      case 'group': {
        // relocate postion by dragging
        const targetIndex = getTargetIndex(data.index, dragEvent);
        if (targetIndex === data.index) return;
        const groups = JSON.parse(JSON.stringify(groupStore.getGroups));
        const target = groups.splice(data.index, 1)[0];
        groups.splice(targetIndex, 0, target);
        groupStore.setGroups(groups);
        break;
      }
      default: {
        // group.groupChoosed = true;
        // 更新列名 主要是显示已经选中的标志
        columnStore.updateColumn(cloumn, index);
        addGroup(group);
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
