/**
 * @desc 初始化数据
 * @returns
 */
export const initData = () => {
  const dimensionStore = useDimensionStore()
  /**
   * @desc dimensionList
   * @returns {ComputedRef<DimensionStore.DimensionOption[]>}
   */
  const dimensionList = computed(() => {
    const dimensionList = dimensionStore.getDimensions
    console.log('dimensionList', dimensionList)

    return dimensionList
  })
  return {
    dimensionList
  }
}
