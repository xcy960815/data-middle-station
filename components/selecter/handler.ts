

type HandlerParams = {
    selecterVisible: Ref<boolean>
    isDimension: Ref<boolean>
    isGroup: Ref<boolean>
    isFilter: Ref<boolean>
    isOrder: Ref<boolean>
    index: number
    orderAggregations: Ref<Array<{ label: string, value: string }>>
    orderType: string
    name: string
}


export const handler = ({ selecterVisible, isFilter, isGroup, isDimension, isOrder, index, orderType,name, orderAggregations }: HandlerParams) => {
    const emits = defineEmits(['update:aggregationType', "update:orderType", "update:displayName"])
    const filterStore = useFilterStore();
    const orderStore = useOrderStore();
    const dimensionStore = useDimensionStore();
    const groupStore = useGroupStore();
    /**
     * @description: 点击标签
     */
    const handleClickTag = () => {
        selecterVisible.value = true
    }
    /**
     * @desc 删除标签
     */
    const handleDeleteTag = () => {
        if (isFilter.value) {
            filterStore.removeFilter(index)
        } else if (isOrder.value) {
            orderStore.removeOrder(index)
        } else if (isDimension.value) {
            dimensionStore.removeDimension(index)
        } else if (isGroup.value) {
            groupStore.removeGroup(index)
        }
    }

    /**
     * @desc 点击排序的升降序
     * @param e {Event}
     */
    const handleClickOrder = (e: Event) => {
        // 阻止冒泡
        e.stopPropagation()
        if (orderType === "desc") {
            emits('update:orderType', "asc")
        } else {
            emits('update:orderType', "desc")
        }
    }

    /**
     * @desc 点击排序的聚合类型
     * @param orderAggregationValue {OrderStore.OrderAggregationsType}
     * @returns void
     */
    const handleClickOrderAggregation = (orderAggregationValue: OrderStore.OrderAggregationsType) => {
        emits('update:aggregationType', orderAggregationValue)
        // 默认降序
        emits('update:orderType', "desc")
        // 重新计算displayName
        const currentDisplayName = orderAggregations.value.find(item => item.value === orderAggregationValue)?.label
        emits('update:displayName', `${currentDisplayName}(${name})`)
        selecterVisible.value = false
    }

    return {
        handleDeleteTag,
        handleClickTag,
        handleClickOrder,
        handleClickOrderAggregation
        
    }
}