export const initData = () => {
  /**
   * @description: 维度列样式
   * @returns {}
   */
  const columnClasses = computed(() => (column: ColumnStore.Column) => {
    return {
      column__item: true,
      'column__item-choosed': column.choosed,
    };
  });

  const columnStore = useColumnStore();

  /**
   * @desc 数据源
   */
  const dataSource = computed(() => {
    return columnStore.getDataSource
  });

  /**
   * @desc 数据源选项
   */
  const dataSourceOptions = computed(() => {
    return columnStore.getDataSourceOptions
  });

  /**
   * @desc 维度字段列表
   */
  const columnList = computed(() => {
    return columnStore.getColumns
  });

  const currentColumn = ref<ColumnStore.Column>();

  return {
    columnClasses,
    dataSource,
    dataSourceOptions,
    columnList,
    currentColumn,
  };
};
