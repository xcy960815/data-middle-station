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

  /**
   * @desc 数据源
   */
  const dataSource =  computed<ColumnStore.ColumnState['dataSource']>(()=>{
    return columnStore.getDataSource<'dataSource'>()
  });

  /**
   * @desc 数据源选项
   */
  const dataSourceOptions =  computed<ColumnStore.ColumnState['dataSourceOptions']>(() =>{
    return  columnStore.getDataSourceOptions<'dataSourceOptions'>()
  });

  const columnList = computed<ColumnStore.ColumnState['columns']>(() => {
    return columnStore.getColumns<'columns'>();
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
