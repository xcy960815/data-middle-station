<template>
  <div class="order relative h-full flex flex-col" @dragover="dragoverHandler" @drop="dropHandler">
    <div class="order__title my-1">排序</div>
    <div class="order__content flex-auto">
      <div
        data-action="drag"
        class="order__item"
        v-for="(item, index) in orderList"
        :key="index"
        draggable="true"
        @dragstart.native="dragstartHandler(index, $event)"
        @drag.native="dragHandler(index, $event)"
        @mousedown.stop
      >
        <selecter-order
          class="order__item__name"
          cast="order"
          v-model:displayName="item.displayName"
          v-model:orderType="item.orderType"
          :name="item.columnName"
          :index="index"
          v-model:aggregationType="item.aggregationType"
        ></selecter-order>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { initData } from './init-data';
import { handler } from './handler';
const { orderList } = initData();
const { dragstartHandler, dragHandler, dragoverHandler, dropHandler } = handler({ orderList });

</script>

<style lang="less" scoped>
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
