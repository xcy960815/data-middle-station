/**
 * @desc 初始化 table-chart 组件的数据
 * @param {TableChartModule.InitDataParams} props
 * @returns {TableChartModule.InitDataReturn}
 */
export const initData = (
  props: TableChartModule.InitDataParams
) => {
  const pageNum = ref(1)
  const pageSize = ref(10)

  const total = computed(() => {
    return props.data.length
  })

  const tableHeader = computed<
    TableChartModule.TableHeaderItem[]
  >(() => {
    // 获取当前表格的所有字段
    const fields = [
      ...props.xAxisFields,
      ...props.yAxisFields
    ]
    const tableHeader = fields.map((field) => {
      const currentColumnData = tableData.value.map(
        (item) =>
          String(item[field.alias ? field.alias : ''])
      )
      currentColumnData.push(
        field.displyName || field.alias || field.name
      )
      return {
        ...field,
        minWidth: props.autoWidth
          ? getMaxLength(currentColumnData) + 64
          : undefined
      }
    })

    return tableHeader
  })

  const tableData = computed(() => {
    return props.data
      .map((item) => {
        return {
          ...item
        }
      })
      .slice(
        (pageNum.value - 1) * pageSize.value,
        pageNum.value * pageSize.value
      )
  })

  return {
    pageNum,
    pageSize,
    total,
    tableHeader,
    tableData
  }
}
