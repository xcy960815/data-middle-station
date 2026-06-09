import {
  defaultAnalyzeCommonChartConfig,
  defaultAnalyzeIntervalChartConfig,
  defaultAnalyzeLineChartConfig,
  defaultAnalyzePieChartConfig,
  defaultAnalyzeTableChartConfig
} from '~/shared/analyzeChartConfigDefaults'
import { StoreNames } from './store-names'

export {
  defaultAnalyzeCommonChartConfig,
  defaultAnalyzeIntervalChartConfig,
  defaultAnalyzeLineChartConfig,
  defaultAnalyzePieChartConfig,
  defaultAnalyzeTableChartConfig
}

export const useChartConfigStore = defineStore<
  ChartConfigStore.ChartConfigKey,
  BaseStore.State<ChartConfigStore.ChartConfigState>,
  BaseStore.Getters<ChartConfigStore.ChartConfigState, ChartConfigStore.ChartConfigGetters>,
  BaseStore.Actions<ChartConfigStore.ChartConfigState, ChartConfigStore.ChartConfigActions>
>(StoreNames.CHART_CONFIG, {
  state: () => ({
    /**
     * @desc 图表配置抽屉
     */
    chartConfigDrawer: false,
    /**
     * @desc 私有图表配置
     */
    privateChartConfig: {
      /**
       * @desc 折线图配置
       */
      line: defaultAnalyzeLineChartConfig,
      /**
       * @desc 表格图配置
       */
      table: defaultAnalyzeTableChartConfig,
      /**
       * @desc 饼图配置
       */
      pie: defaultAnalyzePieChartConfig,
      /**
       * @desc 柱状图配置
       */
      interval: defaultAnalyzeIntervalChartConfig
    },
    /**
     * @desc 图表公共配置
     */
    commonChartConfig: defaultAnalyzeCommonChartConfig
  }),

  getters: {
    getChartConfigDrawer: (state) => state.chartConfigDrawer,
    getPrivateChartConfig: (state) => state.privateChartConfig,
    getCommonChartConfig: (state) => state.commonChartConfig,
    /**
     * @desc 获取表格图配置
     */
    getTableChartConfig: (state) => state.privateChartConfig?.table || null
  },
  actions: {
    /**
     * @desc 设置图表配置抽屉
     * @param value 值
     */
    setChartConfigDrawer(value) {
      this.chartConfigDrawer = value
    },
    /**
     * @desc 设置图表公共配置
     * @param value 值
     */
    setCommonChartConfig(value) {
      this.commonChartConfig = value
    },
    /**
     * @desc 设置图表配置
     * @param value 值
     */
    setPrivateChartConfig(value) {
      this.privateChartConfig = value
        ? (JSON.parse(JSON.stringify(value)) as ChartConfigStore.PrivateChartConfig)
        : {
            line: defaultAnalyzeLineChartConfig,
            table: defaultAnalyzeTableChartConfig,
            pie: defaultAnalyzePieChartConfig,
            interval: defaultAnalyzeIntervalChartConfig
          }
    },
    /**
     * @desc 设置表格图配置
     * @param value 值
     */
    setTableChartConfig(value) {
      if (this.privateChartConfig) {
        this.privateChartConfig.table = JSON.parse(JSON.stringify(value)) as ChartConfigStore.TableChartConfig
      }
    },
    /**
     * @desc 设置表格图配置条件
     * @param conditions 条件
     */
    setTableChartConditions(conditions) {
      if (this.privateChartConfig) {
        this.privateChartConfig.table.conditions = JSON.parse(
          JSON.stringify(conditions)
        ) as ChartConfigStore.TableChartConfig['conditions']
      }
    }
  }
})
