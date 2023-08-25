/**
 *@desc chart-table 组件的逻辑处理
 * @param {TableChartModule.HandlerParams} params
 */
export const handler = (
  params: TableChartModule.HandlerParams
) => {
  /**
   * @desc 表格单元格样式
   * @param {TableChartModule.CellStyleParams} params
   * @returns CssProperties
   */
  const cellStyle = ({
    row,
    column
  }: TableChartModule.CellStyleParams) => {
    return {}
  }
  /**
   * @desc 表格列格式化
   * @param {TableChartModule.DataOption} row
   * @param {TableChartModule.TableColumn} column
   * @param {number|string} cellValue
   * @param {number} index
   * @returns
   */
  const tableColumnFormatter = (
    row: TableChartModule.TableDataItem,
    column: TableChartModule.TableColumn,
    cellValue: number | string,
    index: number
  ) => {
    // console.log(row, column, cellValue, index);
    return cellValue
  }
  /**
   * @desc 表格合并
   * @param {TableChartModule.SpanMethodProps} param
   * @returns {number[]|void}
   */
  const spanMethod = ({
    row,
    column,
    rowIndex,
    columnIndex
  }: TableChartModule.SpanMethodProps) => {
    // if (rowIndex % 2 === 0) {
    //   if (columnIndex === 0) {
    //     return [1, 2];
    //   } else if (columnIndex === 1) {
    //     return [0, 0];
    //   }
    // }
  }
  return {
    cellStyle,
    tableColumnFormatter,
    spanMethod
  }
}
