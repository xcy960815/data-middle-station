/**
 * @desc 维度字段
 */
/// <reference path="./commom.d.ts" />
declare namespace DimensionStore {
  /**
   * @desc 维度字段
   * @interface DimensionOption
   * @property {string} name 列名
   * @property {string} comment 列注释
   * @property {string} type 列类型
   */
  type DimensionOption = ColumnStore.ColumnOption & {
    /**
     * 是否无效
     */
    __invalid?: boolean
    /**
     * 固定列
     */
    fixed?: 'left' | 'right' | null
    /**
     * 对齐方式
     */
    align?: 'left' | 'right' | null
    /**
     * 宽度
     */
    width?: number
    /**
     * 是否显示溢出提示
     */
    showOverflowTooltip?: boolean
    /** 是否支持表头过滤（下拉枚举） */
    filterable?: boolean
    /** 是否支持排序 */
    sortable?: boolean
  }

  /**
   * @desc 维度字段key
   */
  type DimensionKey = 'dimension'

  /**
   * @desc 维度字段状态
   */
  type DimensionState = {
    dimensions: Array<DimensionOption>
  }

  /**
   * @desc getter
   */
  type DimensionGetters = {
    getDimensions: (state: DimensionState) => DimensionOption[]
  }

  /**
   * @desc 维度字段操作
   */
  type DimensionActions = {
    addDimensions: (dimensions: DimensionOption[]) => void
    removeDimension: (index: number) => void
  }
}
