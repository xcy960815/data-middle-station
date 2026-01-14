<template>
  <selector-template
    v-bind="$attrs"
    :display-name="displayName"
    :cast="cast"
    :index="index"
    :order="order"
    ref="selectorTemplateRef"
  >
    <template #order-icon>
      <!-- 降序 -->
      <icon-park
        class="chart-selector-order-icon mr-1"
        v-if="orderType === 'asc'"
        type="arrow-circle-down"
        size="14"
        fill="#333"
        @click="handleClickOrder"
      />
      <!-- 升序 -->
      <icon-park
        class="chart-selector-order-icon mr-1"
        v-if="orderType === 'desc'"
        type="arrow-circle-up"
        size="14"
        fill="#333"
        @click="handleClickOrder"
      />
    </template>
    <template #default>
      <div
        class="aggregation-option flex items-center cursor-pointer hover:bg-gray-100 py-1 justify-between px-2"
        @click="handleClickOrderAggregation(orderAggregation.value as OrderStore.OrderAggregationsType)"
        v-for="orderAggregation in filteredOrderAggregations"
      >
        <span class="text-xs">{{ orderAggregation.label }}</span>
        <!-- 复现用户选择的聚合条件 -->
        <icon-park
          class="aggregation-mark text-xs"
          type="correct"
          size="14"
          fill="#333"
          v-if="orderAggregation.value === aggregationType"
        />
      </div>
    </template>
  </selector-template>
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
  order: {
    type: Object as PropType<OrderStore.OrderOptions>,
    default: () => ({})
  }
})

const emits = defineEmits(['update:orderType', 'update:aggregationType', 'update:displayName'])

// 排序方式
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
 * @desc 根据字段类型过滤聚合方式
 */
const filteredOrderAggregations = computed(() => {
  const type = props.order?.columnType?.toLowerCase() || ''

  // 基础选项：原始值, 计数, 计数(去重)
  const baseOptions = ['raw', 'count', 'countDistinct']

  // 数值类型
  const numericTypes = [
    'int',
    'integer',
    'float',
    'double',
    'decimal',
    'numeric',
    'real',
    'tinyint',
    'smallint',
    'bigint',
    'number'
  ]
  if (numericTypes.some((t) => type.includes(t))) {
    return orderAggregations.value
  }

  // 时间类型
  const dateTypes = ['date', 'time', 'year']
  if (dateTypes.some((t) => type.includes(t))) {
    return orderAggregations.value.filter((item) => [...baseOptions, 'max', 'min'].includes(item.value))
  }

  // 其他类型（如字符串）仅展示基础选项
  return orderAggregations.value.filter((item) => baseOptions.includes(item.value))
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
  // 如果当前没有排序类型，才默认降序；否则保持用户当前的排序选择（连续性）
  if (!props.orderType) {
    emits('update:orderType', 'desc')
  }
  // 重新计算displayName
  const currentDisplayName = orderAggregations.value.find((item) => item.value === orderAggregationValue)?.label
  emits('update:displayName', `${currentDisplayName}(${props.name})`)
  selectorTemplateRef.value?.closePopover()
}

/**
 * @desc selector-template ref
 */
const selectorTemplateRef = ref()
</script>
<style lang="scss" scoped></style>
