<template>
  <div class="order relative h-full flex flex-col" @dragover="dragoverHandler" @drop="dropHandler">
    <div class="sort__title my-1">排序</div>
    <div class="sort__content flex-auto">
      <div
        data-action="drag"
        class="sort__item"
        v-for="(item, index) in orderList"
        :key="index"
        draggable="true"
        @dragstart.native="dragstartHandler(index, $event)"
        @drag.native="dragHandler(index, $event)"
        @mousedown.stop
      >
        <selecter
          class="sort__item__name"
          cast="order"
          :name="item.name"
        ></selecter>
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

  .sort__content {
    list-style: none;
    overflow: auto;

    .sort__item {
      cursor: move;
      height: 30px;
      line-height: 30px;
      position: relative;
    }
  }
}
</style>
