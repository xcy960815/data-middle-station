





export const handler = () => {
    const HomePageStore = useHomepageStore()
    /**
     * @description 获取所有的图表
     */
    const getCharts = async () => {
        const res = await $fetch('/api/homepage/getCharts', {
            method: 'POST',
        })
        if (res.code === 200) {

            HomePageStore.setCharts(res.data || [])
        }
    }
    onMounted(() => {
        getCharts()
    })
    return {

    }
}