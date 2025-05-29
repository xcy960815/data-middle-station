/**
 * @desc chart store
 */
interface ChartState {
  chartName: string
  chartUpdateTime: string
  chartUpdateTakesTime: string
  chartErrorMessage: string
  chartType: string
  chartId: string | null
  chartLoading: boolean
  chartData: any[]
}

import { defineStore } from 'pinia'

export const useChartStore = defineStore('chart', {
  state: (): ChartState => ({
    chartName: '',
    chartUpdateTime: '',
    chartUpdateTakesTime: '',
    chartErrorMessage: '',
    chartType: 'table',
    chartId: null,
    chartLoading: false,
    chartData: []
  }),
  getters: {
    /**
     * @desc 获取图表名称
     * @param state {ChartState}
     * @returns {string}
     */
    getChartName(state): string {
      return state.chartName
    },
    /**
     * @desc 获取图表更新时间
     * @param state {ChartState}
     * @returns {string}
     */
    getChartUpdateTime(state): string {
      return state.chartUpdateTime
    },
    /**
     * @desc 获取图表更新耗时
     * @param state {ChartState}
     * @returns {string}
     */
    getChartUpdateTakesTime(state): string {
      return state.chartUpdateTakesTime
    },
    /**
     * @desc 获取图表错误信息
     * @param state {ChartState}
     * @returns {string}
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
     * @param state {ChartState}
     * @returns {string}
     */
    getChartType(state): string {
      return state.chartType
    },
    /**
     * @desc 获取图表id
     * @param state {ChartState}
     * @returns {string | null}
     */
    getChartId(state): string | null {
      return state.chartId
    },
    /**
     * @desc 获取图表数据
     * @param state {ChartState}
     * @returns {any[]}
     */
    getChartData(state): any[] {
      return state.chartData
    }
  },
  actions: {
    /**
     * @desc 设置图表名称
     * @param chartName {string}
     * @returns {void}
     */
    setChartName(chartName: string) {
      this.chartName = chartName
    },
    /**
     * @desc 设置图表更新时间
     * @param chartUpdateTime {string}
     * @returns {void}
     */
    setChartUpdateTime(chartUpdateTime: string) {
      this.chartUpdateTime = chartUpdateTime
    },
    /**
     * @desc 设置图表更新耗时
     * @param chartUpdateTakesTime {string}
     * @returns {void}
     */
    setChartUpdateTakesTime(chartUpdateTakesTime: string) {
      this.chartUpdateTakesTime = chartUpdateTakesTime
    },
    /**
     * @desc 设置图表错误信息
     * @param chartErrorMessage {string}
     * @returns {void}
     */
    setChartType(chartType: string) {
      this.chartType = chartType
    },
    /**
     * @desc 设置图表加载状态
     * @param chartLoading {boolean}
     * @returns {void}
     */
    setChartLoading(chartLoading: boolean) {
      this.chartLoading = chartLoading
    },
    /**
     * @desc 设置图表id
     * @param chartId {string | null}
     * @returns {void}
     */
    setChartId(chartId: string | null) {
      this.chartId = chartId
    },
    /**
     * @desc 设置图表错误信息
     * @param chartErrorMessage {string}
     * @returns {void}
     */
    setChartErrorMessage(chartErrorMessage: string) {
      this.chartErrorMessage = chartErrorMessage
    },
    /**
     * @desc 设置图表数据
     * @param chartData {any[]}
     * @returns {void}
     */
    setChartData(chartData: any[]) {
      this.chartData = chartData
    }
  }
})
