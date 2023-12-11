export const initData = () => {
  const dimensionStore = useDimensionStore();
  /**
   * @desc dimensionList
   * @returns {ComputedRef<DimensionStore.Dimension[]>}
   */
  const dimensionList = computed(() => {
    return dimensionStore.getDimensions;
  });
  return {
    dimensionList,
  };
};
