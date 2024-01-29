



type HandlerParams = {
    container: Ref<HTMLDivElement | undefined>,
    // cards: Ref<NodeListOf<HTMLDivElement> | undefined>
}

/**
 * @desc 首页内容区域的逻辑处理 
 * @returns 
 */
export const handler = ({ container }: HandlerParams) => {
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
            nextTick(() => {
                // 添加window 日历效果
                const cards = container.value!.querySelectorAll<HTMLDivElement>('.card')
                container.value!.onmousemove = (e) => {
                    for (const card of cards) {
                        const rect = card.getBoundingClientRect()
                        const x = e.clientX - rect.left - rect.width / 2
                        const y = e.clientY - rect.top - rect.height / 2
                        card.style.setProperty('--x', `${x}px`)
                        card.style.setProperty('--y', `${y}px`)
                    }
                }
            })
        }
    }
    onMounted(() => {
        getCharts()
    })

    onUnmounted(() => {
        // container.value.onmousemove = null
        // console.log("container.value",container.value);
        
    })
    return {

    }
}