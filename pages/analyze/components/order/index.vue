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
        v-for="(orderOptions, index) in orderList"
        :key="index"
        draggable="true"
        @dragstart.native="dragstartHandler(index, $event)"
        @drag.native="dragHandler(index, $event)"
        @mousedown.stop
      >
        <selector-order
          class="order__item__name"
          cast="order"
          :display-name="orderOptions.displayName"
          v-model:orderType="orderOptions.orderType"
          :column-name="orderOptions.columnName"
          :index="index"
          v-model:aggregationType="orderOptions.aggregationType"
          :order="orderOptions"
          :invalid="orderOptions.__invalid"
          :invalidMessage="orderOptions.__invalidMessage"
        ></selector-order>
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
const orderList = computed<OrderStore.OrderOptions[]>(() => orderStore.getOrders)

/**
 * @desc addOrder
 * @param {OrderStore.OrderOptions|Array<OrderStore.OrderOptions>} orders
 */
const addOrder = (order: OrderStore.OrderOptions | Array<OrderStore.OrderOptions>) => {
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
 * @param {number} index 当前拖拽的index
 * @param {DragEvent} dragEvent 拖拽事件
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
 * @desc dragHandler 拖拽事件
 * @param {number} index 当前拖拽的index
 * @param {DragEvent} dragEvent 拖拽事件
 * @returns {void}
 */
const dragHandler = (index: number, dragEvent: DragEvent) => {
  dragEvent.preventDefault()
}
/**
 * @desc dragoverHandler 拖拽事件
 * @param {DragEvent} dragEvent 拖拽事件
 * @returns {void}
 */
const dragoverHandler = (dragEvent: DragEvent) => {
  dragEvent.preventDefault()
  // dragEvent.dataTransfer.dropEffect = 'move';
}
/**
 * @desc dropHandler 拖拽事件
 * @param {DragEvent} dragEvent 拖拽事件
 * @returns {void}
 */
const dropHandler = (dragEvent: DragEvent) => {
  dragEvent.preventDefault()
  const data: DragData<ColumnsStore.ColumnOptions> = JSON.parse(dragEvent.dataTransfer?.getData('text') || '{}')

  const orderOption: OrderStore.OrderOptions = {
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
