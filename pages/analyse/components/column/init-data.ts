const NUMBER_ICON_NAME = 'ant-design:number-outlined'
const DATE_ICON_NAME = 'ant-design:calendar-outlined' //clarity:date-line
const STRING_ICON_NAME = 'ant-design:field-string-outlined'
/**
 * @see https://icon-sets.iconify.design/
 */
// <!-- 数字icon -->
// <!-- <Icon icon="ant-design:number-outlined" /> -->
// <!-- 日期icon -->
// <!-- <Icon icon="clarity:date-line" /> -->
// <!-- 字符串icon -->
// <!-- <Icon icon="ant-design:field-string-outlined" /> -->
export const initData = () => {
  /**
   * @description: 维度列样式
   * @returns { (column: ColumnStore.ColumnOption) => { column__item: boolean; column__item-choosed: boolean } }
   */
  const columnClasses = computed(
    () => (column: ColumnStore.ColumnOptionDto) => {
      const dimensionChoosed =
        useDimensionStore().getDimensions.find(
          (dimensionOption) =>
            dimensionOption.columnName === column.columnName
        )
      const groupChoosed = useGroupStore().getGroups.find(
        (groupOption) =>
          groupOption.columnName === column.columnName
      )
      return {
        column__item: true,
        column__item_dimension_choosed: dimensionChoosed,
        column__item_group_choosed: groupChoosed
      }
    }
  )

  /**
   * @desc icon name
   */
  const columnIconName = computed(
    () => (column: ColumnStore.ColumnOption) => {
      const { columnType } = column
      if (columnType === 'number') {
        return NUMBER_ICON_NAME
      } else if (columnType === 'date') {
        return DATE_ICON_NAME
      } else if (columnType === 'string') {
        return STRING_ICON_NAME
      } else {
        return ''
      }
    }
  )

  const columnStore = useColumnStore()

  /**
   * @desc 维度字段列表
   * @returns {ColumnStore.ColumnOption[]}
   */
  const columnList = computed(() => {
    return columnStore.getColumns
  })

  /**
   * @desc 当前列
   * @returns {ColumnStore.ColumnOption}
   */
  const currentColumn = ref<ColumnStore.ColumnOption>()

  return {
    columnClasses,
    columnIconName,
    columnList,
    currentColumn
  }
}
