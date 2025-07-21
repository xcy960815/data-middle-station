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
    // 无效的字段
    __invalid?: boolean
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
