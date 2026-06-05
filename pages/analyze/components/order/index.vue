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
            <span class="chart-selector-meta-label">{{ resolveOrderAggregationLabel(orderOptions) }}</span>
          </template>
          <template #order-direction>
            <icon-park
              class="chart-selector-direction-icon"
              v-if="orderOptions.sort.direction === 'asc'"
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
          <template #context-menu>
            <context-menu-item
              v-for="option in getOrderAggregationOptions(orderOptions.columnType, true)"
              :key="option.value"
              @click="handleSelectAggregation(orderOptions, option.value)"
            >
              {{ option.label }}
              <span v-if="orderOptions.sort.aggregation === option.value" class="order-panel__checked">✓</span>
            </context-menu-item>
          </template>
        </selector-order>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { IconPark } from '@icon-park/vue-next/es/all'
import { clearAllHandler } from '../clearAll'
import { getOrderAggregationLabel, getOrderAggregationOptions } from '@/shared/orderAggregationOptions'
import { createDefaultOrderSort } from '@/shared/orderSort'

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
  return getOrderAggregationLabel(order.sort.aggregation)
}

const syncOrderDisplayName = (order: OrderStore.OrderOption) => {
  order.displayName = order.columnComment || order.columnName || ''
}

const createOrderOption = (field: ColumnsStore.ColumnOptions): OrderStore.OrderOption => {
  const { datasetAggregationType: _datasetAggregationType, ...columnOption } = field
  return {
    ...columnOption,
    sort: createDefaultOrderSort()
  }
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
  order.sort.direction = order.sort.direction === 'desc' ? 'asc' : 'desc'
  order.sort.aggregation = 'raw'
  syncOrderDisplayName(order)
}

const handleSelectAggregation = (order: OrderStore.OrderOption, aggregationType: OrderStore.OrderAggregationsType) => {
  order.sort.aggregation = aggregationType
  if (!order.sort.direction) {
    order.sort.direction = 'desc'
  }
  syncOrderDisplayName(order)
}

const addOrder = (order: OrderStore.OrderOption | Array<OrderStore.OrderOption>) => {
  order = Array.isArray(order) ? order : [order]
  orderStore.addOrders(order)
}

const getTargetIndex = (index: number, dragEvent: DragEvent): number => {
  const dropY = dragEvent.clientY
  const ys = [].slice
    .call(document.querySelectorAll('.order__content > [data-action="drag"]'))
    .map(
      (element: HTMLDivElement) => (element.getBoundingClientRect().top + element.getBoundingClientRect().bottom) / 2
    )
  ys.splice(index, 1)
  let targetIndex = ys.findIndex((e) => dropY < e)
  if (targetIndex === -1) {
    targetIndex = ys.length
  }
  return targetIndex
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

const dragHandler = (index: number, dragEvent: DragEvent) => {
  dragEvent.preventDefault()
}

const dragoverHandler = (dragEvent: DragEvent) => {
  dragEvent.preventDefault()
}

const dropHandler = (dragEvent: DragEvent) => {
  dragEvent.preventDefault()
  const data: DragData<ColumnsStore.ColumnOptions> = JSON.parse(dragEvent.dataTransfer?.getData('text') || '{}')

  const orderOption = createOrderOption(data.value)
  syncOrderDisplayName(orderOption)

  switch (data.from) {
    case 'orders': {
      const targetIndex = getTargetIndex(data.index, dragEvent)
      if (targetIndex === data.index) return
      const orders = JSON.parse(JSON.stringify(orderStore.orders))
      const target = orders.splice(data.index, 1)[0]
      orders.splice(targetIndex, 0, target)
      orderStore.setOrders(orders)
      break
    }
    default: {
      addOrder(orderOption)
      break
    }
  }
}

watch(
  orderList,
  (orders) => {
    orders.forEach((order) => syncOrderDisplayName(order))
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

.order-panel__checked {
  margin-left: 8px;
  color: #409eff;
}
</style>
