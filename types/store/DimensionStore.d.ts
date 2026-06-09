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
    dimensionRule: import('@/shared/analyzeConfigFieldRules').AnalyzeDimensionFieldRule
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
  type DimensionGetters = {
    getDimensions: (state: DimensionState) => DimensionOption[]
    getDrillCurrentLevel: (state: DimensionState) => number
    getDrillPath: (state: DimensionState) => DrillPathItem[]
    getSelectedDrillValue: (state: DimensionState) => DrillPathItem['value']
  }
  /**
   * @desc action
   */
  type DimensionActions = BaseStore.ResetActions<Pick<DimensionState, 'dimensions'>> & {
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
    setDrillCurrentLevel: (level: number) => void
    setDrillPath: (path: DrillPathItem[]) => void
    drillDown: (item: DrillPathItem) => void
    rollUpTo: (level: number) => void
  }
}
