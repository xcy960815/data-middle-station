/// <reference path="../store/commom.d.ts" />

declare namespace TableChart {
  import type { TableColumnCtx } from 'element-plus'

  /**
   * @desc 表格表头字段类型
   */
  interface TableHeaderOption extends FieldOption {
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
