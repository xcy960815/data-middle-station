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
    currentConfigId: null,
    chartLoading: false,
    analyzeData: [],
    chartErrorAnalysis: '',
    editorDirty: false,
    editorSaving: false,
    editorHydrating: true,
    lastSavedAt: '',
    lastSavedSnapshot: ''
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
    getCurrentConfigId(state) {
      return state.currentConfigId
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
    },
    /**
     * @desc 获取是否存在未保存改动
     */
    getEditorDirty(state): boolean {
      return state.editorDirty
    },
    /**
     * @desc 获取是否正在保存
     */
    getEditorSaving(state): boolean {
      return state.editorSaving
    },
    /**
     * @desc 获取是否处于初始化同步阶段
     */
    getEditorHydrating(state): boolean {
      return state.editorHydrating
    },
    /**
     * @desc 获取最近一次保存时间
     */
    getLastSavedAt(state): string {
      return state.lastSavedAt
    },
    /**
     * @desc 获取最近一次保存快照
     */
    getLastSavedSnapshot(state): string {
      return state.lastSavedSnapshot
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
     * @param currentConfigId {number | null}
     * @returns {void}
     */
    setCurrentConfigId(currentConfigId) {
      this.currentConfigId = currentConfigId
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
    },
    /**
     * @desc 设置脏状态
     */
    setEditorDirty(editorDirty: boolean) {
      this.editorDirty = editorDirty
    },
    /**
     * @desc 设置保存状态
     */
    setEditorSaving(editorSaving: boolean) {
      this.editorSaving = editorSaving
    },
    /**
     * @desc 设置初始化同步状态
     */
    setEditorHydrating(editorHydrating: boolean) {
      this.editorHydrating = editorHydrating
    },
    /**
     * @desc 设置最近一次保存时间
     */
    setLastSavedAt(lastSavedAt: string) {
      this.lastSavedAt = lastSavedAt
    },
    /**
     * @desc 设置最近一次保存快照
     */
    setLastSavedSnapshot(lastSavedSnapshot: string) {
      this.lastSavedSnapshot = lastSavedSnapshot
    }
  }
})
