
/**
 * @desc table-chart 组件的类型定义
 */
declare namespace TableChart {
  import type { TableColumnCtx } from 'element-plus'
  type PageNum = Ref<number>
  type PageSize = Ref<number>
  type Total = ComputedRef<number>
  type Props = {
    readonly data: Chart.ChartData[]
    readonly xAxisFields: Chart.XAxisFields[]
    readonly yAxisFields: Chart.YAxisFields[]
    readonly autoWidth: boolean
  }
  /**
   * @desc 表格表头字段类型
   */
  interface TableHeaderOption extends TableInfoModule.TableColumnOption {
    minWidth?: number
  }
  interface TableColumn
    extends TableColumnCtx<TableHeaderOption> {}

  interface CellStyleParams {
    row: TableHeaderOption
    column: TableColumn
    rowIndex: number
    columnIndex: number
  }

  interface SpanMethodProps {
    row: Chart.ChartData
    column: TableColumn<Chart.ChartData>
    rowIndex: number
    columnIndex: number
  }

  interface TableHeaderState {
    tableHeader: TableChart.TableHeaderOption[]
  }

  interface TableDataState {
    tableData: Chart.ChartData[]
  }
  /**
   * @desc 初始化 方法所需的参数 就是整个props
   */
  interface InitDataParams extends Props {}

  interface HandlerParams {
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
