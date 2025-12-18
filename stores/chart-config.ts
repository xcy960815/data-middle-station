import {
  defaultCommonChartConfig,
  defaultIntervalChartConfig,
  defaultLineChartConfig,
  defaultPieChartConfig,
  defaultTableChartConfig
} from '~/shared/chartDefaults'
import { StoreNames } from './store-names'

export {
  defaultCommonChartConfig,
  defaultIntervalChartConfig,
  defaultLineChartConfig,
  defaultPieChartConfig,
  defaultTableChartConfig
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
      line: defaultLineChartConfig,
      /**
       * @desc 表格图配置
       */
      table: defaultTableChartConfig,
      /**
       * @desc 饼图配置
       */
      pie: defaultPieChartConfig,
      /**
       * @desc 柱状图配置
       */
      interval: defaultIntervalChartConfig
    },
    /**
     * @desc 图表公共配置
     */
    commonChartConfig: defaultCommonChartConfig
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
            line: defaultLineChartConfig,
            table: defaultTableChartConfig,
            pie: defaultPieChartConfig,
            interval: defaultIntervalChartConfig
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
      // if (this.chartConfig) {
      //   this.chartConfig.table.conditions = JSON.parse(
      //     JSON.stringify(conditions)
      //   ) as ChartConfigStore.TableChartConfig['conditions']
      // }
    }
  }
})
