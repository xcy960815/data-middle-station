import { StoreNames } from './store-names'
/**
 * @desc 默认表格图配置
 */
export const defaultTableChartConfig: ChartConfigVo.TableChartConfig = {
  enableRowHoverHighlight: false,
  enableColHoverHighlight: false,
  highlightCellBackground: '#f5f7fa',
  headerHeight: 30,
  summaryHeight: 30,
  enableSummary: false,
  bodyRowHeight: 30,
  scrollbarSize: 12,
  headerBackground: '#fafafa',
  bodyBackgroundOdd: '#ffffff',
  bodyBackgroundEven: '#fafafa',
  borderColor: '#e5e7eb',
  headerTextColor: '#374151',
  bodyTextColor: '#374151',
  headerFontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, Noto Sans, Ubuntu, sans-serif',
  headerFontSize: 14,
  bodyFontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, Noto Sans, Ubuntu, sans-serif',
  bodyFontSize: 14,
  summaryFontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, Noto Sans, Ubuntu, sans-serif',
  summaryFontSize: 14,
  summaryBackground: '#f9fafb',
  summaryTextColor: '#374151',
  scrollbarBackground: '#f3f4f6',
  scrollbarThumb: '#d1d5db',
  scrollbarThumbHover: '#9ca3af',
  bufferRows: 5,
  minAutoColWidth: 80,
  scrollThreshold: 3,
  headerSortActiveBackground: '#e5e7eb',
  sortableColor: '#6b7280'
}

/**
 * @desc 默认饼图配置
 */
export const defaultPieChartConfig: ChartConfigVo.PieChartConfig = {
  showLabel: false,
  chartType: 'pie' as 'pie' | 'rose'
}

/**
 * @desc 默认柱状图配置
 */
export const defaultIntervalChartConfig: ChartConfigVo.IntervalChartConfig = {
  displayMode: 'levelDisplay',
  showPercentage: false,
  showLabel: false,
  horizontalDisplay: false,
  horizontalBar: false
}

/**
 * @desc 默认折线图配置
 */
export const defaultLineChartConfig: ChartConfigVo.LineChartConfig = {
  showPoint: false,
  showLabel: false,
  smooth: false,
  autoDualAxis: false,
  horizontalBar: false
}

/**
 * @desc 默认图表公共配置
 */
export const defaultCommonChartConfig: ChartConfigVo.CommonChartConfig = {
  /**
   * @desc 数据量上限
   */
  limit: 1000,
  /**
   * @desc 分析描述
   */
  analyseDesc: '',
  /**
   * @desc 分享策略
   */
  shareStrategy: ''
}

export const useChartConfigStore = defineStore<
  ChartConfigStore.ChartConfigKey,
  BaseStore.State<ChartConfigStore.ChartConfigState>,
  BaseStore.Getters<ChartConfigStore.ChartConfigState, ChartConfigStore.ChartConfigGetters>,
  BaseStore.Actions<ChartConfigStore.ChartConfigState, ChartConfigStore.ChartConfigActions>
>(StoreNames.CHART_CONFIG, {
  state: () => ({
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
    /** @desc 设置图表配置抽屉 */
    setChartConfigDrawer(value) {
      this.chartConfigDrawer = value
    },
    /** @desc 设置图表公共配置 */
    setCommonChartConfig(value) {
      this.commonChartConfig = value
    },
    /** @desc 设置图表配置 */
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
    /** @desc 设置表格图配置 */
    setTableChartConfig(value) {
      if (this.privateChartConfig) {
        this.privateChartConfig.table = JSON.parse(JSON.stringify(value)) as ChartConfigStore.TableChartConfig
      }
    },
    /** @desc 设置表格图配置条件 */
    setTableChartConditions(conditions) {
      // if (this.chartConfig) {
      //   this.chartConfig.table.conditions = JSON.parse(
      //     JSON.stringify(conditions)
      //   ) as ChartConfigStore.TableChartConfig['conditions']
      // }
    }
  }
})
