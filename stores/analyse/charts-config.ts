/**
 * @desc 图表配置 store
 * @desc setup 用法
 */
export const useChartConfigStore = definePiniaStore<
  'chartsConfig',
  {
    chartsConfigDrawer: Ref<boolean>
    /**
     * @desc 图表公共配置
     */
    chartCommonConfigData: {
      // 描述
      description: string
      // 数据量
      limit: number
      // 智能作图建议
      suggest: boolean
      // 缓存策略
      mixStrategy: string
      // 分享
      shareStrategy: string
    }
    setChartsConfigDrawer: (drawer: boolean) => void
    // 折线图配置
    chartConfigData: {
      /**
       * @desc 折线图配置
       */
      line: {
        // 是否画圆点
        showPoint: boolean
        // 是否显示文字
        showLabel: boolean
        // 是否平滑展示
        smooth: boolean
        // 是否自动双轴
        autoDualAxis: boolean
        // 是否横向拖动条
        horizontalBar: boolean
      }
      /**
       * @desc 柱状图配置
       */
      interval: {
        // 展示方式
        displayMode: string // 'levelDisplay' | 'stackDisplay'
        // 是否百分比显示
        showPercentage: boolean
        // 是否显示文字
        showLabel: boolean
        // 水平展示
        horizontalDisplay: boolean
        // 横线滚动
        horizontalBar: boolean
      }
      /**
       * @desc 饼图配置
       */
      pie: {
        // 是否显示文字
        showLabel: boolean
        // 图表类型
        chartType: string // "pie" | "rose"
      }
      /**
       * @desc 表格配置
       */
      table: {
        displayMode: string // "originalDisplay"|"aggregationDisplay"
        showCompare: boolean
        conditions: Array<{}>
      }
    }
  }
>('chartsConfig', () => {
  const chartsConfigDrawer = ref(false)
  /**
   * @desc 图表公共配置
   */
  const chartCommonConfigData = reactive({
    description: '',
    limit: 1000,
    suggest: false,
    mixStrategy: 'daily',
    shareStrategy: ''
  })
  /**
   * @desc 图表配置
   */
  const chartConfigData = reactive({
    // 折线图配置
    line: {
      showPoint: false,
      showLabel: false,
      smooth: false,
      autoDualAxis: false,
      horizontalBar: false
    },
    // 柱状图配置
    interval: {
      // 展示方式
      displayMode: 'levelDisplay',
      // 是否百分比显示
      showPercentage: false,
      // 是否显示文字
      showLabel: false,
      // 水平展示
      horizontalDisplay: false,
      // 横线滚动
      horizontalBar: false
    },
    pie: {
      showLabel: false,
      chartType: 'pie'
    },
    table: {
      displayMode: 'originalDisplay',
      showCompare: false,
      conditions: []
    }
  })
  /**
   * @desc 设置图表配置抽屉
   * @param {boolean} drawer
   */
  const setChartsConfigDrawer = (drawer: boolean) => {
    chartsConfigDrawer.value = drawer
  }

  return {
    chartsConfigDrawer,
    chartCommonConfigData,
    chartConfigData,
    setChartsConfigDrawer
  }
})
