import { StoreNames } from './store-names'

export const useChartConfigStore = defineStore<
  ChartConfigStore.ChartConfigKey,
  BaseStore.State<ChartConfigStore.ChartConfigState>,
  BaseStore.Getters<ChartConfigStore.ChartConfigState, ChartConfigStore.ChartConfigGetters>,
  BaseStore.Actions<ChartConfigStore.ChartConfigState, ChartConfigStore.ChartConfigActions>
>(StoreNames.CHART_CONFIG, {
  state: () => ({
    chartConfigDrawer: false,
    chartConfig: {
      /**
       * @desc 折线图配置
       */
      line: {
        chartType: 'line',
        analyseName: '',
        chartUpdateTime: '',
        chartUpdateTakesTime: '',
        showPoint: false,
        showLabel: false,
        smooth: false,
        autoDualAxis: false,
        horizontalBar: false,
      },
      /**
       * @desc 表格图配置
       */
      table: {
        chartType: 'table',
        analyseName: '',
        chartUpdateTime: '',
        chartUpdateTakesTime: '',
        displayMode: 'normal',
        showCompare: false,
        conditions: [],
      },
      /**
       * @desc 饼图配置
       */
      pie: {
        chartType: 'pie',
        analyseName: '',
        chartUpdateTime: '',
        chartUpdateTakesTime: '',
        showLabel: false,
      },
      /**
       * @desc 柱状图配置
       */
      interval: {
        chartType: 'interval',
        analyseName: '',
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
      analyseDesc: '',
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
    setChartConfigDrawer(value) {
      this.chartConfigDrawer = value
    },
    setCommonChartConfig(value) {
      this.commonChartConfig = value
    },
    setChartConfig(value) {
      this.chartConfig = value
    },
    setTableChartConditions(conditions) {
      if (this.chartConfig) {
        this.chartConfig.table.conditions = conditions
      }
    },
  },
})
