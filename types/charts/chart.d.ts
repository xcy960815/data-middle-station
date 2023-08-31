/// <reference path="../store/commom.d.ts" />

/**
 * @file chart.d.ts
 * @desc chart 组件的类型声明文件
 */
declare namespace Chart {
  /**
   * @desc 图表x轴、y轴字段类型
   */
  interface XAxisFields extends FieldOption {}

  interface YAxisFields extends FieldOption {}

  type ChartData = Record<string, string | number>
}
