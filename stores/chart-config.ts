import { StoreNames } from './store-names'

export const useChartConfigStore = defineStore<
  ChartConfigStore.ChartConfigKey,
  BaseStore.State<ChartConfigStore.ChartConfigState>,
  BaseStore.Getters<ChartConfigStore.ChartConfigState, ChartConfigStore.ChartConfigGetters>,
  BaseStore.Actions<ChartConfigStore.ChartConfigState, ChartConfigStore.ChartConfigActions>
>(StoreNames.CHART_CONFIG, {
  state: () => ({
    chartConfigDrawer: false,
    privateChartConfig: {
      /**
       * @desc 折线图配置
       */
      line: {
        showPoint: false,
        showLabel: false,
        smooth: false,
        autoDualAxis: false,
        horizontalBar: false
      },
      /**
       * @desc 表格图配置
       */
      table: {
        /** @desc 是否启用行高亮 */
        enableRowHoverHighlight: false,
        /** @desc 是否启用列高亮 */
        enableColHoverHighlight: false,
        /** @desc 高亮cell背景色 */
        highlightCellBackground: '#f5f7fa',
        /** @desc 表头高度 */
        headerHeight: 30,
        /** @desc 汇总高度 */
        summaryHeight: 30,
        /** @desc 是否显示汇总 */
        enableSummary: false,
        /** @desc 行高 */
        bodyRowHeight: 30,
        /** @desc 滚动条大小 */
        scrollbarSize: 12,
        /** @desc 表头背景色 */
        headerBackground: '#fafafa',
        /** @desc 表格奇数行背景色 */
        bodyBackgroundOdd: '#ffffff',
        /** @desc 表格偶数行背景色 */
        bodyBackgroundEven: '#fafafa',
        /** @desc 表格边框颜色 */
        borderColor: '#e5e7eb',
        /** @desc 表头文本颜色 */
        headerTextColor: '#374151',
        /** @desc 表格文本颜色 */
        bodyTextColor: '#374151',
        /** @desc 表头字体 */
        headerFontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, Noto Sans, Ubuntu, sans-serif',
        /** @desc 表头字体大小 */
        headerFontSize: 14,
        /** @desc 表格内容字体 */
        bodyFontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, Noto Sans, Ubuntu, sans-serif',
        /** @desc 表格内容字体大小 */
        bodyFontSize: 14,
        /** @desc 汇总字体 */
        summaryFontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, Noto Sans, Ubuntu, sans-serif',
        /** @desc 汇总字体大小 */
        summaryFontSize: 14,
        /** @desc 汇总背景色 */
        summaryBackground: '#f9fafb',
        /** @desc 汇总文本颜色 */
        summaryTextColor: '#374151',
        /** @desc 滚动条背景色 */
        scrollbarBackground: '#f3f4f6',
        /** @desc 滚动条滑块颜色 */
        scrollbarThumb: '#d1d5db',
        /** @desc 滚动条滑块悬停颜色 */
        scrollbarThumbHover: '#9ca3af',
        /** @desc 缓冲行数 */
        bufferRows: 5,
        /** @desc 最小自动列宽度 */
        minAutoColWidth: 80,
        /** @desc 滚动阈值 */
        scrollThreshold: 3,
        /** @desc 表头排序激活背景色 */
        headerSortActiveBackground: '#e5e7eb',
        /** @desc 可排序颜色 */
        sortableColor: '#6b7280',
        /** @desc 条件格式 */
        conditions: []
      },
      /**
       * @desc 饼图配置
       */
      pie: {
        showLabel: false,
        chartType: 'pie' as 'pie' | 'rose'
      },
      /**
       * @desc 柱状图配置
       */
      interval: {
        displayMode: 'levelDisplay',
        showPercentage: false,
        showLabel: false,
        horizontalDisplay: false,
        horizontalBar: false
      }
    },
    /**
     * @desc 图表公共配置
     */
    commonChartConfig: {
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
        : null
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
