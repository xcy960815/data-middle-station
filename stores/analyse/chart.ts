// type getNumber = () => number
// type getString = () => string
// type GetReturnType<T> = T extends () => infer R ? R : T
// let numberResult: GetReturnType<getNumber>
// let stringResult: GetReturnType<getString>

/**
 * @desc chart store
 */
export const useChartStore = definePiniaStore<
  ChartStore.ChartKey,
  ChartStore.ChartState,
  ChartStore.ChartGetters,
  ChartStore.ChartActions
>('chart', {
  state: () => ({
    chartErrorMessage: '',
    chartType: 'line',
    chartId: null,
    chartLoading: false,
    chartData: [
      {
        id: 1,
        name: '张三',
        age: 18
      },
      {
        id: 2,
        name: '李四',
        age: 20
      }
    ]
  }),
  getters: {
    getChartErrorMessage(state) {
      return <K>() => {
        return state.chartErrorMessage as K
      }
    },
    getChartLoading(state) {
      return <K>() => {
        return state.chartLoading as K
      }
    },
    getChartType(state) {
      return <K>() => {
        return state.chartType as K
      }
    },
    getChartId(state) {
      return <K>() => {
        return state.chartId as K
      }
    },
    getChartData(state) {
      return <K>() => {
        return state.chartData as K
      }
    }
  },
  actions: {
    setChartType(chartType) {
      this.chartType =
        chartType as ChartStore.ChartState['chartType']
    },
    setChartLoading(chartLoading) {
      this.chartLoading =
        chartLoading as ChartStore.ChartState['chartLoading']
    },
    setChartId(chartId) {
      this.chartId =
        chartId as ChartStore.ChartState['chartId']
    },
    setChartErrorMessage(chartErrorMessage) {
      this.chartErrorMessage =
        chartErrorMessage as ChartStore.ChartState['chartErrorMessage']
    },
    setChartData(chartData) {
      this.chartData =
        chartData as ChartStore.ChartState['chartData']
    }
  }
})
