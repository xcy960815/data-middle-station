




export const initData = () => {
    const HomePageStore = useHomepageStore()
    const chartsList = computed(() => HomePageStore.getCharts)
    const container = ref<HTMLDivElement>()
    // const cards = ref<NodeListOf<HTMLDivElement>>()
    return {
        chartsList,
        container,
        // cards
    }
}