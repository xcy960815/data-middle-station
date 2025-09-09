/**
 * @desc 图表配置 store 类型
 */
declare namespace ChartConfigStore {
  /**
   * @desc 图表配置 store
   */
  type ChartConfigKey = 'chartConfig'

  /**
   * @desc 表格配置
   */
  type TableChartConfig = ChartConfigVo.TableChartConfig

  /**
   * @desc 饼图配置
   */
  type PieChartConfig = ChartConfigVo.PieChartConfig

  /**
   * @desc 柱状图配置
   */
  type IntervalChartConfig = ChartConfigVo.IntervalChartConfig

  /**
   * @desc 折线图配置
   */
  type LineChartConfig = ChartConfigVo.LineChartConfig

  /**
   * @desc 图表公共配置
   */
  type CommonChartConfig = ChartConfigVo.CommonChartConfig
  /**
   * @desc 私有图表配置
   */
  type PrivateChartConfig = ChartConfigVo.PrivateChartConfig

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
    commonChartConfig: CommonChartConfig | null
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
