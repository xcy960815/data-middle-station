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
    measureRule: import('@/shared/analyzeFieldRules').MeasureRule
    /**
     * 固定列
     */
    fixed: 'left' | 'right' | null
    /**
     * 左右对齐方式
     */
    align: 'left' | 'right' | 'center' | null
    /**
     * 垂直对齐方式
     */
    verticalAlign?: 'top' | 'middle' | 'bottom' | null
    /**
     * 宽度
     */
    width: number | null
    /**
     * 是否显示溢出提示
     */
    showOverflowTooltip?: boolean
    /**
     * 是否支持表头过滤
     */
    filterable?: boolean
    /**
     * 是否支持排序
     */
    sortable?: boolean
    /**
     * 是否可编辑
     */
    editable?: boolean
    /**
     * 编辑类型：input-输入框, select-下拉选择, date-日期, datetime-日期时间
     */
    editType?: 'input' | 'select' | 'date' | 'datetime'
    /**
     * 下拉选择选项（当 editType 为 select 时使用）
     */
    editOptions?: Array<{
      label: string
      value: string | number
    }>

    /**
     * 是否可调整列宽
     */
    resizable?: boolean
    /**
     * 是否可拖拽调整位置
     */
    draggable?: boolean

    colIndex?: number
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
