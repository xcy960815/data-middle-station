
/**
 * @file chart.d.ts
 * @desc chart 组件的类型声明文件
 */
declare namespace Chart {
  /**
   * @desc 图表x轴、y轴字段类型
   */
  type XAxisFields = ColumnStore.Column 

  type YAxisFields = ColumnStore.Column

  type ChartData = Record<string, string | number>
}
