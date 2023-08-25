export const initData = () => {
  const filterStore = useFilterStore();
  const filterList = computed<FilterStore.FilterState['filters']>(() =>
    filterStore.getFilters<'filters'>(),
  );
  return { filterList };
};
