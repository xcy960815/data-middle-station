import LineChartConfig from './components/line-charts-config.vue'
/**
 * @desc charts-config组件初始化数据
 * @returns
 */
export const initData = () => {
  const chartsConfigStore = useChartsConfigStore()
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
    const chartType = chartStore.getChartType<'chartType'>()
    switch (chartType) {
      case 'line':
        return LineChartConfig
      default:
        return LineChartConfig
    }
  })
  /**
   * @desc 图表公共配置
   */
  const commonConfigFormData = computed(() => {
    return chartsConfigStore.commonConfigFormData
  })
  return {
    chartConfigTab,
    chartsConfigDrawer,
    chartConfigComponent,
    commonConfigFormData
  }
}
