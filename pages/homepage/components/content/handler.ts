





export const handler = () => {
    const getCharts = async () => {
        // const res = await $fetch('/api/homepage/createOrUpdateChart', {
        //     method: 'POST',
        //     body: {
        //         name: "测试分析图表",
        //         filter: [], // 过滤条件
        //         group: [], // 分组条件
        //         dimension: [], // 维度
        //         order: [], // 排序
        //     }
        // })
        // console.log("res", res);

    }
    onMounted(() => {
        getCharts()
    })
    return {

    }
}