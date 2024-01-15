




export const initData = ()=>{
    const HomePageStore = useHomepageStore()
    const chartsList = computed(() => HomePageStore.getCharts)
    return {
        chartsList
    }
}