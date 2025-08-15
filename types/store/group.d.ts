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
