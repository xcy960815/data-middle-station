/**
 * @desc 图表配置 store 类型
 */
declare namespace ChartConfigStore {
  /**
   * @desc 图表配置 store
   */
  type ChartConfigKey = 'chartConfig'

  type TableChartConfig = ChartConfigDao.TableChartConfig
  type PieChartConfig = ChartConfigDao.PieChartConfig
  type IntervalChartConfig = ChartConfigDao.IntervalChartConfig
  type LineChartConfig = ChartConfigDao.LineChartConfig

  /**
   * @desc 图表公共配置
   */
  type CommonChartConfig = ChartConfigDao.CommonChartConfig
  type PrivateChartConfig = ChartConfigDao.PrivateChartConfig
  /**
   * @desc 图表配置状态
   */
  type ChartConfigState = {
    /**
     * @desc 图表配置抽屉
     */
    chartConfigDrawer: boolean
    /**
     * @desc 图表公共配置
     */
    commonChartConfig: CommonChartConfig
    /**
     * @desc 私有图表配置
     */
    privateChartConfig: PrivateChartConfig | null
  }

  /**
   * @desc getter
   */
  type ChartConfigGetters = {
    /**
     * @desc 获取表格图配置
     */
    getTableChartConfig: (state: ChartConfigState) => TableChartConfig | null
  }

  /**
   * @desc action
   */
  type ChartConfigActions = {
    /**
     * @desc 设置表格图配置条件
     */
    setTableChartConditions(conditions: ConditionOption[]): void
    /**
     * @desc 设置表格图配置
     */
    setTableChartConfig(config: TableChartConfig): void
  }
}
