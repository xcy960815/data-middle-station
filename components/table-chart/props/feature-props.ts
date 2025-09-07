export const featureProps = {
  /**
   * 是否启用汇总
   */
  enableSummary: { type: Boolean, default: false },
  /**
   * 缓冲行数 - 减少缓冲行数以提升性能
   */
  bufferRows: { type: Number, default: 5 },
  /**
   * 最小自动列宽
   */
  minAutoColWidth: { type: Number, default: 100 },
  /**
   * 滚动阈值（进一步降低阈值以提升滚动响应性）
   */
  scrollThreshold: { type: Number, default: 1 }
  // /**
  //  * 是否启用行高亮 - 注释以提升性能
  //  */
  // enableRowHoverHighlight: { type: Boolean, default: false },
  // /**
  //  * 是否启用列高亮 - 注释以提升性能
  //  */
  // enableColHoverHighlight: { type: Boolean, default: false },

  // /**
  //  * 合并单元格方法
  //  * @param args 参数
  //  * @returns 合并单元格信息
  //  */
  // spanMethod: {
  //   type: Function as PropType<
  //     (args: {
  //       row: ChartDataVo.ChartData
  //       column: GroupStore.GroupOption | DimensionStore.DimensionOption
  //       rowIndex: number
  //       colIndex: number
  //     }) => { rowspan: number; colspan: number } | [number, number] | null | undefined
  //   >,
  //   default: undefined
  // }
}
