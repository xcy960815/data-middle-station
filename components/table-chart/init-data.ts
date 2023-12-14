
/**
 * @desc 初始化 table-chart 组件的数据
 * @param {TableChart.InitDataParams} props
 * @returns {TableChart.InitDataReturn}
 */
export const initData = ({
  data
}: TableChart.InitDataParams) => {
  const pageNum: TableChart.PageNum = ref(1)
  const pageSize: TableChart.PageSize = ref(10)
  /**
   * @desc 总条数
   * @type {TableChart.Total}
   */
  const total: TableChart.Total = computed(() => {
    return data.length
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
  return {
    pageNum,
    pageSize,
    total,
    tableHeaderState,
    tableDataState,
    tableChartConfig
  }
}
