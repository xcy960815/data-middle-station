/// <reference path="./commom.d.ts" />
/**
 * @desc 左侧列字段
 */
declare namespace GroupStore {
  /**
   * @desc 分组key
   */
  type GroupKey = 'groups'
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
     * 无效信息
     */
    __invalidMessage?: string
    /**
     * 固定列
     */
    fixed?: 'left' | 'right' | null
    /**
     * 左右对齐方式
     */
    align?: 'left' | 'right' | 'center' | null
    /**
     * 垂直对齐方式
     */
    verticalAlign?: 'top' | 'middle' | 'bottom' | null
    /**
     * 宽度
     */
    width?: number | null
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
    /**
     * @desc 添加分组
     * @param groups {GroupOption[]}
     * @returns {void}
     */
    addGroups: (groups: GroupOption[]) => void
    /**
     * @desc 删除分组
     * @param index {number}
     * @returns {void}
     */
    removeGroup: (index: number) => void
    /**
     * @desc 更新分组
     * @param group {GroupOption}
     * @returns {void}
     */
    updateGroup: (group: GroupOption) => void
  }
}
