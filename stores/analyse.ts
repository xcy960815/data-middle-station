import { StoreNames } from './store-names'

export const useAnalyseStore = defineStore<
  AnalyseStore.AnalyseKey,
  BaseStore.State<AnalyseStore.AnalyseState>,
  BaseStore.Getters<AnalyseStore.AnalyseState, AnalyseStore.AnalyseGetters>,
  BaseStore.Actions<AnalyseStore.AnalyseState, AnalyseStore.AnalyseActions>
>(StoreNames.CHART, {
  state: () => ({
    analyseName: '',
    analyseDesc: '',
    chartUpdateTime: '',
    chartUpdateTakesTime: '',
    chartErrorMessage: '',
    chartType: 'table',
    chartId: null,
    chartConfigId: null,
    chartLoading: false,
    chartData: [],
  }),
  getters: {
    /**
     * @desc 获取图表名称
     */
    getAnalyseName(state) {
      return state.analyseName
    },
    /**
     * @desc 获取图表描述
     */
    getAnalyseDesc(state) {
      return state.analyseDesc
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
     * @param state {AnalyseState}
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
    },
  },
  actions: {
    /**
     * @desc 设置图表名称
     * @param analyseName {string}
     * @returns {void}
     */
    setAnalyseName(analyseName) {
      this.analyseName = analyseName
    },
    /**
     * @desc 设置图表描述
     * @param analyseDesc {string}
     * @returns {void}
     */
    setAnalyseDesc(analyseDesc) {
      this.analyseDesc = analyseDesc
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
    },
  },
})
