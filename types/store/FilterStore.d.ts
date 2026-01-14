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
  const FilterAggregationsEnum: typeof AnalyzeConfigVo.FilterAggregationsEnum

  /**
   * @desc 过滤器类型
   */
  const FilterTypeEnums: typeof AnalyzeConfigVo.FilterTypeEnums

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
  type FilterOptions = ColumnsStore.ColumnOption & {
    filterType?: FilterType
    filterValue?: string
    displayName?: string
    /**
     * 聚合方式
     */
    aggregationType: FilterAggregationType
  }

  /**
   * @desc 过滤器状态
   */
  type FilterState = {
    filters: Array<FilterOptions>
  }
  /**
   * @desc getter
   */
  type FilterGetters = {}

  /**
   * @desc 过滤器操作
   */
  type FilterActions = {
    addFilters: (filters: FilterOptions[]) => void
    removeFilter: (index: number) => void
  }
}
