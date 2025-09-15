import { StoreNames } from './store-names'
/**
 * @desc 默认表格图配置
 */
export const defaultTableChartConfig: ChartConfigVo.TableChartConfig = {
  /**
   * @desc 是否启用行悬停高亮
   */
  enableRowHoverHighlight: false,
  /**
   * @desc 是否启用列悬停高亮
   */
  enableColHoverHighlight: false,
  /**
   * @desc 高亮单元格背景色
   */
  highlightCellBackground: '#f5f7fa',
  /**
   * @desc 行悬停高亮背景色
   */
  highlightRowBackground: 'rgba(24, 144, 255, 0.1)',
  /**
   * @desc 列悬停高亮背景色
   */
  highlightColBackground: 'rgba(24, 144, 255, 0.1)',
  /**
   * @desc 表头高度
   */
  headerHeight: 30,
  /**
   * @desc 汇总高度
   */
  summaryHeight: 30,
  /**
   * @desc 是否启用汇总
   */
  enableSummary: false,
  /**
   * @desc 行高
   */
  bodyRowHeight: 30,
  /**
   * @desc 滚动条大小
   */
  scrollbarSize: 12,
  /**
   * @desc 表头背景色
   */
  headerBackground: '#fafafa',
  /**
   * @desc 表格奇数行背景色
   */
  bodyBackgroundOdd: '#ffffff',
  /**
   * @desc 表格偶数行背景色
   */
  bodyBackgroundEven: '#fafafa',
  /**
   * @desc 表格边框颜色
   */
  borderColor: '#e5e7eb',
  /**
   * @desc 表头文本颜色
   */
  headerTextColor: '#374151',
  /**
   * @desc 表格文本颜色
   */
  bodyTextColor: '#374151',
  /**
   * @desc 表头字体
   */
  headerFontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, Noto Sans, Ubuntu, sans-serif',
  /**
   * @desc 表头字体大小
   */
  headerFontSize: 14,
  /**
   * @desc 表格字体
   */
  bodyFontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, Noto Sans, Ubuntu, sans-serif',
  /**
   * @desc 表格字体大小
   */
  bodyFontSize: 14,
  /**
   * @desc 汇总字体
   */
  summaryFontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, Noto Sans, Ubuntu, sans-serif',
  /**
   * @desc 汇总字体大小
   */
  summaryFontSize: 14,
  /**
   * @desc 汇总背景色
   */
  summaryBackground: '#f9fafb',
  /**
   * @desc 汇总文本颜色
   */
  summaryTextColor: '#374151',
  /**
   * @desc 滚动条背景色
   */
  scrollbarBackground: '#f3f4f6',
  /**
   * @desc 滚动条滑块颜色
   */
  scrollbarThumb: '#d1d5db',
  /**
   * @desc 滚动条滑块悬停颜色
   */
  scrollbarThumbHover: '#9ca3af',
  /**
   * @desc 缓冲行数
   */
  bufferRows: 5,
  /**
   * @desc 最小自动列宽度
   */
  minAutoColWidth: 80,
  /**
   * @desc 滚动阈值
   */
  scrollThreshold: 3,
  /**
   * @desc 表头排序激活背景色
   */
  sortActiveBackground: '#e5e7eb',
  /**
   * @desc 可排序颜色
   */
  sortActiveColor: '#6b7280'
}

/**
 * @desc 默认饼图配置
 */
export const defaultPieChartConfig: ChartConfigVo.PieChartConfig = {
  /**
   * @desc 是否显示标签
   */
  showLabel: false,
  /**
   * @desc 图表类型
   */
  chartType: 'pie' as 'pie' | 'rose'
}

/**
 * @desc 默认柱状图配置
 */
export const defaultIntervalChartConfig: ChartConfigVo.IntervalChartConfig = {
  /**
   * @desc 显示模式
   */
  displayMode: 'levelDisplay' as 'levelDisplay' | 'stackedDisplay',
  /**
   * @desc 是否显示百分比
   */
  showPercentage: false,
  /**
   * @desc 是否显示标签
   */
  showLabel: false,
  /**
   * @desc 是否水平显示
   */
  horizontalDisplay: false,
  /**
   * @desc 是否水平显示
   */
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
