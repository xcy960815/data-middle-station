/// <reference path="./commom.d.ts" />
/**
 * @desc 左侧列字段
 */
declare namespace GroupStore {
  type GroupKey = 'group'
  /**
   * @desc 左侧列字段
   * @interface GroupOption
   * @property {string} name 列名
   * @property {string} comment 列注释
   * @property {string} type 列类型
   */
  interface GroupOptionDto
    extends ColumnStore.ColumnOptionDto {
    // 无效的字段
    __invalid?: boolean
  }

  type GroupState = {
    groups: GroupOptionDto[]
  }

  /**
   * @desc getter
   */
  type GroupGetters = {}
  /**
   * @desc action
   */
  type GroupActions = {
    addGroups: (groups: GroupOptionDto[]) => void
    removeGroup: (index: number) => void
  }
}
