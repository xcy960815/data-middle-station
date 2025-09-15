<template>
  <selecter-template v-bind="$attrs" :display-name="displayName" :cast="cast" :index="index" :order="order">
    <template #order-icon>
      <!-- 降序 -->
      <icon-park
        class="chart-selecter-order-icon mr-1"
        v-if="orderType === 'asc'"
        type="arrow-circle-down"
        size="14"
        fill="#333"
        @click="handleClickOrder"
      />
      <!-- 升序 -->
      <icon-park
        class="chart-selecter-order-icon mr-1"
        v-if="orderType === 'desc'"
        type="arrow-circle-up"
        size="14"
        fill="#333"
        @click="handleClickOrder"
      />
    </template>
    <template #default>
      <div
        class="aggregation-option"
        @click="handleClickOrderAggregation(orderAggregation.value as OrderStore.OrderAggregationsType)"
        v-for="orderAggregation in orderAggregations"
      >
        <!-- 复现用户选择的聚合条件 -->
        <icon-park
          class="aggregation-mark"
          type="correct"
          size="14"
          fill="#333"
          v-if="orderAggregation.value === aggregationType"
        />
        <span>{{ orderAggregation.label }}</span>
      </div>
    </template>
  </selecter-template>
</template>

<script lang="ts" setup>
import { IconPark } from '@icon-park/vue-next/es/all'
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
    type: String as PropType<'dimensions' | 'groups' | 'orders' | 'filters'>,
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
  order: {
    type: Object as PropType<OrderStore.OrderOption>,
    default: () => ({})
  }
})

const emits = defineEmits(['update:orderType', 'update:aggregationType', 'update:displayName'])

const orderAggregations = ref([
  {
    label: '原始值',
    value: 'raw'
  },
  {
    label: '计数',
    value: 'count'
  },
  {
    label: '计数(去重)',
    value: 'countDistinct'
  },
  {
    label: '总计',
    value: 'sum'
  },
  {
    label: '平均',
    value: 'avg'
  },
  {
    label: '最大值',
    value: 'max'
  },
  {
    label: '最小值',
    value: 'min'
  }
])

/**
 * @desc 升降序icon图标
 */
const orderIconName = computed(() => (orderType: OrderStore.OrderType) => {
  return orderType === 'asc' ? 'arrow-circle-down' : 'arrow-circle-up'
})

/**
 * @desc 点击排序的升降序
 * @param e {Event}
 */
const handleClickOrder = (e: Event) => {
  // 阻止冒泡
  e.stopPropagation()
  emits('update:orderType', props.orderType === 'desc' ? 'asc' : 'desc')
}

/**
 * @desc 点击排序的聚合类型
 * @param orderAggregationValue {OrderStore.OrderAggregationsType}
 * @returns void
 */
const handleClickOrderAggregation = (orderAggregationValue: OrderStore.OrderAggregationsType) => {
  emits('update:aggregationType', orderAggregationValue)
  // 默认降序
  emits('update:orderType', 'desc')
  // 重新计算displayName
  const currentDisplayName = orderAggregations.value.find((item) => item.value === orderAggregationValue)?.label
  emits('update:displayName', `${currentDisplayName}(${props.name})`)
}
</script>
<style lang="scss" scoped></style>
