/// <reference path="../store/commom.d.ts" />

/**
 * @file table-chart.d.ts
 * @desc table-chart 组件的类型声明文件
 */
declare namespace TableChartModule {
  import type { TableColumnCtx } from 'element-plus'

  interface TableColumn
    extends TableColumnCtx<TableHeaderItem> {}

  interface TableHeaderItem extends FieldOption {
    minWidth?: number
  }

  interface TableDataItem extends ChartDataItem {}

  interface CellStyleParams {
    row: TableHeaderItem
    column: TableColumn
    rowIndex: number
    columnIndex: number
  }

  interface SpanMethodProps {
    row: DataOption
    column: TableColumn<DataOption>
    rowIndex: number
    columnIndex: number
  }

  interface InitDataParams {
    readonly data: DataOption[]
    readonly xAxisFields: FieldOption[]
    readonly yAxisFields: FieldOption[]
    readonly autoWidth?: boolean
  }

  interface HandlerParams {}
}
