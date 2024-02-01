

interface Props {
    readonly cast: "dimension" | "group" | "order" | "filter";
    readonly orderType: OrderStore.OrderType;
}

const ALL_AGGREGATIONS = [
    {
        label: "原始值",
        value: "raw",
    }, {
        label: "计数",
        value: "count",
    }, {
        label: "计数(去重)",
        value: "countDistinct",
    }, {
        label: "总计",
        value: "sum"
    }, {
        label: "平均",
        value: "avg"
    }, {
        label: "最大值",
        value: "max"
    }, {
        label: "最小值",
        value: "min"
    }
]

/**
 * @desc 初始化数据
 */
export const initData = (props: Props) => {
    // 筛选聚合函数
    const filterAggregations = computed(() => ALL_AGGREGATIONS)
    // 排序聚合函数
    const orderAggregations = computed(() => ALL_AGGREGATIONS.filter(item => item.value !== 'countDistinct'))


    const selecterVisible = ref(false)
    /**
     * @description 判断当前tag是维度还是度量
     * @returns {boolean}
     */
    const isDimension = computed(() => props.cast === 'dimension')

    /**
     * @description 判断当前tag是分组还是度量
     * @returns {boolean}
     */
    const isGroup = computed(() => props.cast === 'group')

    /**
     * @description 判断当前tag是排序还是过滤
     * @returns {boolean}
     */
    const isFilter = computed(() => props.cast === 'filter')

    /**
     * @description 判断当前tag是排序还是过滤
     * @returns {boolean}
     */
    const isOrder = computed(() => props.cast === 'order')

    /**
     * @desc 升降序icon图标
     */
    const orderIconName = computed(() => (orderType: OrderStore.OrderType) => {
        if (orderType === 'asc') {
            return 'mdi:arrow-top-bold'
        } else if (orderType === 'desc') {
            return 'mdi:arrow-bottom-bold'
        } else {
            return ''
        }
    })
    return {
        filterAggregations,
        orderAggregations,
        selecterVisible,
        isDimension,
        isGroup,
        isFilter,
        isOrder,
        orderIconName
    }
}