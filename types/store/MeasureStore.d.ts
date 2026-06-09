/**
 * @desc 值/度量字段。
 */
/// <reference path="./Common.d.ts" />
declare namespace MeasureStore {
  /**
   * @desc 值/度量字段
   * @interface MeasureOption
   * @property {string} name 列名
   * @property {string} comment 列注释
   * @property {string} type 列类型
   */
  type MeasureOption = ColumnsStore.ColumnOptions & {
    /**
     * 值字段聚合方式。保存到 chart config 后由 AnalyzeQueryBuilder 生成聚合 SQL。
     */
    measureRule: import('@/shared/analyzeConfigFieldRules').AnalyzeMeasureFieldRule
  }

  /**
   * @desc 值/度量字段 key
   */
  type MeasureKey = 'measures'

  /**
   * @desc 值/度量字段状态。
   */
  type MeasureState = {
    measures: Array<MeasureOption>
  }

  /**
   * @desc getter
   */
  type MeasureGetters = {
    /**
     * @desc 返回分析页“值/度量”字段。
     */
    getMeasures: (state: MeasureState) => MeasureOption[]
  }

  /**
   * @desc 值/度量字段操作
   */
  type MeasureActions = {
    setMeasures: (measures: MeasureOption[]) => void
    addMeasures: (measures: MeasureOption[]) => void
    removeMeasure: (index: number) => void
    updateMeasure: (measure: MeasureOption) => void
    updateMeasureByIndex: (index: number, measure: MeasureOption) => void
  }
}
