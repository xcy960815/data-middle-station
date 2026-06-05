/// <reference path="./Common.d.ts" />
/**
 * @desc 左侧列字段
 */
declare namespace DimensionStore {
  /**
   * @desc 分组key
   */
  type DimensionKey = 'dimensions'
  /**
   * @desc 左侧列字段
   * @interface DimensionOption
   * @property {string} name 列名
   * @property {string} comment 列注释
   * @property {string} type 列类型
   */
  type DimensionOption = ColumnsStore.ColumnOptions & {
    /**
     * 分组规则：日期粒度、层级等分组行为配置
     */
    grouping: import('@/shared/dimensionGrouping').DimensionGroupingRule
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
    verticalAlign?: 'top' | 'middle' | 'bottom'
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

  type DrillPathItem = {
    dimension: DimensionOption
    value: string | number | boolean | null
  }

  /**
   * @desc 分组状态
   */
  type DimensionState = {
    dimensions: DimensionOption[]
    drillCurrentLevel: number
    drillPath: DrillPathItem[]
    selectedDrillValue: DrillPathItem['value']
  }

  /**
   * @desc getter
   */
  type DimensionGetters = {}
  /**
   * @desc action
   */
  type DimensionActions = {
    /**
     * @desc 添加分组
     * @param dimensions {DimensionOption[]}
     * @returns {void}
     */
    addDimensions: (dimensions: DimensionOption[]) => void
    /**
     * @desc 设置分组
     * @param dimensions {DimensionOption[]}
     * @returns {void}
     */
    setDimensions: (dimensions: DimensionOption[]) => void
    /**
     * @desc 删除分组
     * @param index {number}
     * @returns {void}
     */
    removeDimension: (index: number) => void
    /**
     * @desc 更新分组
     * @param dimension {DimensionOption}
     * @returns {void}
     */
    updateDimension: (dimension: DimensionOption) => void
    resetDrill: () => void
    setSelectedDrillValue: (value: DrillPathItem['value']) => void
    drillDown: (item: DrillPathItem) => void
    rollUpTo: (level: number) => void
  }
}
