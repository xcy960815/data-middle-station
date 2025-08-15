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
        horizontalBar: false
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
        showSummary: false,
        enableRowHoverHighlight: false,
        enableColHoverHighlight: false,
        border: true,
        hoverFill: '#f5f7fa',
        headerHeight: 40,
        summaryHeight: 40,
        enableSummary: false,
        rowHeight: 40,
        scrollbarSize: 12,
        tablePadding: 16,
        headerBackground: '#fafafa',
        bodyBackgroundOdd: '#ffffff',
        bodyBackgroundEven: '#fafafa',
        borderColor: '#e5e7eb',
        headerTextColor: '#374151',
        bodyTextColor: '#374151',
        headerFontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        headerFontSize: 14,
        bodyFontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        bodyFontSize: 14,
        bodyFontWeight: 'normal',
        bodyFontStyle: 'normal',
        summaryFontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        summaryFontSize: 14,
        summaryBackground: '#f9fafb',
        summaryTextColor: '#374151',
        scrollbarBackground: '#f3f4f6',
        scrollbarThumb: '#d1d5db',
        scrollbarThumbHover: '#9ca3af',
        bufferRows: 5,
        minAutoColWidth: 80,
        scrollThreshold: 3,
        headerSortActiveBackground: '#e5e7eb',
        sortableColor: '#6b7280',
        conditions: []
      },
      /**
       * @desc 饼图配置
       */
      pie: {
        chartType: 'pie',
        analyseName: '',
        chartUpdateTime: '',
        chartUpdateTakesTime: '',
        showLabel: false
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
        horizontalBar: false
      }
    },
    commonChartConfig: {
      limit: 1000,
      analyseDesc: '',
      suggest: false,
      mixStrategy: '',
      shareStrategy: ''
    }
  }),

  getters: {
    getChartConfigDrawer: (state) => state.chartConfigDrawer,
    getChartConfig: (state) => state.chartConfig,
    getCommonChartConfig: (state) => state.commonChartConfig
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
    }
  }
})
