/// <reference path="./commom.d.ts" />
/**
 * @desc 左侧列字段
 */
declare namespace ColumnStore {
  type ColumnKey = 'column'
  /**
   * @desc 左侧列字段
   * @interface Column
   * @property {string} name 列名
   * @property {string} comment 列注释
   * @property {string} type 列类型
   */
  interface Column extends FieldOption {}

  interface ColumnState {
    columns: Column[]
  }

  interface ColumnGetter
    extends Record<
      `get${Capitalize<keyof ColumnState>}`,
      (
        state: ColumnState
      ) => <
        K extends string & keyof ColumnState
      >() => ColumnState[K]
    > {}

  interface ColumnAction {
    setColumns(columns: Column[]): void
  }
}
