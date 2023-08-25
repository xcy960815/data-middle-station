export const initData = () => {
  const dimensionStore = useDimensionStore();
  /**
   * @desc dimensionList
   */
  const dimensionList = computed<DimensionStore.DimensionState['dimensions']>(() => {
    return dimensionStore.getDimensions<'dimensions'>();
  });
  return {
    dimensionList,
  };
};
