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
  const orderStore = useOrderStore();
  const chartsConfigStore = useChartConfigStore();
  /**
   * @desc 给表格中的字段添加排序功能
   * @param field {string} 字段名
   */
  const handleEmitOrder = (tableHeaderOption: TableChart.TableHeaderOption) => {
    if (tableHeaderOption.orderType === 'default') {
      tableHeaderOption.orderType = 'asc'
    } else if (tableHeaderOption.orderType === 'asc') {
      tableHeaderOption.orderType = 'desc'
    } else if (tableHeaderOption.orderType === 'desc') {
      tableHeaderOption.orderType = 'default'
    }
    const order = orderStore.getOrders.find(o => o.columnName === tableHeaderOption.columnName);
    const orderIndex = orderStore.getOrders.findIndex(o => o.columnName === tableHeaderOption.columnName);
    if (order && tableHeaderOption.orderType == 'default') {
      orderStore.removeOrder(orderIndex);
    } else if (order && tableHeaderOption.orderType !== 'default') {
      order.orderType = tableHeaderOption.orderType;
      orderStore.updateOrder(order, orderIndex);
    } else if (!order && tableHeaderOption.orderType !== 'default') {
      orderStore.addOrders([{
        ...tableHeaderOption,
        orderType: tableHeaderOption.orderType
      }])
    }
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


  /**
   * @desc tbody中的td的样式
   * @param tableDataOption {Chart.ChartData} 表格数据
   * @param tableHeaderOption {TableChart.TableHeaderOption} 表头数据
   * @returns {CSSStyleDeclaration}
   */
  const getComparedStyle = (tableDataOption: Chart.ChartData, tableHeaderOption: TableChart.TableHeaderOption) => {
    const conditions = chartsConfigStore.getChartConfig.table.conditions;
    if (!conditions) return {};
    const condition = conditions.find(c => c.conditionField === tableHeaderOption.columnName);
    if (!condition) return {};
    const { conditionType, conditionSymbol, conditionValue, conditionColor, conditionMinValue, conditionMaxValue } = condition;
    if (conditionType === '单色') {
      const currentValue = tableDataOption[tableHeaderOption.columnName || ""] ? tableDataOption[tableHeaderOption.columnName || ""] : 0;
      switch (conditionSymbol) {
        case 'gt':
          if (currentValue > (conditionValue || 0)) {
            return {
              color: conditionColor,
            }
          }
          break;
        case 'lt':
          if (currentValue < (conditionValue || 0)) {
            return {
              color: conditionColor,
            }
          }
          break;
        case 'eq':
          if (currentValue == conditionValue) {
            return {
              color: conditionColor,
            }
          }
          break;
        case 'ne':
          if (currentValue != conditionValue) {
            return {
              color: conditionColor,
            }
          }
          break;
        case 'ge':
          if (currentValue >= (conditionValue || 0)) {
            return {
              color: conditionColor,
            }
          }
          break;
        case 'le':
          if (currentValue <= (conditionValue || 0)) {
            return {
              color: conditionColor,
            }
          }
          break;
        case 'between':
          if (currentValue >= (conditionMinValue || 0) && currentValue <= (conditionMaxValue || 0)) {
            return {
              color: conditionColor,
            }
          }
          break;
        default:
          break;
      }
    }
    if (conditionType === '色阶') {
      const currentValue = tableDataOption[tableHeaderOption.columnName || ""] ? Number(tableDataOption[tableHeaderOption.columnName || ""]) : 0;
      const currentRowValueList = props.data.map(t => (t[tableHeaderOption.columnName || ""] === undefined ? 0 : Number(t[tableHeaderOption.columnName || ""])));
      const maxValue = Math.max(...currentRowValueList);
      const minValue = Math.min(...currentRowValueList);
      const valueDif = maxValue - minValue;
      const color = conditionColor.replace(/rgb\(|\)/g, '');
      const colorArr = color.split(',');
      const r = Number(colorArr[0]);
      const g = Number(colorArr[1]);
      const b = Number(colorArr[2]);
      const R = 256 - (256 - r) * ((currentValue - minValue) / valueDif);
      const G = 256 - (256 - g) * ((currentValue - minValue) / valueDif);
      const B = 256 - (256 - b) * ((currentValue - minValue) / valueDif);
      const rgb = `rgb(${R},${G},${B})`;
      return {
        color: rgb,
      }
    }
  }

  /**
   * @desc 获取表格中的字段的内容 
   * @param tableDataOption {Chart.ChartData} 表格数据
   * @param tableHeaderOption {TableChart.TableHeaderOption} 表头数据
   * @param idx {number} 当前数据的索引
   * @returns {string}
   */
  const getComparedContent = (tableDataOption: Chart.ChartData, tableHeaderOption: TableChart.TableHeaderOption, idx: number) => {
    if (tableHeaderOption.alias) {
      return tableDataOption[tableHeaderOption.alias || ""] ? tableDataOption[tableHeaderOption.alias || ""] : ''
    } else if (tableHeaderOption.columnName) {
      return tableDataOption[tableHeaderOption.columnName || ""] ? tableDataOption[tableHeaderOption.columnName || ""] : ''
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
      initTableData()
      initTableHeader()
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
      const currentOrder = orderStore.getOrders.find(o => o.columnName === field.columnName);
      return {
        ...field,
        orderType: currentOrder?.orderType || 'default'
      }
    })
    // fields.map((field) => {
    //   const currentColumnData =
    //     tableDataState.tableData.map((item) =>
    //       String(item[field.alias || ''])
    //     )
    //   currentColumnData.push(
    //     field.displayName || field.alias || field.columnName || ''
    //   )
    //   return {
    //     ...field,
    //     minWidth: props.autoWidth
    //       ? getMaxLength(currentColumnData) + 64
    //       : undefined
    //   }
    // })
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
    getComparedContent,
    getComparedStyle
  }
}
