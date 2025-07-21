/// <reference path="./commom.d.ts" />
/**
 * @desc 左侧列字段
 */
declare namespace GroupStore {
  /**
   * @desc 分组key
   */
  type GroupKey = 'group'
  /**
   * @desc 左侧列字段
   * @interface GroupOption
   * @property {string} name 列名
   * @property {string} comment 列注释
   * @property {string} type 列类型
   */
  type GroupOption = ColumnStore.ColumnOption & {
    // 无效的字段
    __invalid?: boolean
  }

  /**
   * @desc 分组状态
   */
  type GroupState = {
    groups: GroupOption[]
  }

  /**
   * @desc getter
   */
  type GroupGetters = {}
  /**
   * @desc action
   */
  type GroupActions = {
    addGroups: (groups: GroupOption[]) => void
    removeGroup: (index: number) => void
  }
}
