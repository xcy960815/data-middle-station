export const handler = () => {
  const chartsConfigStore = useChartConfigStore()
  const dimensionStore = useDimensionStore()
  const groupStore = useGroupStore()
  /**
   * @desc 点刷新按钮
   * @returns void
   */
  const handleClickRefresh = () => {
    console.log('handleClickRefresh')
  }
  /**
   * @desc 点报警按钮
   * @returns void
   */
  const handleClickAlarm = () => {
    console.log('handleClickAlarm')
  }
  /**
   * @desc 点设置按钮
   * @returns void
   */
  const handleClickSetting = () => {
    chartsConfigStore.setChartConfigDrawer(true)
  }
  /**
   * @desc 点全屏按钮
   * @returns void
   */
  const handleClickFullScreen = () => {
    console.log('handleClickFullScreen')
  }
  /**
   * @desc 点下载按钮
   * @returns void
   */
  const handleClickDownload = () => {
    const { $webworker } = useNuxtApp()
    const feilds = dimensionStore.getDimensions.concat(groupStore.getGroups)
    console.log('handleClickDownload', feilds)
  }
  return {
    handleClickRefresh,
    handleClickAlarm,
    handleClickSetting,
    handleClickFullScreen,
    handleClickDownload
  }
}
