import { defineStore } from 'pinia'

export const useChartStore = defineStore<
  ChartStore.ChartKey,
  BaseStore.State<ChartStore.ChartState>,
  BaseStore.Getters<
    ChartStore.ChartState,
    ChartStore.ChartGetters
  >,
  BaseStore.Actions<
    ChartStore.ChartState,
    ChartStore.ChartActions
  >
>('chart', {
  state: () => ({
    chartName: '',
    chartDesc: '',
    chartUpdateTime: '',
    chartUpdateTakesTime: '',
    chartErrorMessage: '',
    chartType: 'table',
    chartId: null,
    chartConfigId: null,
    chartLoading: false,
    chartData: []
  }),
  getters: {
    /**
     * @desc 获取图表名称
     */
    getChartName(state) {
      return state.chartName
    },
    /**
     * @desc 获取图表描述
     */
    getChartDesc(state) {
      return state.chartDesc
    },
    /**
     * @desc 获取图表更新时间
     */
    getChartUpdateTime(state) {
      return state.chartUpdateTime
    },
    /**
     * @desc 获取图表更新耗时
     */
    getChartUpdateTakesTime(state): string {
      return state.chartUpdateTakesTime
    },
    /**
     * @desc 获取图表错误信息
     */
    getChartErrorMessage(state): string {
      return state.chartErrorMessage
    },
    /**
     * @desc 获取图表加载状态
     * @param state {ChartState}
     * @returns {boolean}
     */
    getChartLoading(state): boolean {
      return state.chartLoading
    },
    /**
     * @desc 获取图表类型
     */
    getChartType(state) {
      return state.chartType
    },
    /**
     * @desc 获取图表id
     */
    getChartId(state) {
      return state.chartId
    },
    /**
     * @desc 获取图表配置id
     */
    getChartConfigId(state) {
      return state.chartConfigId
    },
    /**
     * @desc 获取图表数据
     */
    getChartData(state) {
      return state.chartData
    }
  },
  actions: {
    /**
     * @desc 设置图表名称
     * @param chartName {string}
     * @returns {void}
     */
    setChartName(chartName) {
      this.chartName = chartName
    },
    /**
     * @desc 设置图表描述
     * @param chartDesc {string}
     * @returns {void}
     */
    setChartDesc(chartDesc) {
      this.chartDesc = chartDesc
    },
    /**
     * @desc 设置图表更新时间
     * @param chartUpdateTime {string}
     * @returns {void}
     */
    setChartUpdateTime(chartUpdateTime) {
      this.chartUpdateTime = chartUpdateTime
    },
    /**
     * @desc 设置图表更新耗时
     * @param chartUpdateTakesTime {string}
     * @returns {void}
     */
    setChartUpdateTakesTime(chartUpdateTakesTime) {
      this.chartUpdateTakesTime = chartUpdateTakesTime
    },
    /**
     * @desc 设置图表错误信息
     * @param chartErrorMessage {string}
     * @returns {void}
     */
    setChartType(chartType) {
      this.chartType = chartType
    },
    /**
     * @desc 设置图表加载状态
     * @param chartLoading {boolean}
     * @returns {void}
     */
    setChartLoading(chartLoading) {
      this.chartLoading = chartLoading
    },
    /**
     * @desc 设置图表id
     * @param chartId {string | null}
     * @returns {void}
     */
    setChartId(chartId) {
      this.chartId = chartId
    },
    /**
     * @desc 设置图表配置id
     * @param chartConfigId {number | null}
     * @returns {void}
     */
    setChartConfigId(chartConfigId) {
      this.chartConfigId = chartConfigId
    },
    /**
     * @desc 设置图表错误信息
     */
    setChartErrorMessage(chartErrorMessage) {
      this.chartErrorMessage = chartErrorMessage
    },
    /**
     * @desc 设置图表数据
     */
    setChartData(chartData) {
      this.chartData = chartData
    }
  }
})
