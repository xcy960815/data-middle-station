export const initData = () => {
  /**
   * @description: 维度列样式
   */
  const columnClasses = computed(() => (column: ColumnStore.Column) => {
    return {
      column__item: true,
      'column__item-choosed': column.choosed,
    };
  });
  const columnStore = useColumnStore();

  const columnList = computed<ColumnStore.ColumnState['columns']>(() => {
    return columnStore.getColumns<'columns'>();
  });

  const currentColumn = ref<ColumnStore.Column>();
  return {
    columnClasses,
    columnList,
    currentColumn,
  };
};
