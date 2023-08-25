<template>
  <div class="order relative h-full" @dragover="dragoverHandler" @drop="dropHandler">
    <div class="sort__title">排序</div>
    <div class="sort__content">
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
        <div class="sort__item__name">{{ item.name }}</div>
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
      padding: 0 10px;
      cursor: move;
      height: 30px;
      line-height: 30px;
      position: relative;
    }
  }
}
</style>
