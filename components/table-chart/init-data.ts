import { Table } from 'element-plus'

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
  /* 数据总条数 */
  const total: TableChart.Total = computed(() => {
    return data.length
  })
  const tableHeaderState =
    reactive<TableChart.TableHeaderState>({
      tableHeader: []
    })
  const tableDataState =
    reactive<TableChart.TableDataState>({
      tableData: []
    })
  const chartsConfigStore = useChartConfigStore()
  const tableChartConfig = computed(
    () => chartsConfigStore.chartConfigData.table
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
