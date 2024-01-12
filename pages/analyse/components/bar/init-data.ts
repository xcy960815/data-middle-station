export const initData = () => {
  const ChartStore = useChartStore()
  const chartUpdateTime = computed(() => ChartStore.getChartUpdateTime)
  const chartUpdateTakesTime = computed(() => ChartStore.getChartUpdateTakesTime)
  const name = ref('')
  return {
    chartUpdateTime,
    chartUpdateTakesTime,
    name
  }
}
