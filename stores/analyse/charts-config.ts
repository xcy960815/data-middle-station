/**
 * @desc 图表配置 store
 * @desc setup 用法
 */
export const useChartsConfigStore = definePiniaStore<
  'chartsConfig',
  {
    chartsConfigDrawer: Ref<boolean>
    chartsConfigDrawerWidth: Ref<number>
    chartsConfigDrawerTitle: Ref<string>
    setChartsConfigDrawer: (drawer: boolean) => void
  }
>('chartsConfig', () => {
  const chartsConfigDrawer = ref(false)
  const chartsConfigDrawerWidth = ref(300)
  const chartsConfigDrawerTitle = ref('图表配置')
  /**
   * @desc 设置图表配置抽屉
   * @param {boolean} drawer
   */
  const setChartsConfigDrawer = (drawer: boolean) => {
    chartsConfigDrawer.value = drawer
  }

  return {
    chartsConfigDrawer,
    chartsConfigDrawerWidth,
    chartsConfigDrawerTitle,
    setChartsConfigDrawer
  }
})
