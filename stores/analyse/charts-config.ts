/**
 * @desc 图表配置 store
 * @desc setup 用法
 */
export const useChartsConfigStore = definePiniaStore<
  'chartsConfig',
  {
    chartsConfigDrawer: Ref<boolean>
    /* 图表公共配置 */
    commonConfigFormData: {
      description: string
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
    chartConfigFormData: {
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
    }
  }
>('chartsConfig', () => {
  const chartsConfigDrawer = ref(false)
  /**
   * @desc 图表公共配置
   */
  const commonConfigFormData = reactive({
    description: '',
    limit: 0,
    suggest: false,
    mixStrategy: 'daily',
    shareStrategy: ''
  })
  /**
   * @desc 图表配置
   */
  const chartConfigFormData = reactive({
    // 折线图配置
    line: {
      showPoint: false,
      showLabel: false,
      smooth: false,
      autoDualAxis: false,
      horizontalBar: false
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
    commonConfigFormData,
    chartConfigFormData,
    setChartsConfigDrawer
  }
})
