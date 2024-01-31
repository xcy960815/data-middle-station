

interface Props {
    readonly name: string;
    readonly cast: "dimension" | "group" | "order" | "filter";
    readonly orderType: OrderStore.OrderType;
}

/**
 * @desc 初始化数据
 */
export const initData = (props:Props) => {
    const  selecterVisible = ref(false)
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


    return {
        selecterVisible,
        isDimension,
        isGroup,
        isFilter,
        isOrder
    }
}