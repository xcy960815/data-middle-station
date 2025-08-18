import { StoreNames } from './store-names'

export const useChartConfigStore = defineStore<
  ChartConfigStore.ChartConfigKey,
  BaseStore.State<ChartConfigStore.ChartConfigState>,
  BaseStore.Getters<ChartConfigStore.ChartConfigState, ChartConfigStore.ChartConfigGetters>,
  BaseStore.Actions<ChartConfigStore.ChartConfigState, ChartConfigStore.ChartConfigActions>
>(StoreNames.CHART_CONFIG, {
  state: () => ({
    chartConfigDrawer: false,
    chartConfig: {
      /**
       * @desc 折线图配置
       */
      line: {
        chartType: 'line',
        analyseName: '',
        chartUpdateTime: '',
        chartUpdateTakesTime: '',
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
        /** @desc 图表类型 */
        chartType: 'table',
        /** @desc 图表名称 */
        analyseName: '',
        /** @desc 图表更新时间 */
        chartUpdateTime: '',
        /** @desc 图表更新耗时 */
        chartUpdateTakesTime: '',
        /** @desc 展示方式 */
        displayMode: 'originalDisplay',
        /** @desc 是否显示对比 */
        showCompare: false,
        /** @desc 是否显示汇总 */
        showSummary: false,
        /** @desc 是否启用行高亮 */
        enableRowHoverHighlight: false,
        /** @desc 是否启用列高亮 */
        enableColHoverHighlight: false,
        /** @desc 是否显示边框 */
        border: true,
        /** @desc 悬停填充颜色 */
        highlightCellBackground: '#f5f7fa',
        /** @desc 表头高度 */
        headerHeight: 40,
        /** @desc 汇总高度 */
        summaryHeight: 40,
        /** @desc 是否显示汇总 */
        enableSummary: false,
        /** @desc 行高 */
        rowHeight: 40,
        /** @desc 滚动条大小 */
        scrollbarSize: 12,
        /** @desc 表格内边距 */
        tablePadding: 16,
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
        chartType: 'pie',
        analyseName: '',
        chartUpdateTime: '',
        chartUpdateTakesTime: '',
        showLabel: false
      },
      /**
       * @desc 柱状图配置
       */
      interval: {
        chartType: 'interval',
        analyseName: '',
        chartUpdateTime: '',
        chartUpdateTakesTime: '',
        displayMode: 'levelDisplay',
        showPercentage: false,
        showLabel: false,
        horizontalDisplay: false,
        horizontalBar: false
      }
    },
    commonChartConfig: {
      limit: 1000,
      analyseDesc: '',
      suggest: false,
      mixStrategy: '',
      shareStrategy: ''
    }
  }),

  getters: {
    getChartConfigDrawer: (state) => state.chartConfigDrawer,
    getChartConfig: (state) => state.chartConfig,
    getCommonChartConfig: (state) => state.commonChartConfig,
    /**
     * @desc 获取表格图配置
     */
    getTableChartConfig: (state) => state.chartConfig?.table || null
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
    setChartConfig(value) {
      this.chartConfig = value
    },
    /** @desc 设置表格图配置 */
    setTableChartConfig(value) {
      if (this.chartConfig) {
        this.chartConfig.table = value
      }
    },
    /** @desc 设置表格图配置条件 */
    setTableChartConditions(conditions) {
      if (this.chartConfig) {
        this.chartConfig.table.conditions = conditions
      }
    }
  }
})
