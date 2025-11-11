<template>
  <div class="order relative h-full flex flex-col" @dragover="dragoverHandler" @drop="dropHandler">
    <div class="order__header flex items-center justify-between px-1">
      <span class="order__title">排序</span>
      <icon-park v-if="hasClearAll('orders')" type="clear" size="12" fill="#333" @click="clearAll('orders')" />
    </div>
    <div class="order__content flex-auto">
      <div
        data-action="drag"
        class="order__item my-1"
        v-for="(orderOption, index) in orderList"
        :key="index"
        draggable="true"
        @dragstart.native="dragstartHandler(index, $event)"
        @drag.native="dragHandler(index, $event)"
        @mousedown.stop
      >
        <selecter-order
          class="order__item__name"
          cast="order"
          :display-name="orderOption.displayName"
          v-model:orderType="orderOption.orderType"
          :column-name="orderOption.columnName"
          :index="index"
          v-model:aggregationType="orderOption.aggregationType"
          :order="orderOption"
          :invalid="orderOption.__invalid"
          :invalidMessage="orderOption.__invalidMessage"
        ></selecter-order>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { IconPark } from '@icon-park/vue-next/es/all'
import { clearAllHandler } from '../clearAll'
const { clearAll, hasClearAll } = clearAllHandler()

const orderStore = useOrdersStore()
/**
 * @desc orderList
 */
const orderList = computed<OrderStore.OrderState['orders']>(() => {
  return orderStore.getOrders
})

/**
 * @desc addOrder
 * @param {OrderStore.OrderOption|Array<OrderStore.OrderOption>} orders
 */
const addOrder = (order: OrderStore.OrderOption | Array<OrderStore.OrderOption>) => {
  order = Array.isArray(order) ? order : [order]
  orderStore.addOrders(order)
}
/**
 * @desc getTargetIndex
 * @param {number} index
 * @param {DragEvent} dragEvent
 * @returns {number}
 */
const getTargetIndex = (index: number, dragEvent: DragEvent): number => {
  const dropY = dragEvent.clientY // 落点Y
  let ys = [].slice
    .call(document.querySelectorAll('.sort__content > [data-action="drag"]'))
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

/**
 * @desc dragstartHandler
 * @param {number} index
 * @param {DragEvent} dragEvent
 * @returns {void}
 */
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
/**
 * @desc dragHandler
 * @param {number} index
 * @param {DragEvent} dragEvent
 * @returns {void}
 */
const dragHandler = (index: number, dragEvent: DragEvent) => {
  dragEvent.preventDefault()
}
/**
 * @desc dragoverHandler
 * @param {DragEvent} dragEvent
 * @returns {void}
 */
const dragoverHandler = (dragEvent: DragEvent) => {
  dragEvent.preventDefault()
  // dragEvent.dataTransfer.dropEffect = 'move';
}
/**
 * @desc dropHandler
 * @param {DragEvent} dragEvent
 * @returns {void}
 */
const dropHandler = (dragEvent: DragEvent) => {
  dragEvent.preventDefault()
  const data: DragData<ColumnStore.ColumnOption> = JSON.parse(dragEvent.dataTransfer?.getData('text') || '{}')

  const orderOption: OrderStore.OrderOption = {
    ...data.value,
    // 默认降序
    orderType: 'desc',
    aggregationType: 'count'
  }
  const isSelected = orderStore.getOrders.find((item) => item.columnName === orderOption.columnName)
  if (isSelected) {
    // TODO 提示用户已经选中了
    orderOption.__invalid = true
    orderOption.__invalidMessage = '该排序已存在'
  }
  switch (data.from) {
    case 'orders': {
      // 调整顺序
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
</script>

<style lang="scss" scoped>
.order {
  pointer-events: initial;

  .order__content {
    list-style: none;
    overflow: auto;

    .order__item {
      cursor: move;
      height: 30px;
      line-height: 30px;
      position: relative;
    }
  }
}
</style>
