import { StoreNames } from './store-names'

export const useAnalyzeStore = defineStore<
  AnalyzeStore.AnalyzeKey,
  BaseStore.State<AnalyzeStore.AnalyzeState>,
  BaseStore.Getters<AnalyzeStore.AnalyzeState, AnalyzeStore.AnalyzeGetters>,
  BaseStore.Actions<AnalyzeStore.AnalyzeState, AnalyzeStore.AnalyzeActions>
>(StoreNames.CHART, {
  state: () => ({
    analyzeName: '',
    analyzeId: null,
    analyzeDesc: '',
    chartUpdateTime: '',
    chartUpdateTakesTime: '',
    chartErrorMessage: '',
    chartType: 'table',
    chartConfigId: null,
    chartLoading: false,
    analyzeData: [],
    chartErrorAnalysis: ''
  }),
  getters: {
    /**
     * @desc 获取图表名称
     */
    getAnalyzeName(state) {
      return state.analyzeName
    },
    /**
     * @desc 获取图表描述
     */
    getAnalyzeDesc(state) {
      return state.analyzeDesc
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
     * @param state {AnalyzeState}
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
    getAnalyzeId(state) {
      return state.analyzeId
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
    getAnalyzeData(state) {
      return state.analyzeData
    },
    /**
     * @desc 获取图表错误分析
     */
    getChartErrorAnalysis(state): string {
      return state.chartErrorAnalysis
    }
  },
  actions: {
    /**
     * @desc 设置图表名称
     * @param analyzeName {string}
     * @returns {void}
     */
    setAnalyzeName(analyzeName) {
      this.analyzeName = analyzeName
    },
    /**
     * @desc 设置图表描述
     * @param analyzeDesc {string}
     * @returns {void}
     */
    setAnalyzeDesc(analyzeDesc) {
      this.analyzeDesc = analyzeDesc
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
     * @desc 设置分析id
     * @param analyzeId {string | null}
     * @returns {void}
     */
    setAnalyzeId(analyzeId) {
      this.analyzeId = analyzeId
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
    setAnalyzeData(analyzeData) {
      this.analyzeData = analyzeData
    },
    /**
     * @desc 设置图表错误分析
     */
    setChartErrorAnalysis(chartErrorAnalysis) {
      this.chartErrorAnalysis = chartErrorAnalysis
    }
  }
})
