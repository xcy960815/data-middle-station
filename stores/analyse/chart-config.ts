import { StoreNames } from '../store-names'

export const useChartConfigStore = defineStore<
  ChartConfigStore.ChartConfigKey,
  BaseStore.State<ChartConfigStore.ChartConfigState>,
  BaseStore.Getters<ChartConfigStore.ChartConfigState, ChartConfigStore.ChartConfigGetters>,
  BaseStore.Actions<ChartConfigStore.ChartConfigState, ChartConfigStore.ChartConfigActions>
>(StoreNames.CHART_CONFIG, {
  state: () => ({
    chartConfigDrawer: false,
    chartConfig: {
      line: {
        chartType: 'line',
        chartName: '',
        chartUpdateTime: '',
        chartUpdateTakesTime: '',
        showPoint: false,
        showLabel: false,
        smooth: false,
        autoDualAxis: false,
        horizontalBar: false,
      },
      table: {
        chartType: 'table',
        chartName: '',
        chartUpdateTime: '',
        chartUpdateTakesTime: '',
        displayMode: 'normal',
        showCompare: false,
        conditions: [],
      },
      pie: {
        chartType: 'pie',
        chartName: '',
        chartUpdateTime: '',
        chartUpdateTakesTime: '',
        showLabel: false,
      },
      interval: {
        chartType: 'interval',
        chartName: '',
        chartUpdateTime: '',
        chartUpdateTakesTime: '',
        displayMode: 'levelDisplay',
        showPercentage: false,
        showLabel: false,
        horizontalDisplay: false,
        horizontalBar: false,
      },
    },
    commonChartConfig: {
      limit: 1000,
      chartDesc: '',
      suggest: false,
      mixStrategy: '',
      shareStrategy: '',
    },
  }),

  getters: {
    getChartConfigDrawer: state => state.chartConfigDrawer,
    getChartConfig: state => state.chartConfig,
    getCommonChartConfig: state => state.commonChartConfig,
  },
  actions: {
    setChartConfigDrawer(value: boolean) {
      this.chartConfigDrawer = value
    },
    setCommonChartConfig(value: ChartConfigStore.CommonChartConfig) {
      this.commonChartConfig = value
    },
    setChartConfig(value: ChartConfigStore.ChartConfig) {
      this.chartConfig = value
    },
    setTableChartConditions(conditions: ChartConfigStore.TableChartConfigConditionOption[]) {
      this.chartConfig.table.conditions = conditions
    },
  },
})
