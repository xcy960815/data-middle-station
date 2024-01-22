
/**
 * @desc 初始化 table-chart 组件的数据
 * @param {TableChart.InitDataParams} props
 * @returns {TableChart.InitDataReturn}
 */
export const initData = (props: TableChart.InitDataParams) => {
  /**
   * @desc 表头高度
   */
  const TABLEHEADERHEIGHT = 25
  /**
   * @desc 分页器高度
   */
  const PAGINATIONHEIGHT = 25
  
  const chartsConfigStore = useChartConfigStore()
  /**
   * @desc 当前页码
   * @type {TableChart.PageNum}
   */
  const pageNum: TableChart.PageNum = ref(1)

  /**
   * @desc 每页条数
   * @type {TableChart.PageSize}
   */
  const pageSize: TableChart.PageSize = ref(0)

  /**
   * @desc 总条数
   * @type {TableChart.Total}
   */
  const total: TableChart.Total = computed(() => props.data.length)

  /**
   * @desc 条数开始索引
   * @type {TableChart.StartIndex}
   * @returns {TableChart.StartIndex}
   */
  const startIndex: TableChart.StartIndex = computed(() => (pageNum.value - 1) === 0 ? 1 : (pageNum.value - 1) * pageSize.value)

  /**
   * @desc 条数结束索引
   * @type {TableChart.EndIndex}
   */
  const endIndex: TableChart.EndIndex = computed(() => pageNum.value * pageSize.value)

  /**
   * @desc 总页数
   * @type {TableChart.TotalPage}
   */
  const totalPage: TableChart.TotalPage = computed(() => Math.ceil(total.value / pageSize.value))

  /**
   * @desc 表头数据
   * @type {TableChart.TableHeaderState}
   * @property {Array<TableChart.TableHeaderOption>} tableHeader 表头数据
   */
  const tableHeaderState = reactive<TableChart.TableHeaderState>({
    tableHeader: []
  })

  /**
   * @desc 表格数据
   * @type {TableChart.TableDataState}
   * @property {Array<TableChart.ChartData>} tableData 表格数据
   */
  const tableDataState = reactive<TableChart.TableDataState>({
    tableData: []
  })


  /**
   * @desc 表格图表配置
   */
  const tableChartConfig = computed(
    () => chartsConfigStore.chartConfig.table
  )

  /**
   * @desc 获取表头样式
   */
  const getTableHeaderClass = computed(() => (item: TableChart.TableHeaderOption) => {
    return ['table-header-content', item.orderType == 'desc' ? 'icon-desc' : item.orderType == 'asc' ? 'icon-asc' : '']
  })

  return {
    TABLEHEADERHEIGHT,
    PAGINATIONHEIGHT,
    startIndex,
    endIndex,
    totalPage,
    pageNum,
    pageSize,
    total,
    tableHeaderState,
    tableDataState,
    tableChartConfig,
    getTableHeaderClass
  }
}
