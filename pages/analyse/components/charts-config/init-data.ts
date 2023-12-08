// 表格 配置
import TableChartConfig from './components/table-chart-config/index.vue'
// 折线图 配置
import LineChartConfig from './components/line-charts-config/index.vue'
// 柱状图 配置
import IntervalChartConfig from './components/interval-chart-config/index.vue'
// 扇形图 配置
import PieChartConfig from './components/pie-chart-config/index.vue'
/**
 * @desc charts-config组件初始化数据
 * @returns
 */
export const initData = () => {
  const chartsConfigStore = useChartConfigStore()
  const chartStore = useChartStore()
  const chartConfigTab = ref('common')
  /**
   * @desc 图表配置抽屉 状态
   */
  const chartsConfigDrawer = computed({
    get: () => {
      return chartsConfigStore.chartsConfigDrawer
    },
    set: (value) =>
      chartsConfigStore.setChartsConfigDrawer(value)
  })
  /**
   * @desc 图表配置组件
   */
  const chartConfigComponent = computed(() => {
    const chartType = chartStore.getChartType
    switch (chartType) {
      case 'table':
        return TableChartConfig
      case 'line':
        return LineChartConfig
      case 'interval':
        return IntervalChartConfig
      case 'pie':
        return PieChartConfig
      default:
        return LineChartConfig
    }
  })
  /**
   * @desc 图表公共配置
   */
  const chartCommonConfigData = computed(() => {
    return chartsConfigStore.chartCommonConfigData
  })
  return {
    chartConfigTab,
    chartsConfigDrawer,
    chartConfigComponent,
    chartCommonConfigData
  }
}
