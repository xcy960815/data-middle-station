
/**
 * @desc 初始化 table-chart 组件的数据
 * @param {TableChart.InitDataParams} props
 * @returns {TableChart.InitDataReturn}
 */
export const initData = ({
  data
}: TableChart.InitDataParams) => {
  // 开始页码
  const pageNum: TableChart.PageNum = ref(1)
  // 每页条数
  const pageSize: TableChart.PageSize = ref(0)
  /**
   * @desc 总条数
   * @type {TableChart.Total}
   */
  const total: TableChart.Total = computed(() => {
    return data.length
  })
  /**
   * @desc 条数开始索引
   * @type {TableChart.StartIndex}
   * @returns {TableChart.StartIndex}
   */
  const startIndex: TableChart.StartIndex = computed(() => {
    return (pageNum.value - 1) === 0 ? 1 : (pageNum.value - 1) * pageSize.value
  })
  /**
   * @desc 条数结束索引
   * @type {TableChart.EndIndex}
   */
  const endIndex: TableChart.EndIndex = computed(() => {
    return pageNum.value * pageSize.value
  })
  /**
   * @desc 总页数
   * @type {TableChart.TotalPage}
   */
  const totalPage: TableChart.TotalPage = computed(() => {
    return Math.ceil(total.value / pageSize.value)
  })

  /**
   * @desc 表头数据
   * @type {TableChart.TableHeaderState}
   */
  const tableHeaderState =
    reactive<TableChart.TableHeaderState>({
      tableHeader: []
    })
  /**
   * @desc 表格数据
   * @type {TableChart.TableDataState}
   * @property {Array<TableChart.TableData>} tableData 表格数据
   */
  const tableDataState =
    reactive<TableChart.TableDataState>({
      tableData: []
    })
  const chartsConfigStore = useChartConfigStore()
  /**
   * @desc 表格图表配置
   */
  const tableChartConfig = computed(
    () => chartsConfigStore.chartConfig.table
  )

  /**
   * @desc 监听表格数据变化 动态计算 pageSize 
   * 
   */
  watch(() => data.length, () => {
    nextTick(() => {
      const tableChartContainer = document.querySelector('.table-chart')
      const tableChartContainerHeight = tableChartContainer?.clientHeight || 0
      // 分页器高度
      const paginationHeight = 20
      // 表头高度
      const tableHeaderHeight = 25
      const tableBodyHeight = tableChartContainerHeight - tableHeaderHeight - paginationHeight
      // 表格行高
      const tableBodyRowHeight = 26
      const realPageSize = Math.floor(tableBodyHeight / tableBodyRowHeight)
      realPageSize && (pageSize.value = realPageSize)
    })
  },{
    immediate: true
  })
  return {
    startIndex,
    endIndex,
    totalPage,
    pageNum,
    pageSize,
    total,
    tableHeaderState,
    tableDataState,
    tableChartConfig
  }
}
