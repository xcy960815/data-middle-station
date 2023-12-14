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
 * @desc 给表格中的字段添加排序功能
 * @param field {string} 字段名
 */
const handleEmitOrder = (field: string | undefined) => {
  if (!field) return;

}
/**
 * @desc 获取表格中的字段的样式
 * @param tableDataOption {Chart.ChartData} 表格数据
 * @param tableHeaderOption {TableChart.TableHeaderOption} 表头数据
 * @returns {string}
 */
const getComparedClass = (tableDataOption: Chart.ChartData, tableHeaderOption: TableChart.TableHeaderOption) => {
  return '';
}


const getTableRenderItem = (tableDataOption: Chart.ChartData, tableHeaderOption: TableChart.TableHeaderOption, idx: number) => {
  if (tableHeaderOption.alias) {
    return tableDataOption[tableHeaderOption.alias] !== undefined && tableDataOption[tableHeaderOption.alias] !== null ? tableDataOption[tableHeaderOption.alias] : ''
  } else if (tableHeaderOption.columnName) {
    return tableDataOption[tableHeaderOption.columnName] !== undefined && tableDataOption[tableHeaderOption.columnName] !== null ? tableDataOption[tableHeaderOption.columnName] : ''
  } else {
    return '';
  }
}
  /**
   * @desc 监听x轴、y轴字段变化
   * @returns {void}
   */
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

  /**
   * @desc 监听每页多少条数变化
   */
  watch(
    () => pageSize.value,
    () => {
      initTableData()
    }
  )
  /**
   * @desc 监听页码变化
   */
  watch(
    () => pageNum.value,
    () => {
      initTableData()
    }
  )

  /**
   * @desc 监听表格配置变化
   */
  watch(
    () => tableChartConfig.value,
    () => {
      console.log('table config change')
    },
    { deep: true }
  )
  /**
   * @desc  监听数据变化
   */
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
        field.displayName || field.alias || field.columnName || ''
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
    handleEmitOrder,
    getComparedClass,
    getTableRenderItem
  }
}
