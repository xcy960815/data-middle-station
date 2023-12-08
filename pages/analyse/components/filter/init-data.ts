export const initData = () => {
  const filterStore = useFilterStore();
  const filterList = computed(() =>
    filterStore.getFilters,
  );
  return { filterList };
};
