export const initData = () => {
  const dimensionStore = useDimensionStore();
  /**
   * @desc dimensionList
   * @returns {ComputedRef<DimensionStore.DimensionOption[]>}
   */
  const dimensionList = computed(() => {
    return dimensionStore.getDimensions;
  });
  return {
    dimensionList,
  };
};
