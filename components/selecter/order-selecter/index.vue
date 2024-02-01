<template>
    <selecter-template v-bind="$attrs">
        <template #order-icon>
            <Icon class="chart-selecter-order-icon" @click="handleClickOrder" :icon="orderIconName(orderType)" />
        </template>
        <template>
            <div class="aggregation-option"
                @click="handleClickOrderAggregation(orderAggregation.value as OrderStore.OrderAggregationsType)"
                v-for="orderAggregation in orderAggregations">
                <!-- 复现用户选择的聚合条件 -->
                <Icon class="aggregation-mark" icon="icon-park-solid:correct"
                    v-if="orderAggregation.value === aggregationType" />
                <span>{{ orderAggregation.label }}</span>
            </div>
        </template>
    </selecter-template>
</template>

<script lang='ts' setup>
import SelecterTemplate from "../selecter-template/index.vue";

const props = defineProps({
    name: {
        type: String,
        default: ''
    },
    // 通用参数
    displayName: {
        type: String,
        default: ''
    },
    // 通用参数
    cast: {
        type: String as PropType<'dimension' | 'group' | 'order' | 'filter'>,
        default: ''
    },
    orderType: {
        type: String as PropType<OrderStore.OrderType>,
        default: ''
    },
    // 通用参数
    index: {
        type: Number,
        default: null,
        required: true
    },
    // 聚合方式
    aggregationType: {
        type: String as PropType<OrderStore.OrderAggregationsType>,
        default: ''
    },
})

const emits = defineEmits(['update:orderType', 'update:aggregationType', 'update:displayName'])

const orderAggregations = ref([
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
])


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


/**
 * @desc 点击排序的升降序
 * @param e {Event}
 */
const handleClickOrder = (e: Event) => {
    // 阻止冒泡
    e.stopPropagation()
    if (props.orderType === "desc") {
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
    // selecterVisible.value = false
}
</script>
<style lang='less' scoped></style>