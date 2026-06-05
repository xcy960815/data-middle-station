<template>
  <div class="order-selector">
    <selector-template
      v-bind="$attrs"
      :display-name="displayName"
      :cast="cast"
      :index="index"
      :order="order"
      ref="selectorTemplateRef"
    >
      <template #suffix-icon>
        <!-- 降序 -->
        <icon-park
          class="chart-selector-suffix-icon chart-selector-order-icon mr-1"
          v-if="orderType === 'asc'"
          type="arrow-circle-down"
          size="14"
          fill="#333"
          @click="handleClickOrder"
        />
        <!-- 升序 -->
        <icon-park
          class="chart-selector-suffix-icon chart-selector-order-icon mr-1"
          v-if="orderType === 'desc'"
          type="arrow-circle-up"
          size="14"
          fill="#333"
          @click="handleClickOrder"
        />
      </template>
      <template #default>
        <selector-aggregation
          inline
          :include-raw="true"
          :column-type="order.columnType"
          :aggregation-type="aggregationType"
          tooltip="排序聚合方式"
          empty-label="选择聚合"
          @update:aggregation-type="handleClickOrderAggregation"
        />
      </template>
    </selector-template>
  </div>
</template>

<script lang="ts" setup>
import { IconPark } from '@icon-park/vue-next/es/all'
import SelectorAggregation from '../aggregation/index.vue'
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
    type: String as PropType<'measure' | 'dimension' | 'order' | 'filter'>,
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

const aggregationLabelMap: Record<OrderStore.OrderAggregationsType, string> = {
  raw: '原始值',
  count: '计数',
  countDistinct: '计数(去重)',
  sum: '总计',
  avg: '平均',
  max: '最大值',
  min: '最小值'
}

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
  const currentDisplayName = aggregationLabelMap[orderAggregationValue]
  emits('update:displayName', `${currentDisplayName}(${props.name})`)
  selectorTemplateRef.value?.closePopover()
}

/**
 * @desc selector-template ref
 */
const selectorTemplateRef = ref()
</script>
<style lang="scss" scoped>
.order-selector {
  position: relative;
}
</style>
