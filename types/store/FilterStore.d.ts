/**
 * @description: 过滤器 store
 */
declare namespace FilterStore {
  /**
   * @desc 过滤器key
   */
  type FilterKey = 'filters'

  /**
   * @desc 过滤器聚合方式
   */
  type FilterAggregationsEnum = AnalyzeConfigVo.FilterAggregationsEnum

  /**
   * @desc 过滤器类型
   */
  type FilterTypeEnums = AnalyzeConfigVo.FilterTypeEnums

  /**
   * @desc 过滤器类型
   */
  type FilterType = AnalyzeConfigVo.FilterType

  /**
   * @desc 过滤器聚合方式
   */
  type FilterAggregationType = AnalyzeConfigVo.FilterAggregationsType

  /**
   * @desc 过滤器选项
   */
  type FilterOption = ColumnsStore.ColumnOptions & {
    displayName?: string
    /**
     * 过滤条件：操作符 + 操作数 + 聚合方式
     */
    filterRule: import('@/shared/analyzeFieldRules').FilterRule
  }

  /**
   * @desc 过滤器状态
   */
  type FilterState = {
    filters: Array<FilterOption>
  }
  /**
   * @desc getter
   */
  type FilterGetters = {
    getFilters: (state: FilterState) => FilterOption[]
  }

  /**
   * @desc 过滤器操作
   */
  type FilterActions = {
    setFilters: (filters: FilterOption[]) => void
    addFilters: (filters: FilterOption[]) => void
    removeFilter: (index: number) => void
  }
}
