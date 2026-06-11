import {
  defaultAnalyzeAreaChartConfig,
  defaultAnalyzeComboChartConfig,
  defaultAnalyzeCommonChartConfig,
  defaultAnalyzeFunnelChartConfig,
  defaultAnalyzeIntervalChartConfig,
  defaultAnalyzeKpiCardConfig,
  defaultAnalyzeLineChartConfig,
  defaultAnalyzePieChartConfig,
  defaultAnalyzeScatterChartConfig,
  defaultAnalyzeStackedChartConfig,
  defaultAnalyzeTableChartConfig
} from '~/shared/analyzeChartConfigDefaults'
import { StoreNames } from './store-names'

export {
  defaultAnalyzeAreaChartConfig,
  defaultAnalyzeComboChartConfig,
  defaultAnalyzeCommonChartConfig,
  defaultAnalyzeFunnelChartConfig,
  defaultAnalyzeIntervalChartConfig,
  defaultAnalyzeKpiCardConfig,
  defaultAnalyzeLineChartConfig,
  defaultAnalyzePieChartConfig,
  defaultAnalyzeScatterChartConfig,
  defaultAnalyzeStackedChartConfig,
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
      interval: defaultAnalyzeIntervalChartConfig,
      /**
       * @desc 双轴组合图配置
       */
      combo: defaultAnalyzeComboChartConfig,
      /**
       * @desc 堆叠图配置
       */
      stacked: defaultAnalyzeStackedChartConfig,
      /**
       * @desc 面积图配置
       */
      area: defaultAnalyzeAreaChartConfig,
      /**
       * @desc 漏斗图配置
       */
      funnel: defaultAnalyzeFunnelChartConfig,
      /**
       * @desc 散点图配置
       */
      scatter: defaultAnalyzeScatterChartConfig,
      /**
       * @desc KPI 指标卡配置
       */
      kpiCard: defaultAnalyzeKpiCardConfig
    },
    /**
     * @desc 图表公共配置
     */
    commonChartConfig: defaultAnalyzeCommonChartConfig
  }),

  getters: {
    getChartConfigDrawer: (state) => state.chartConfigDrawer,
    getPrivateChartConfig: (state) => state.privateChartConfig,
    getCommonChartConfig: (state) => state.commonChartConfig
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
      /**
       * 以全量默认值为底，将传入值逐字段浅合并覆盖。
       * 目的：兼容旧数据——数据库里保存的 privateChartConfig 可能缺少
       * 后续新增的图表类型字段（如 funnel/scatter/area/stacked/combo/kpiCard），
       * 直接赋值会导致这些字段为 undefined，config 面板的 v-model 就会
       * 写入一个游离的普通对象而非响应式 store，配置调整因此不生效。
       */
      const fullDefaults: ChartConfigStore.PrivateChartConfig = {
        line: defaultAnalyzeLineChartConfig,
        table: defaultAnalyzeTableChartConfig,
        pie: defaultAnalyzePieChartConfig,
        interval: defaultAnalyzeIntervalChartConfig,
        combo: defaultAnalyzeComboChartConfig,
        stacked: defaultAnalyzeStackedChartConfig,
        area: defaultAnalyzeAreaChartConfig,
        funnel: defaultAnalyzeFunnelChartConfig,
        scatter: defaultAnalyzeScatterChartConfig,
        kpiCard: defaultAnalyzeKpiCardConfig
      }

      if (value) {
        // 逐字段覆盖：每个图表类型的配置用传入值替换默认值，
        // 若传入值没有该字段则保留默认值，确保每个 key 始终存在于响应式 store 中
        this.privateChartConfig = JSON.parse(
          JSON.stringify({
            ...fullDefaults,
            ...value
          })
        ) as ChartConfigStore.PrivateChartConfig
      } else {
        this.privateChartConfig = JSON.parse(JSON.stringify(fullDefaults)) as ChartConfigStore.PrivateChartConfig
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
