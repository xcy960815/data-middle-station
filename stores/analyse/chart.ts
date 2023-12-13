
/**
 * @desc chart store
 */
export const useChartStore = definePiniaStore<
  ChartStore.ChartKey,
  ChartStore.ChartState,
  ChartStore.ChartGetters<ChartStore.ChartState>,
  ChartStore.ChartActions
>('chart', {
  state: () => ({
    chartErrorMessage: '',
    chartType: 'table',
    chartId: null,
    chartLoading: false,
    chartData: []
  }),
  getters: {
    getChartErrorMessage(state) {
      return state.chartErrorMessage
    },
    getChartLoading(state) {
      return state.chartLoading
    },
    getChartType(state) {
      return state.chartType
    },
    getChartId(state) {
      return state.chartId
    },
    getChartData(state) {
      return state.chartData
    }
  },
  actions: {
    setChartType(chartType) {
      this.chartType = chartType
    },
    setChartLoading(chartLoading) {
      this.chartLoading = chartLoading
    },
    setChartId(chartId) {
      this.chartId = chartId
    },
    setChartErrorMessage(chartErrorMessage) {
      this.chartErrorMessage = chartErrorMessage
    },
    setChartData(chartData) {
      this.chartData =chartData
    }
  }
})
