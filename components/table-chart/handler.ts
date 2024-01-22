
/**
 *@desc chart-table 组件的逻辑处理
 *@param {TableChart.HandlerParams} params
 */
export const handler = ({
  TABLEHEADERHEIGHT,
  PAGINATIONHEIGHT,
  pageNum,
  totalPage,
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
   * @returns {string}
   */
  const getComparedStyle = (tableDataOption: Chart.ChartData, tableHeaderOption: TableChart.TableHeaderOption): string | undefined => {
    const conditions = chartsConfigStore.getChartConfig.table.conditions;
    if (!conditions) return "";
    const condition = conditions.find(c => c.conditionField === tableHeaderOption.columnName);
    if (!condition) return "";
    const { conditionType, conditionSymbol, conditionValue, conditionColor, conditionMinValue, conditionMaxValue } = condition;
    if (conditionType === '单色') {
      const currentValue = tableDataOption[tableHeaderOption.columnName || ""] ? tableDataOption[tableHeaderOption.columnName || ""] : 0;
      switch (conditionSymbol) {
        case 'gt':
          if (currentValue > (conditionValue || 0)) {
            return `color: ${conditionColor}`
          }
          break;
        case 'lt':
          if (currentValue < (conditionValue || 0)) {
            return `color: ${conditionColor}`
          }
          break;
        case 'eq':
          if (currentValue == conditionValue) {
            return `color: ${conditionColor}`
          }
          break;
        case 'ne':
          if (currentValue != conditionValue) {
            return `color: ${conditionColor}`
          }
          break;
        case 'ge':
          if (currentValue >= (conditionValue || 0)) {
            return `color: ${conditionColor}`
          }
          break;
        case 'le':
          if (currentValue <= (conditionValue || 0)) {
            return `color: ${conditionColor}`
          }
          break;
        case 'between':
          if (currentValue >= (conditionMinValue || 0) && currentValue <= (conditionMaxValue || 0)) {
            return `color: ${conditionColor}`
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
      return `background-color:${rgb}`
    } else {
      return "";
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

  /**
   * @desc 监听表格配置变化
   */
  watch(
    () => tableChartConfig.value.conditions,
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
   * @desc 监听高度变化
   * @returns {void}
   */
  watch(
    () => props.chartHeight,
    async () => {
      renderTableBody()
      console.log("监听高度变化");
    },
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
   * @desc 渲染表格内容 因为要做到分页 所以要根据每页的条数来渲染 所以走的是dom操作
   * @returns {void}
   */
  const renderTableBody = () => {
    const tbody = document.querySelector<HTMLTableSectionElement>('.table-chart table tbody');
    if (!tbody) return;
    // 清空tbody
    while (tbody.firstChild) {
      tbody.removeChild(tbody.firstChild);
    }
    for (let i = 0; i < tableDataState.tableData.length; i++) {
      const tableDataOption = tableDataState.tableData[i];
      const tr = document.createElement('tr');
      for (let j = 0; j < tableHeaderState.tableHeader.length; j++) {
        const tableHeaderOption = tableHeaderState.tableHeader[j];
        const td = document.createElement('td');
        td.style.cssText = getComparedStyle(tableDataOption, tableHeaderOption) || ""
        td.className = getComparedClass(tableDataOption, tableHeaderOption);
        td.innerHTML = getComparedContent(tableDataOption, tableHeaderOption, i);
        tr.appendChild(td);
      }
      tbody?.appendChild(tr);
      // 获取上一次的高度
      const tableHeight = tbody?.offsetHeight!;
      // 先判断 再添加
      if (tableHeight > props.chartHeight - TABLEHEADERHEIGHT - PAGINATIONHEIGHT - 10) {
        // console.log("当前页展示" + (i-1) + '条数据');
        tbody.removeChild(tr);
        // 计算得出每页可以放多少条
        pageSize.value = i - 1;
        break
      }
    }
  }
  /**
   * @desc 点击上一页
   * @param page {number} 当前页码
   */
  const handlePreviousPage = (page?: number) => {
    if (page === 1) {
      tableDataState.tableData = props.data.slice(0, pageSize.value)
      pageNum.value = page
    } else {
      const currentPageNum = pageNum.value - 1
      tableDataState.tableData = props.data.slice((currentPageNum - 1) * pageSize.value, currentPageNum * pageSize.value)
      // 变更当前页码
      pageNum.value = currentPageNum
    }
    renderTableBody()
  }

  /**
   * @desc 点击下一页
   * @param page {number} 当前页码
   */
  const handleNextPage = (page?: number) => {
    if (page && page === totalPage.value) {
      tableDataState.tableData = props.data.slice((page - 1) * pageSize.value)
      pageNum.value = page
    } else {
      const currentPageNum = pageNum.value + 1
      tableDataState.tableData = props.data.slice((currentPageNum - 1) * pageSize.value, currentPageNum * pageSize.value)
      // 变更当前页码
      pageNum.value = currentPageNum
    }
    renderTableBody()
  }

  onMounted(async () => {
    await initTableHeader()
    await initTableData()
    renderTableBody()
  })
  
  return {
    handleEmitOrder,
    handlePreviousPage,
    handleNextPage
  }
}
