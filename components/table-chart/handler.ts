/**
 *@desc chart-table 组件的逻辑处理
 *@param {TableChart.HandlerParams} params
 */
export const handler = ({
  pageNum,
  pageSize,
  props,
  tableHeaderState,
  tableDataState,
  tableChartConfig
}: TableChart.HandlerParams) => {
  /**
   * @desc 表格单元格样式
   * @param {TableChart.CellStyleParams} params
   * @returns CssProperties
   */
  const cellStyle = ({
    row,
    column
  }: TableChart.CellStyleParams) => {
    return {}
  }
  /**
   * @desc 表格列格式化
   * @param {TableChart.DataOption} row
   * @param {TableChart.TableColumn} column
   * @param {number|string} cellValue
   * @param {number} index
   * @returns
   */
  const tableColumnFormatter = (
    row: Chart.ChartData,
    column: TableChart.TableColumn,
    cellValue: number | string,
    index: number
  ) => {
    // console.log(row, column, cellValue, index);
    return cellValue
  }
  /**
   * @desc 表格合并
   * @param {TableChart.SpanMethodProps} param
   * @returns {number[]|void}
   */
  const spanMethod = ({
    row,
    column,
    rowIndex,
    columnIndex
  }: TableChart.SpanMethodProps) => {
    if (rowIndex % 2 === 0) {
      if (columnIndex === 0) {
        return [1, 2]
      } else if (columnIndex === 1) {
        return [0, 0]
      }
    }
  }

  watch(
    () => [props.xAxisFields, props.yAxisFields],
    () => {
      initTableData()
      initTableHeader()
    },
    {
      deep: true
    }
  )

  watch(
    () => pageSize.value,
    () => {
      initTableData()
    }
  )

  watch(
    () => pageNum.value,
    () => {
      initTableData()
    }
  )

  watch(
    () => tableChartConfig.value,
    () => {
      console.log('table config change')
    },
    { deep: true }
  )

  watch(() => props.data, () => {
    initTableData()
    initTableHeader()
  }, { deep: true })
  /**
   * @desc 初始化表头
   * @returns {void}
   */
  const initTableHeader = () => {
    const fields = [
      ...props.xAxisFields,
      ...props.yAxisFields
    ]
    tableHeaderState.tableHeader = fields.map((field) => {
      const currentColumnData =
        tableDataState.tableData.map((item) =>
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
  }
  /**
   * @desc 初始化表格数据
   * @returns {void}
   */
  const initTableData = () => {
    tableDataState.tableData = props.data
      .map((item) => {
        return {
          ...item
        }
      })
      .slice(
        (pageNum.value - 1) * pageSize.value,
        pageNum.value * pageSize.value
      )
    if (tableChartConfig.value.showCompare) {
      // 在第二条数据开始插入数据 处理字段为数字类型 的数据 变成
    }
  }

  onMounted(() => {
    initTableHeader()
    initTableData()
  })


  return {
    cellStyle,
    tableColumnFormatter,
    spanMethod
  }
}
