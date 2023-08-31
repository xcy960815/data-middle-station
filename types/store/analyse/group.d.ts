/// <reference path="./commom.d.ts" />
/**
 * @desc 左侧列字段
 */
declare namespace GroupStore {
  type GroupKey = 'group'
  /**
   * @desc 左侧列字段
   * @interface Group
   * @property {string} name 列名
   * @property {string} comment 列注释
   * @property {string} type 列类型
   */
  interface Group extends FieldOption {}

  interface GroupState {
    groups: Group[]
  }

  interface GroupGetters
    extends Record<
      `get${Capitalize<keyof GroupState>}`,
      (
        state: GroupState
      ) => <
        K extends string & keyof GroupState
      >() => GroupState[K]
    > {}

  interface GroupActions {
    updateGroup: (groups: Group[]) => void
    addGroup: (groups: Group[]) => void
    removeGroup: (index: number) => void
  }
}
