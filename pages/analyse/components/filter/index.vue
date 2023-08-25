<template>
  <div class="filter relative h-full" @dragover="dragoverHandler" @drop="dropHandler">
    <div class="filter__title">筛选</div>
    <div class="filter__content">
      <div
        data-action="drag"
        class="filter__item"
        v-for="(item, index) in filterList"
        :key="index"
        draggable="true"
        @dragstart.native="dragstartHandler(index, $event)"
        @drag.native="dragHandler(index, $event)"
        @mousedown.stop
      >
        <div class="filter__item__name">{{ item.name }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { initData } from './init-data';
import { handler } from './handler';
const { filterList } = initData();
const { dragstartHandler, dragHandler, dragoverHandler, dropHandler } = handler({ filterList });
</script>

<style lang="less" scoped>
.filter {
  pointer-events: initial;

  .filter__content {
    list-style: none;
    overflow: auto;
    .filter__item {
      padding: 0 10px;
      cursor: move;
      height: 30px;
      line-height: 30px;
      position: relative;
    }
  }
}
</style>
