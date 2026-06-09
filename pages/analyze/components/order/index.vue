<template>
  <div class="order relative h-full flex flex-col" @dragover="dragoverHandler" @drop="dropHandler">
    <div class="order__header flex items-center justify-between px-1">
      <span class="order__title">排序</span>
      <icon-park v-if="hasClearAll('orders')" type="clear" size="12" fill="#333" @click="clearAll('orders')" />
    </div>
    <div class="order__content flex-1">
      <div
        data-action="drag"
        class="order__item my-1"
        v-for="(orderOptions, index) in orderList"
        :key="index"
        draggable="true"
        @dragstart.native="dragstartHandler(index, $event)"
        @drag.native="dragHandler(index, $event)"
        @mousedown.stop
      >
        <selector-order
          class="order__item__name"
          :displayName="resolveOrderDisplayName(orderOptions)"
          :order="orderOptions"
          :index="index"
          :invalid="getOrderInvalid(orderOptions)"
          :invalidMessage="getOrderInvalidMessage(orderOptions)"
        >
          <template #order-aggregation>
            <el-tooltip effect="dark" :content="resolveOrderAggregationLabel(orderOptions)" placement="top">
              <span class="chart-selector-meta-label">{{ resolveOrderAggregationLabel(orderOptions) }}</span>
            </el-tooltip>
          </template>
          <template #order-direction>
            <icon-park
              class="chart-selector-direction-icon"
              v-if="orderOptions.orderRule.direction === 'asc'"
              type="arrow-circle-down"
              size="14"
              fill="#333"
              @click.stop="handleToggleDirection(orderOptions)"
              @contextmenu.stop
            />
            <icon-park
              class="chart-selector-direction-icon"
              v-else
              type="arrow-circle-up"
              size="14"
              fill="#333"
              @click.stop="handleToggleDirection(orderOptions)"
              @contextmenu.stop
            />
          </template>
          <template #aggregation-panel="{ closePopover }">
            <div
              v-for="option in getAnalyzeFieldAggregationOptions(orderOptions.columnType, true)"
              :key="option.value"
              class="aggregation-option flex items-center cursor-pointer hover:bg-gray-100 py-1 justify-between px-2"
              @click="handleSelectAggregation(orderOptions, option.value, closePopover)"
            >
              <span class="text-xs">{{ option.label }}</span>
              <icon-park
                v-if="orderOptions.orderRule.aggregation === option.value"
                class="aggregation-mark text-xs"
                type="correct"
                size="14"
                fill="#333"
              />
            </div>
          </template>
        </selector-order>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { IconPark } from '@icon-park/vue-next/es/all'
import { clearAllHandler } from '../clearAll'
import {
  getAnalyzeFieldAggregationLabel,
  getAnalyzeFieldAggregationOptions
} from '@/shared/analyzeFieldAggregationOptions'
import { setAnalyzeOrderFieldAggregation, toggleAnalyzeOrderFieldDirection } from '@/shared/analyzeConfigFieldRules'
import {
  addFieldToOrders,
  getAnalyzeFieldDropTargetIndex,
  reorderOrders,
  syncOrderOptionDisplayName
} from '../fieldTransfer'

const { clearAll, hasClearAll } = clearAllHandler()

const orderStore = useOrdersStore()

const orderList = computed<OrderStore.OrderOption[]>(() => orderStore.getOrders)

const orderColumnCountMap = computed(() => {
  return orderList.value.reduce<Record<string, number>>((countMap, item) => {
    if (!item.columnName) return countMap
    countMap[item.columnName] = (countMap[item.columnName] || 0) + 1
    return countMap
  }, {})
})

const resolveOrderDisplayName = (order: OrderStore.OrderOption) => {
  return order.displayName || order.columnComment || order.columnName || ''
}

const resolveOrderAggregationLabel = (order: OrderStore.OrderOption) => {
  return getAnalyzeFieldAggregationLabel(order.orderRule.aggregation)
}

const getOrderInvalid = (order: OrderStore.OrderOption) => {
  return getOrderInvalidMessage(order) !== ''
}

const getOrderInvalidMessage = (order: OrderStore.OrderOption) => {
  if (!order.columnName) return ''
  if ((orderColumnCountMap.value[order.columnName] || 0) > 1) {
    return '该排序已存在'
  }
  return ''
}

const handleToggleDirection = (order: OrderStore.OrderOption) => {
  order.orderRule = toggleAnalyzeOrderFieldDirection(order.orderRule)
  syncOrderOptionDisplayName(order)
}

const handleSelectAggregation = (
  order: OrderStore.OrderOption,
  aggregationType: OrderStore.OrderAggregationsType,
  closePopover?: () => void
) => {
  order.orderRule = setAnalyzeOrderFieldAggregation(order.orderRule, aggregationType)
  syncOrderOptionDisplayName(order)
  closePopover?.()
}

const dragstartHandler = (index: number, dragEvent: DragEvent) => {
  dragEvent.dataTransfer?.setData(
    'text',
    JSON.stringify({
      from: 'orders',
      index,
      value: orderList.value[index]
    })
  )
}

const dragHandler = (_index: number, dragEvent: DragEvent) => {
  dragEvent.preventDefault()
}

const dragoverHandler = (dragEvent: DragEvent) => {
  dragEvent.preventDefault()
}

const dropHandler = (dragEvent: DragEvent) => {
  dragEvent.preventDefault()
  const data: DragData = JSON.parse(dragEvent.dataTransfer?.getData('text') || '{}')
  if (!data.value) return

  switch (data.from) {
    case 'orders': {
      const targetIndex = getAnalyzeFieldDropTargetIndex(
        '.order__content > [data-action="drag"]',
        data.index,
        dragEvent
      )
      if (targetIndex === data.index) return
      reorderOrders(data.index, targetIndex)
      break
    }
    default: {
      addFieldToOrders(data.value)
      break
    }
  }
}

watch(
  orderList,
  (orders) => {
    orders.forEach((order) => syncOrderOptionDisplayName(order))
  },
  { immediate: true, deep: true }
)
</script>

<style lang="scss" scoped>
.order {
  .order__content {
    list-style: none;
    overflow: auto;

    .order__item {
      cursor: move;
      position: relative;
    }
  }
}
</style>
