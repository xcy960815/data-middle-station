
/**
 * @desc table-chart 组件的数据类型定义
 */
declare namespace TableChart {
  import type { TableColumnCtx } from 'element-plus'
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
    readonly autoWidth: boolean
  }
  /**
   * @desc 表格表头字段类型
   */
  type TableHeaderOption = ColumnStore.Column & {
    minWidth?: number
  }
  type TableColumn = TableColumnCtx<TableHeaderOption> 

  type CellStyleParams = {
    row: TableHeaderOption
    column: TableColumn
    rowIndex: number
    columnIndex: number
  }

  type SpanMethodProps = {
    row: Chart.ChartData
    column: TableColumn<Chart.ChartData>
    rowIndex: number
    columnIndex: number
  }

  type TableHeaderState = {
    tableHeader: TableChart.TableHeaderOption[]
  }

  type TableDataState = {
    tableData: Chart.ChartData[]
  }
  /**
   * @desc 初始化 方法所需的参数 就是整个props
   */
  type InitDataParams = Props

  type HandlerParams = {
    pageNum: PageNum
    pageSize: PageSize
    props: Props
    tableHeaderState: TableHeaderState
    tableDataState: TableDataState
    tableChartConfig: ComputedRef<{
      displayMode: string
      showCompare: boolean
      conditions: {}[]
    }>
  }
}
