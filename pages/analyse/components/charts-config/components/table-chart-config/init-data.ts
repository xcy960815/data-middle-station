



export const initData = () => {
    const conditionDialogVisible = ref(false)
    const chartsConfigStore = useChartConfigStore()
    const dimensionStore = useDimensionStore()
    const groupStore = useGroupStore()
    const tableChartConfigData = computed(() => {
        return chartsConfigStore.chartConfig.table
    })
    const conditionSymbolMap: { [k: string]: string } = {
        between: '介于',
        gt: '大于',
        lt: '小于',
        eq: '等于',
        neq: '不等于',
        gte: '大于等于',
        lte: '小于等于'
    }
    // 单色配色列表
    const monochromeColorList = [
        {
            label: '红色系',
            options: [
                { label: '██████', color: 'rgb(235, 80, 126)' },
                { label: '██████', color: 'rgb(238, 75, 75)' },
                { label: '██████', color: 'rgb(173, 27, 7)' }
            ]
        },
        {
            label: '绿色系',
            options: [
                { label: '██████', color: 'rgb(67, 178, 68)' },
                { label: '██████', color: 'rgb(64, 162, 118)' },
                { label: '██████', color: 'rgb(18, 161, 130)' }
            ]
        },
        {
            label: '黄色系',
            options: [
                { label: '██████', color: 'rgb(250, 204, 135)' },
                { label: '██████', color: 'rgb(241, 202, 23)' },
                { label: '██████', color: 'rgb(252, 161, 4)' }
            ]
        },
        {
            label: '蓝色系',
            options: [
                { label: '██████', color: 'rgb(114, 175, 217)' },
                { label: '██████', color: 'rgb(19 ,138 ,221)' },
                { label: '██████', color: 'rgb(169, 153, 201)' }
            ]
        }
    ]
    // 多色配色列表
    const multiColorList = [
        { label: '██████', color: 'rgb(255, 117, 78)' },
        { label: '██████', color: 'rgb(247, 144, 163)' },
        { label: '██████', color: 'rgb(140, 192, 253)' },
        { label: '██████', color: 'rgb(25, 170, 209)' },
        { label: '██████', color: 'rgb(109, 215, 163)' },
        { label: '██████', color: 'rgb(147, 190, 196)' },
        { label: '██████', color: 'rgb(253, 240, 111)' },
        { label: '██████', color: 'rgb(195, 86, 145)' }
    ]

    const conditionsState = reactive<{
        conditions: Array<ChartConfigStore.TableChartConfigConditionOption>
    }>({
        conditions: []
    })
    /**
     * @desc 可以选择的字段
     * @returns Array<Dimension | Group>
     */
    const fields = computed(() => {
        const fields = dimensionStore.getDimensions.concat(groupStore.getGroups).filter((field) => {
            return field.columnType?.includes('int') || field.columnType?.includes('float') || field.columnType?.includes('double')
        })

        return fields
    })
    return {
        conditionDialogVisible,
        chartsConfigStore,
        dimensionStore,
        groupStore,
        tableChartConfigData,
        conditionSymbolMap,
        monochromeColorList,
        multiColorList,
        conditionsState,
        fields
    }
}