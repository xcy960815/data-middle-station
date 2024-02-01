/**
 * @desc 初始化数据
 * @returns 
 */
export const initData = () => {
  const dimensionStore = useDimensionStore();
  /**
   * @desc dimensionList
   * @returns {ComputedRef<DimensionStore.DimensionOption[]>}
   */
  const dimensionList = computed(() => {
    const dimensionList =  dimensionStore.getDimensions;  
    return dimensionList
  });
  return {
    dimensionList,
  };
};
