
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
    chartData: [
      {
        date: '2018/8/1',
        download: 4623,
        register: 2208,
        bill: 182
      },
      {
        date: '2018/8/2',
        download: 6145,
        register: 2016,
        bill: 257
      },
      {
        date: '2018/8/3',
        download: 508,
        register: 2916,
        bill: 289
      },
      {
        date: '2018/8/4',
        download: 6268,
        register: 4512,
        bill: 428
      },
      {
        date: '2018/8/5',
        download: 6411,
        register: 8281,
        bill: 619
      },
      {
        date: '2018/8/6',
        download: 1890,
        register: 2008,
        bill: 87
      },
      {
        date: '2018/8/7',
        download: 4251,
        register: 1963,
        bill: 706
      },
      {
        date: '2018/8/8',
        download: 2978,
        register: 2367,
        bill: 387
      },
      {
        date: '2018/8/9',
        download: 3880,
        register: 2956,
        bill: 488
      },
      {
        date: '2018/8/10',
        download: 3606,
        register: 678,
        bill: 507
      },
      {
        date: '2018/8/11',
        download: 4311,
        register: 3188,
        bill: 548
      },
      {
        date: '2018/8/12',
        download: 4116,
        register: 3491,
        bill: 456
      },
      {
        date: '2018/8/13',
        download: 6419,
        register: 2852,
        bill: 689
      },
      {
        date: '2018/8/14',
        download: 1643,
        register: 4788,
        bill: 280
      },
      {
        date: '2018/8/15',
        download: 445,
        register: 4319,
        bill: 176
      }
    ]
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
      this.chartLoading =
        chartLoading
    },
    setChartId(chartId) {
      this.chartId =
        chartId
    },
    setChartErrorMessage(chartErrorMessage) {
      this.chartErrorMessage =
        chartErrorMessage
    },
    setChartData(chartData) {
      this.chartData =
        chartData
    }
  }
})
