
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

    chartName: "",
    chartUpdateTime: "",
    chartUpdateTakesTime: "",
    chartErrorMessage: '',
    chartType: 'table',
    chartId: null,
    chartLoading: false,
    chartData: []
  }),
  getters: {
    /**
     * @desc 获取图表名称
     * @param state { ChartStore.ChartState} 
     * @returns {string}
     */
    getChartName(state) {
      return state.chartName
    },
    /**
     * @desc 获取图表更新时间
     * @param state { ChartStore.ChartState} 
     * @returns {string}
     */
    getChartUpdateTime(state) {
      return state.chartUpdateTime
    },
    /**
     * @desc 获取图表更新耗时
     * @param state { ChartStore.ChartState} 
     * @returns {string}
     */
    getChartUpdateTakesTime(state) {
      return state.chartUpdateTakesTime
    },
    /**
     * @desc 获取图表错误信息
     * @param state { ChartStore.ChartState} 
     * @returns {string}
     */
    getChartErrorMessage(state) {
      return state.chartErrorMessage
    },
    /**
     * @desc 获取图表加载状态
     * @param state { ChartStore.ChartState} 
     * @returns {boolean}
     */
    getChartLoading(state) {
      return state.chartLoading
    },
    /**
     * @desc 获取图表类型
     * @param state { ChartStore.ChartState} 
     * @returns {ChartStore.ChartState['chartType']}
     */
    getChartType(state) {
      return state.chartType
    },
    /**
     * @desc 获取图表id
     * @param state { ChartStore.ChartState} 
     * @returns {ChartStore.ChartState['chartId']}
     */
    getChartId(state) {
      return state.chartId
    },
    /**
     * @desc 获取图表数据
     * @param state { ChartStore.ChartState} 
     * @returns {ChartStore.ChartState['chartData']}
     */
    getChartData(state) {
      return state.chartData
    }
  },
  actions: {
    /**
     * @desc 设置图表名称
     * @param chartName {ChartStore.ChartState['chartName']}
     * @returns {void}
     */
    setChartName(chartName) {
      this.chartName = chartName
    },
    /**
     * @desc 设置图表更新时间
     * @param chartUpdateTime {ChartStore.ChartState['chartUpdateTime']}
     * @returns {void}
     */
    setChartUpdateTime(chartUpdateTime) {
      this.chartUpdateTime = chartUpdateTime
    },
    /**
     * @desc 设置图表更新耗时
     * @param chartUpdateTakesTime {ChartStore.ChartState['chartUpdateTakesTime']}
     * @returns {void}
     */
    setChartUpdateTakesTime(chartUpdateTakesTime) {
      this.chartUpdateTakesTime = chartUpdateTakesTime
    },
    /**
     * @desc 设置图表错误信息
     * @param chartErrorMessage {ChartStore.ChartState['chartErrorMessage']}
     * @returns {void}
     */
    setChartType(chartType) {
      this.chartType = chartType
    },
    /**
     * @desc 设置图表加载状态
     * @param chartLoading {ChartStore.ChartState['chartLoading']}
     * @returns {void}
     */
    setChartLoading(chartLoading) {
      this.chartLoading = chartLoading
    },
    /**
     * @desc 设置图表id
     * @param chartId {ChartStore.ChartState['chartId']}
     * @returns {void}
     */
    setChartId(chartId) {
      this.chartId = chartId
    },
    /**
     * @desc 设置图表数据
     * @param chartData {ChartStore.ChartState['chartData']}
     * @returns {void}
     */
    setChartErrorMessage(chartErrorMessage) {
      this.chartErrorMessage = chartErrorMessage
    },
    /**
     * @desc 设置图表数据
     * @param chartData {ChartStore.ChartState['chartData']}
     * @returns {void}
     */
    setChartData(chartData) {
      this.chartData = chartData
    }
  }
})
