/**
 * @desc 维度字段
 */
/// <reference path="./commom.d.ts" />
declare namespace DimensionStore {
  // import type { _GettersTree } from 'pinia';
  // extends _GettersTree<DimensionState>
  /**
   * @desc 维度字段
   * @interface Dimension
   * @property {string} name 列名
   * @property {string} comment 列注释
   * @property {string} type 列类型
   */
  interface Dimension extends FieldOption {}

  type DimensionKey = 'dimension'

  interface DimensionState {
    dimensions: Dimension[]
  }

  type DimensionStateKeys = `get${Capitalize<
    keyof DimensionState & string
  >}`
  interface DimensionGetters
    extends Record<
      DimensionStateKeys,
      (
        state: DimensionState
      ) => <
        K extends string & keyof DimensionState
      >() => DimensionState[K]
    > {}

  interface DimensionActions {
    updateDimension: (dimensions: Dimension[]) => void
    addDimension: (dimensions: Dimension[]) => void
    removeDimension: (index: number) => void
  }
}
