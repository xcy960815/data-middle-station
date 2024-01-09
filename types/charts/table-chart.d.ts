
/**
 * @desc table-chart 组件的数据类型定义
 */
declare namespace TableChart {
 
  type PageNum = Ref<number>

  type PageSize = Ref<number>

  type Total = ComputedRef<number>

  type StartIndex = ComputedRef<number>

  type EndIndex = ComputedRef<number>

  type TotalPage = ComputedRef<number>
  
  type Props = {
    readonly data: Chart.ChartData[]
    readonly xAxisFields: Chart.XAxisFields[]
    readonly yAxisFields: Chart.YAxisFields[]
    readonly chartWidth: number
    readonly chartHeight: number
  }
  /**
   * @desc 表格表头字段类型
   * @property {string} columnName 字段名
   * @property {string} columnType 字段类型
   * @property {string} columnCommon 字段描述
   * @property {string} alias 字段别名
   * @property {string} columnFormat 字段格式化
   * @property {string} displayName 字段显示名
   * @property {OrderStore.OrderType} orderType 排序类型
   */
  type TableHeaderOption = DimensionStore.DimensionOption & GroupStore.GroupOption & OrderStore.OrderOption & FilterStore.FilterOption 

  type TableHeaderState = {
    tableHeader: Array<TableHeaderOption>
  }

  type TableDataState = {
    tableData: Chart.ChartData[]
  }
  /**
   * @desc 初始化 方法所需的参数 就是整个props
   */
  type InitDataParams = Props

  type HandlerParams = {
    TABLEHEADERHEIGHT: number
    PAGINATIONHEIGHT: number
    pageNum: PageNum
    pageSize: PageSize
    props: Props
    tableHeaderState: TableHeaderState
    tableDataState: TableDataState
    tableChartConfig: ComputedRef<{
      displayMode: string
      showCompare: boolean
      conditions: Array<ChartConfigStore.TableChartConfigConditionOption>
    }>
  }
}
