export const initData = () => {
  const chartStore = useChartStore()
  const chartType = computed(() => {
    const chartType = chartStore.getChartType as ChartStore.ChartState['chartType']
    return chartType
  })
  const chartsType = ref([
    {
      name: 'table',
      image:
        '//si.geilicdn.com/hz_img_044b00000160691e3f220a02685e_300_200.jpeg'
    },
    {
      name: 'interval',
      image:
        '//si.geilicdn.com/hz_img_0a6900000160690fba580a026860_150_100_unadjust.png'
    },
    {
      name: 'line',
      image:
        '//si.geilicdn.com/hz_img_12da00000160690fba720a02685e_150_100_unadjust.png'
    },
    {
      name: 'pie',
      image:
        '//si.geilicdn.com/hz_img_12d900000160690fba6d0a02685e_300_200.jpeg'
    }
  ])
  return {
    chartsType,
    chartType
  }
}
