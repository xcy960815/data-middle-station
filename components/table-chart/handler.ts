import { render } from 'vue'
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
  tableChartConfig,
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
    } else if (conditionType === '色阶') {
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
    } else {
      return {};
    }
  }

  /**
   * @desc 获取表格中的字段的内容 
   * @param tableDataOption {Chart.ChartData} 表格数据
   * @param tableHeaderOption {TableChart.TableHeaderOption} 表头数据
   * @param idx {number} 当前数据的索引
   * @returns {string}
   */
  const getComparedContent = (tableDataOption: Chart.ChartData, tableHeaderOption: TableChart.TableHeaderOption, idx: number): string => {
    if (tableHeaderOption.alias) {
      return tableDataOption[tableHeaderOption.alias || ""] ? tableDataOption[tableHeaderOption.alias || ""].toString() : ''
    } else if (tableHeaderOption.columnName) {
      return tableDataOption[tableHeaderOption.columnName || ""] ? tableDataOption[tableHeaderOption.columnName || ""].toString() : ''
    } else {
      return '';
    }
  }

  // /**
  //  * @desc 监听每页多少条数变化
  //  */
  // watch(
  //   () => pageSize.value,
  //   () => {
  //     initTableData()
  //   }
  // )
  // /**
  //  * @desc 监听页码变化
  //  */
  // watch(
  //   () => pageNum.value,
  //   () => {
  //     initTableData()
  //   }
  // )

  /**
   * @desc 监听表格配置变化
   */
  watch(
    () => tableChartConfig.value,
    async () => {
      renderTableBody()
    },
    { deep: true }
  )

  /**
   * @desc  监听数据变化
   */
  watch(
    () => props.data,
    async () => {
      await initTableHeader()
      await initTableData()
      renderTableBody()
    },
    { deep: true }
  )


  /**
   * @desc 初始化表头
   * @returns {Promise<void>}
   */
  const initTableHeader = () => {
    return new Promise<void>((resolve) => {
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
      resolve();
    })
  }

  /**
   * @desc 初始化表格数据
   * @returns {Promise<void>}
   */
  const initTableData = () => {
    return new Promise<void>((resolve) => {
      tableDataState.tableData = props.data
      resolve();
    })
  }

  /**
   * @desc 渲染表格内容
   * @returns {void}
   */
  const renderTableBody = () => {
    const tbody = document.querySelector<HTMLTableSectionElement>('.table-chart table tbody');
    if (!tbody) return;
    while (tbody.firstChild) {
      tbody.removeChild(tbody.firstChild);
    }
    for (let i = 0; i < tableDataState.tableData.length; i++) {
      const tableDataOption = tableDataState.tableData[i];
      const tr = document.createElement('tr');
      for (let j = 0; j < tableHeaderState.tableHeader.length; j++) {
        const tableHeaderOption = tableHeaderState.tableHeader[j];
        const td = document.createElement('td');
        td.style.cssText = getComparedStyle(tableDataOption, tableHeaderOption)?.toString() || "";
        td.className = getComparedClass(tableDataOption, tableHeaderOption);
        td.innerHTML = getComparedContent(tableDataOption, tableHeaderOption, i);
        tr.appendChild(td);
      }
      const tableHeight = tbody?.offsetHeight!;
      if (tableHeight > props.chartHeight - 25) {
        break
      }
      tbody?.appendChild(tr);
    }


    // const tbody = h('tbody', {}, [...tableDataState.tableData.map((tableDataOption, idx) => {
    //   return h('tr', {}, [...tableHeaderState.tableHeader.map((tableHeaderOption) => {
    //     return h('td', {
    //       class: getComparedClass(tableDataOption, tableHeaderOption),
    //       style: getComparedStyle(tableDataOption, tableHeaderOption)
    //     }, [getComparedContent(tableDataOption, tableHeaderOption, idx)])
    //   })])
    // })])
    // render(tbody, document.querySelector('.table-chart table')!)
    // console.log(document.querySelector('.table-chart table'));
  }


  return {
    handleEmitOrder,
  }
}
